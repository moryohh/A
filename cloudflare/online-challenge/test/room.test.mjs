import assert from 'node:assert/strict';
import { test } from 'node:test';
import worker, { ChallengeRegistry, ChallengeRoom } from '../src/worker.js';

test('preview origin is allowed explicitly and unrelated origins are denied', async () => {
  const env = { ALLOWED_ORIGINS: 'https://a-1q1.pages.dev,https://challenge-preview.a-1q1.pages.dev' };
  const preview = await worker.fetch(new Request('https://worker/health', {
    headers: { Origin: 'https://challenge-preview.a-1q1.pages.dev' },
  }), env);
  assert.equal(preview.status, 200);
  assert.equal(preview.headers.get('Access-Control-Allow-Origin'), 'https://challenge-preview.a-1q1.pages.dev');
  const rejected = await worker.fetch(new Request('https://worker/health', {
    headers: { Origin: 'https://unknown.example' },
  }), env);
  assert.equal(rejected.status, 403);
});

test('guest access accepts both stable and deployment preview origins', async () => {
  const env = {
    ALLOWED_ORIGINS: 'https://duha-challenge-preview.pages.dev,https://abc123.duha-challenge-preview.pages.dev',
    ALLOW_PREVIEW_GUESTS: 'true',
    PREVIEW_GUEST_ORIGINS: 'https://duha-challenge-preview.pages.dev,https://abc123.duha-challenge-preview.pages.dev',
  };
  const origins = [
    ...env.PREVIEW_GUEST_ORIGINS.split(','),
    'https://older-build.duha-challenge-preview.pages.dev',
  ];
  for (const origin of origins) {
    const response = await worker.fetch(new Request('https://worker/rooms', {
      method: 'POST',
      headers: {
        Origin: origin,
        Authorization: 'Guest 123e4567-e89b-42d3-a456-426614174000',
        'Content-Type': 'application/json',
      },
      body: '{}',
    }), env);
    assert.equal(response.status, 400);
    assert.equal(response.headers.get('Access-Control-Allow-Origin'), origin);
  }
});

test('room accepts the option counts used by true/false and card games', async () => {
  for (const [gameType, optionCount] of [['true_false', 2], ['gibha_sah', 12]]) {
    const data = new Map();
    const room = new ChallengeRoom({
      storage: { get: async key => data.get(key), put: async (key, value) => data.set(key, structuredClone(value)) },
      getWebSockets: () => [],
    });
    const response = await room.fetch(new Request('https://room/internal/init', {
      method: 'POST',
      body: JSON.stringify({
        hostId: 'host', gameType,
        questions: [{ question: 'Question?', options: Array.from({ length: optionCount }, (_, index) => `option-${index}`), correctAnswer: optionCount - 1 }],
      }),
    }));
    assert.equal(response.status, 200);
    assert.equal(data.get('game').gameType, gameType);
  }
});

test('live classroom supports 50 students and teacher-controlled permissions', async () => {
  const data = new Map();
  const received = [];
  const hostSocket = { deserializeAttachment: () => ({ userId: 'teacher' }), send: message => received.push(JSON.parse(message)) };
  const studentSocket = { deserializeAttachment: () => ({ userId: 'student-1' }), send: message => received.push(JSON.parse(message)) };
  const room = new ChallengeRoom({
    storage: { get: async key => data.get(key), put: async (key, value) => data.set(key, structuredClone(value)) },
    getWebSockets: () => [hostSocket, studentSocket],
  });
  const response = await room.fetch(new Request('https://room/internal/init', {
    method: 'POST', body: JSON.stringify({
      hostId: 'teacher', gameType: 'live_classroom', roomCode: '5050', capacity: 50, durationMinutes: 45,
      contentMode: 'booklet', content: { subject: 'physics', chapter: 1, lesson: 2 },
      questions: [{ question: 'درس مباشر', options: ['شرح', 'متابعة'], correctAnswer: 0 }],
    }),
  }));
  assert.equal(response.status, 200);
  const game = data.get('game');
  game.players.push({ id: 'student-1', score: 0, answer: null, handRaised: false, micAllowed: false, drawAllowed: false });
  data.set('game', game);
  await room.webSocketMessage(studentSocket, JSON.stringify({ type: 'raise_hand', raised: true }));
  assert.equal(data.get('game').players[1].handRaised, true);
  await room.webSocketMessage(hostSocket, JSON.stringify({ type: 'classroom_control', action: 'mic_permission', targetId: 'student-1', value: true }));
  assert.equal(data.get('game').players[1].micAllowed, true);
  assert.equal(data.get('game').players[1].handRaised, false);
  await room.webSocketMessage(hostSocket, JSON.stringify({ type: 'classroom_control', action: 'answers_locked', value: false }));
  assert.equal(data.get('game').answersLocked, false);
  await room.webSocketMessage(studentSocket, JSON.stringify({ type: 'classroom_progress', progress: { step: 2, solved: 3, total: 7, answer: '42' } }));
  assert.deepEqual(data.get('game').players[1].progress, { step: 2, solved: 3, total: 7, answer: '42' });
  await room.webSocketMessage(hostSocket, JSON.stringify({ type: 'classroom_presenter_state', state: { activeId: 'q1', scrollY: 240 } }));
  assert.deepEqual(data.get('game').presenterState, { activeId: 'q1', scrollY: 240 });
  await room.webSocketMessage(hostSocket, JSON.stringify({ type: 'classroom_control', action: 'select_presenter', targetId: 'student-1' }));
  assert.equal(data.get('game').presenterId, 'student-1');
  assert.equal(data.get('game').players[1].drawAllowed, true);
  await room.webSocketMessage(studentSocket, JSON.stringify({ type: 'classroom_presenter_state', state: { activeId: 'q2', scrollY: 310 } }));
  assert.deepEqual(data.get('game').presenterState, { activeId: 'q2', scrollY: 310 });
  await room.webSocketMessage(hostSocket, JSON.stringify({ type: 'classroom_control', action: 'restore_presenter' }));
  assert.equal(data.get('game').presenterId, 'teacher');
  assert.equal(data.get('game').players[1].drawAllowed, false);
  data.get('game').players[1].joinedAt = Date.now() - 61000;
  await room.webSocketMessage(studentSocket, JSON.stringify({ type: 'classroom_mission', text: 'قراءة أربع صفحات', target: 4, progress: 4 }));
  assert.deepEqual(data.get('game').players[1].mission.text, 'قراءة أربع صفحات');
  assert.equal(data.get('game').players[1].mission.completed, true);
  await room.webSocketMessage(hostSocket, JSON.stringify({ type: 'classroom_control', action: 'shared_mission', value: 'نقرأ الفصل الأول معًا' }));
  assert.equal(room.view(data.get('game')).classroom.sharedMission, 'نقرأ الفصل الأول معًا');
  await room.webSocketMessage(studentSocket, JSON.stringify({ type: 'classroom_booklet_share', index: 2, question: 'سؤال واحد', answer: 'إجابة واحدة' }));
  await room.webSocketMessage(studentSocket, JSON.stringify({ type: 'classroom_booklet_share', index: 2, question: 'سؤال واحد', answer: 'إجابة واحدة' }));
  assert.equal(data.get('game').bookletShares.length, 1);
  assert.equal(room.view(data.get('game')).classroom.capacity, 50);
  assert.equal(room.view(data.get('game')).classroom.contentMode, 'booklet');
});

test('live classroom schedules the requested two bot waves', async () => {
  const data = new Map();
  const alarms = [];
  const room = new ChallengeRoom({
    storage: {
      get: async key => data.get(key),
      put: async (key, value) => data.set(key, structuredClone(value)),
      setAlarm: async value => alarms.push(value),
    },
    getWebSockets: () => [],
  });
  const startedAt = Date.now();
  const response = await room.fetch(new Request('https://room/internal/init', {
    method: 'POST', body: JSON.stringify({
      hostId: 'teacher', gameType: 'live_classroom', roomCode: '6060',
      contentMode: 'booklet', questions: [{ question: 'درس مباشر', options: ['شرح', 'متابعة'], correctAnswer: 0 }],
    }),
  }));
  const finishedAt = Date.now();
  assert.equal(response.status, 200);
  const schedule = data.get('game').classroomBotSchedule;
  assert.equal(schedule.length, 3);
  assert.ok(schedule[0].joinAt >= startedAt + 10000 && schedule[0].joinAt <= finishedAt + 30000);
  assert.equal(schedule[0].stayMs, 120000);
  assert.ok(schedule[1].joinAt >= startedAt + 70000 && schedule[1].joinAt <= finishedAt + 79000);
  assert.ok(schedule[2].joinAt >= startedAt + 80000 && schedule[2].joinAt <= finishedAt + 90000);
  assert.ok(schedule.slice(1).every(event => event.stayMs >= 240000 && event.stayMs <= 480000));
  assert.equal(new Set(schedule.map(event => event.id)).size, 3);
  assert.equal(new Set(schedule.map(event => event.profileIndex)).size, 3);
  assert.equal(new Set(schedule.map(event => event.score)).size, 3);
  assert.ok(alarms[0] >= schedule[0].joinAt);
});

test('live classroom bots join and leave independently without occupying human seats', async () => {
  const data = new Map();
  const received = [];
  const teacherSocket = { deserializeAttachment: () => ({ userId: 'teacher' }), send: message => received.push(JSON.parse(message)) };
  const room = new ChallengeRoom({
    storage: {
      get: async key => data.get(key),
      put: async (key, value) => data.set(key, structuredClone(value)),
      setAlarm: async () => {},
    },
    getWebSockets: () => [teacherSocket],
  });
  await room.fetch(new Request('https://room/internal/init', {
    method: 'POST', body: JSON.stringify({
      hostId: 'teacher', gameType: 'live_classroom', roomCode: '6161', capacity: 2,
      contentMode: 'booklet', questions: [{ question: 'درس مباشر', options: ['شرح', 'متابعة'], correctAnswer: 0 }],
    }),
  }));
  let game = data.get('game');
  game.classroomBotSchedule[0].joinAt = Date.now() - 1;
  game.classroomBotSchedule[1].joinAt = Date.now() + 60000;
  game.classroomBotSchedule[2].joinAt = Date.now() + 70000;
  data.set('game', game);
  await room.alarm();
  game = data.get('game');
  assert.equal(game.players.length, 2);
  assert.equal(game.players[1].id, game.classroomBotSchedule[0].id);
  assert.equal(game.players[1].micAllowed, false);
  assert.equal(game.players[1].activity, 'انضم إلى الدرس');

  const availableTicket = await room.fetch(new Request('https://room/internal/ticket', {
    method: 'POST', body: JSON.stringify({ userId: 'student' }),
  }));
  assert.equal(availableTicket.status, 200);

  game.classroomBotSchedule[0].leaveAt = Date.now() - 1;
  game.classroomBotSchedule[1].joinAt = Date.now() - 1;
  data.set('game', game);
  await room.alarm();
  game = data.get('game');
  assert.equal(game.players.length, 2);
  assert.equal(game.classroomBotSchedule[0].left, true);
  assert.equal(game.players[1].id, game.classroomBotSchedule[1].id);
  assert.ok(received.some(message => message.type === 'state' && message.players.some(player => player.bot)));
});

test('two players finish a match; duplicate answers and third player are rejected', async () => {
  const data = new Map();
  const messages = new Map([['host', []], ['guest', []]]);
  const sockets = [...messages].map(([userId, received]) => ({
    deserializeAttachment: () => ({ userId }),
    send: (message) => received.push(JSON.parse(message)),
  }));
  const room = new ChallengeRoom({
    storage: {
      get: async key => data.get(key),
      put: async (key, value) => data.set(key, structuredClone(value)),
    },
    getWebSockets: () => sockets,
  });
  const questions = [
    { question: 'First?', options: ['a', 'b', 'c', 'd'], correctAnswer: 0 },
    { question: 'Second?', options: ['a', 'b', 'c', 'd'], correctAnswer: 1 },
  ];
  const init = await room.fetch(new Request('https://room/internal/init', {
    method: 'POST', body: JSON.stringify({ hostId: 'host', gameType: 'millionaire', questions }),
  }));
  assert.equal(init.status, 200);
  data.set('game', { gameType: 'millionaire', status: 'playing', round: 0, turn: 'host', questions, players: [
    { id: 'host', score: 0, answer: null }, { id: 'guest', score: 0, answer: null },
  ] });

  const third = await room.fetch(new Request('https://room/internal/ticket', {
    method: 'POST', body: JSON.stringify({ userId: 'third' }),
  }));
  assert.equal(third.status, 409);
  await room.webSocketMessage(sockets[0], JSON.stringify({ type: 'answer', option: 0 }));
  await room.webSocketMessage(sockets[0], JSON.stringify({ type: 'answer', option: 1 }));
  assert.equal(data.get('game').round, 1);
  assert.equal(data.get('game').turn, 'guest');
  assert.equal(messages.get('host').filter(message => message.type === 'round_result').length, 1);
  await room.webSocketMessage(sockets[1], JSON.stringify({ type: 'answer', option: 1 }));
  assert.equal(data.get('game').round, 2);
  assert.deepEqual(data.get('game').players.map(player => player.score), [1, 1]);
  assert.equal(messages.get('host').find(message => message.type === 'round_result').answer, 0);
  assert.equal(messages.get('guest').find(message => message.type === 'round_result').selected, 0);
  assert.equal(data.get('game').status, 'finished');
  assert.equal(room.view(data.get('game')).tie, true);
  await room.webSocketMessage(sockets[0], JSON.stringify({ type: 'answer', option: 1 }));
  assert.deepEqual(data.get('game').players.map(player => player.score), [1, 1]);
});

test('temporary disconnect gets a 30 second grace period then a bot continues the match', async () => {
  const data = new Map();
  let alarmAt = null;
  const messages = [];
  const guestSocket = { deserializeAttachment: () => ({ userId: 'guest' }), send: message => messages.push(JSON.parse(message)) };
  const hostSocket = { deserializeAttachment: () => ({ userId: 'host' }), send: message => messages.push(JSON.parse(message)) };
  const room = new ChallengeRoom({
    storage: {
      get: async key => data.get(key),
      put: async (key, value) => data.set(key, structuredClone(value)),
      setAlarm: async value => { alarmAt = value; },
      deleteAlarm: async () => { alarmAt = null; },
    },
    getWebSockets: () => [hostSocket],
  });
  data.set('game', {
    gameType: 'true_false', roomCode: '1234', hostId: 'host', status: 'playing', round: 0,
    questions: [{ question: 'Question?', options: ['صح', 'خطأ'], correctAnswer: 0 }],
    players: [{ id: 'host', score: 0, answer: null }, { id: 'guest', score: 0, answer: null }],
  });

  await room.handleDisconnect(guestSocket);
  assert.equal(data.get('game').status, 'playing');
  assert.equal(data.get('game').disconnectUserId, 'guest');
  assert.ok(alarmAt > Date.now());
  assert.equal(messages.some(message => message.type === 'challenge_ended'), false);

  const expired = data.get('game');
  expired.disconnectDeadline = Date.now() - 1;
  data.set('game', expired);
  await room.alarm();
  assert.equal(data.get('game').status, 'playing');
  assert.equal(data.get('game').players[1].id, 'bot:duha-challenge');
  assert.ok(data.get('game').botAnswerAt > Date.now());
  assert.equal(messages.some(message => message.type === 'bot_joined'), true);
  assert.equal(messages.some(message => message.type === 'challenge_ended'), false);
});

test('host close starts grace period even while the closing socket is still listed', async () => {
  const data = new Map();
  let alarmAt = null;
  const messages = [];
  const hostSocket = { deserializeAttachment: () => ({ userId: 'host' }), send: message => messages.push(JSON.parse(message)) };
  const guestSocket = { deserializeAttachment: () => ({ userId: 'guest' }), send: message => messages.push(JSON.parse(message)) };
  const room = new ChallengeRoom({
    storage: {
      get: async key => data.get(key),
      put: async (key, value) => data.set(key, structuredClone(value)),
      setAlarm: async value => { alarmAt = value; },
      deleteAlarm: async () => { alarmAt = null; },
    },
    getWebSockets: () => [hostSocket, guestSocket],
  });
  data.set('game', {
    gameType: 'true_false', roomCode: '5678', hostId: 'host', status: 'playing', round: 0, questionIndex: 0, turn: 'host',
    questions: [{ question: 'Question?', options: ['صح', 'خطأ'], correctAnswer: 0 }],
    players: [{ id: 'host', score: 0, answer: null }, { id: 'guest', score: 0, answer: null }],
  });

  await room.handleDisconnect(hostSocket);
  assert.equal(data.get('game').disconnectUserId, 'host');
  assert.ok(alarmAt > Date.now());

  const expired = data.get('game');
  expired.disconnectDeadline = Date.now() - 1;
  data.set('game', expired);
  // The platform removes the closed socket before the alarm fires.
  room.ctx.getWebSockets = () => [guestSocket];
  await room.alarm();
  assert.equal(data.get('game').players[0].id, 'bot:duha-challenge');
  assert.equal(data.get('game').turn, 'bot:duha-challenge');
  assert.ok(data.get('game').botAnswerAt > Date.now());
});

test('true false timeout gives no point and advances the turn', async () => {
  const data = new Map();
  let alarmAt = null;
  const messages = [];
  const hostSocket = { deserializeAttachment: () => ({ userId: 'host' }), send: message => messages.push(JSON.parse(message)) };
  const guestSocket = { deserializeAttachment: () => ({ userId: 'guest' }), send: message => messages.push(JSON.parse(message)) };
  const room = new ChallengeRoom({
    storage: { get: async key => data.get(key), put: async (key, value) => data.set(key, structuredClone(value)), setAlarm: async value => { alarmAt = value; }, deleteAlarm: async () => { alarmAt = null; } },
    getWebSockets: () => [hostSocket, guestSocket],
  });
  data.set('game', {
    gameType: 'true_false', roomCode: '2468', hostId: 'host', status: 'playing', round: 0, questionIndex: 0, turn: 'host', questionDeadline: Date.now() - 1,
    questions: [{ question: 'Q1?', options: ['صح', 'خطأ'], correctAnswer: 0 }, { question: 'Q2?', options: ['صح', 'خطأ'], correctAnswer: 1 }],
    players: [{ id: 'host', score: 0, answer: null, character: 'anime' }, { id: 'guest', score: 0, answer: null, character: 'student' }],
  });

  await room.alarm();
  const game = data.get('game');
  assert.equal(game.round, 1);
  assert.equal(game.turn, 'guest');
  assert.deepEqual(game.players.map(player => player.score), [0, 0]);
  assert.ok(game.questionDeadline > Date.now());
  assert.equal(messages.some(message => message.type === 'round_result' && message.timedOut === true && message.selected === -1), true);
  assert.ok(alarmAt > Date.now());
});

test('gibha sah timeout keeps the card, awards no point, and passes to the next player', async () => {
  const data = new Map();
  const messages = [];
  const sockets = ['host', 'guest', 'third', 'fourth'].map(id => ({ deserializeAttachment: () => ({ userId: id }), send: message => messages.push(JSON.parse(message)) }));
  const room = new ChallengeRoom({
    storage: { get: async key => data.get(key), put: async (key, value) => data.set(key, structuredClone(value)), setAlarm: async () => {}, deleteAlarm: async () => {} },
    getWebSockets: () => sockets,
  });
  const questions = Array.from({ length: 4 }, (_, index) => ({ question: `Q${index}?`, options: [`right-${index}`, `wrong-${index}`], correctAnswer: 0 }));
  await room.fetch(new Request('https://room/internal/init', { method: 'POST', body: JSON.stringify({ hostId: 'host', gameType: 'gibha_sah', questions }) }));
  const game = data.get('game');
  game.status = 'playing';
  game.players = sockets.map((socket, index) => ({ id: ['host', 'guest', 'third', 'fourth'][index], score: 0, answer: null }));
  game.turn = 'host';
  room.prepareGibhaBoard(game);
  game.questionDeadline = Date.now() - 1;
  data.set('game', game);
  await room.alarm();
  const next = data.get('game');
  assert.equal(next.turn, 'guest');
  assert.equal(next.status, 'playing');
  assert.deepEqual(next.players.map(player => player.score), [0, 0, 0, 0]);
  assert.equal(next.gibhaBoardOptions.includes('right-0'), true);
  assert.equal(next.questionDeadline > Date.now(), true);
  assert.equal(messages.some(message => message.type === 'round_result' && message.timedOut), true);
});

test('true false assigns different random characters to two players', () => {
  const room = new ChallengeRoom({ storage: {}, getWebSockets: () => [] });
  const game = { players: [{ id: 'host' }, { id: 'guest' }] };
  room.assignCharacter(game, game.players[0]);
  room.assignCharacter(game, game.players[1]);
  assert.ok(['anime', 'student', 'student2'].includes(game.players[0].character));
  assert.ok(['anime', 'student', 'student2'].includes(game.players[1].character));
  assert.notEqual(game.players[0].character, game.players[1].character);
});

test('two-player games schedule one development bot after five-to-ten seconds', async () => {
  for (const gameType of ['millionaire', 'true_false']) {
  const data = new Map();
  let alarmAt = null;
  const messages = [];
  const hostSocket = { deserializeAttachment: () => ({ userId: 'host' }), send: message => messages.push(JSON.parse(message)) };
  const room = new ChallengeRoom({
    storage: {
      get: async key => data.get(key),
      put: async (key, value) => data.set(key, structuredClone(value)),
      setAlarm: async value => { alarmAt = value; },
      deleteAlarm: async () => { alarmAt = null; },
    },
    getWebSockets: () => [hostSocket],
  }, { MATCHMAKING_BOT_MIN_MS: '5000', MATCHMAKING_BOT_MAX_MS: '10000' });
  const questions = [{ question: 'Question?', options: ['a', 'b'], correctAnswer: 0 }];
  const startedAt = Date.now();
  await room.fetch(new Request('https://room/internal/init', {
    method: 'POST', body: JSON.stringify({ hostId: 'host', gameType, roomCode: '4321', questions }),
  }));
  assert.ok(alarmAt >= startedAt + 5000);
  assert.ok(alarmAt <= Date.now() + 10000);
  const waiting = data.get('game');
  assert.equal(waiting.matchmakingBotSchedule.length, 1);
  waiting.matchmakingBotSchedule[0].joinAt = Date.now() - 1;
  data.set('game', waiting);
  await room.alarm();
  assert.equal(data.get('game').status, 'playing');
  assert.equal(data.get('game').players[1].id.startsWith('bot:team:match:'), true);
  if (gameType === 'true_false') assert.ok(data.get('game').questionDeadline > Date.now());
  assert.equal(messages.some(message => message.type === 'bot_joined'), true);
  }
});

test('bot answers after its delay and completes every supported game type', async () => {
  for (const gameType of ['millionaire', 'true_false', 'gibha_sah']) {
    const data = new Map();
    const messages = [];
    const hostSocket = { deserializeAttachment: () => ({ userId: 'host' }), send: message => messages.push(JSON.parse(message)) };
    const room = new ChallengeRoom({
      storage: {
        get: async key => data.get(key),
        put: async (key, value) => data.set(key, structuredClone(value)),
        setAlarm: async () => {}, deleteAlarm: async () => {},
      },
      getWebSockets: () => [hostSocket],
    });
    const optionCount = gameType === 'true_false' ? 2 : gameType === 'gibha_sah' ? 10 : 4;
    const questions = [0, 1, 2].map((round) => ({ question: `Question ${round + 1}?`, options: Array.from({ length: optionCount }, (_, index) => `option-${index}`), correctAnswer: round % optionCount }));
    if (gameType === 'gibha_sah') room.chooseBotAnswer = game => game.questions[game.round].correctAnswer;
    const now = Date.now();
    data.set('game', {
      gameType, roomCode: '1111', hostId: 'host', status: 'playing', round: 0, questionIndex: 0, turn: 'bot:duha-challenge', questions,
      players: [{ id: 'host', score: 0, answer: 0 }, { id: 'bot:duha-challenge', score: 0, answer: null }],
      botAnswerAt: now + 3000,
    });
    for (let round = 0; round < questions.length; round += 1) {
      const ready = data.get('game');
      ready.turn = 'bot:duha-challenge';
      ready.players[0].answer = round % optionCount;
      ready.botAnswerAt = Date.now() - 1;
      data.set('game', ready);
      await room.alarm();
    }
    assert.equal(data.get('game').status, 'finished');
    assert.equal(messages.filter(message => message.type === 'round_result').length, questions.length);
  }
});

test('millionaire team fills four seats after five seconds and alternates 2v2 team turns', async () => {
  const data = new Map();
  let alarmAt = null;
  const messages = [];
  const hostSocket = { deserializeAttachment: () => ({ userId: 'host' }), send: message => messages.push(JSON.parse(message)) };
  const mateSocket = { deserializeAttachment: () => ({ userId: 'mate' }), send: message => messages.push(JSON.parse(message)) };
  const room = new ChallengeRoom({
    storage: { get: async key => data.get(key), put: async (key, value) => data.set(key, structuredClone(value)), setAlarm: async value => { alarmAt = value; }, deleteAlarm: async () => {} },
    getWebSockets: () => [hostSocket, mateSocket],
  }, { MATCHMAKING_BOT_MIN_MS: '5000', MATCHMAKING_BOT_MAX_MS: '10000' });
  const questions = Array.from({ length: 20 }, (_, index) => ({ question: `Team ${index}?`, options: ['a', 'b', 'c', 'd'], correctAnswer: 0 }));
  const startedAt = Date.now();
  const response = await room.fetch(new Request('https://room/internal/init', { method: 'POST', body: JSON.stringify({ hostId: 'host', gameType: 'millionaire_team', questions }) }));
  assert.equal(response.status, 200);
  assert.ok(alarmAt >= startedAt + 5000 && alarmAt <= Date.now() + 10000);
  const waiting = data.get('game');
  waiting.players.push({ id: 'mate', team: 'A', score: 0, answer: null });
  waiting.matchmakingBotSchedule[0].joinAt = Date.now() - 1;
  data.set('game', waiting);
  await room.alarm();
  assert.equal(data.get('game').players.length, 3);
  assert.equal(data.get('game').status, 'waiting');
  const oneBotWaiting = data.get('game');
  oneBotWaiting.matchmakingBotSchedule.find(event => !event.joined && !event.cancelled).joinAt = Date.now() - 1;
  data.set('game', oneBotWaiting);
  await room.alarm();
  assert.equal(data.get('game').players.length, 4);
  assert.deepEqual(data.get('game').players.map(player => player.team), ['A', 'A', 'B', 'B']);
  assert.deepEqual(data.get('game').teamLives, { A: 3, B: 3 });
  assert.equal(data.get('game').turn, 'host');
  assert.ok(data.get('game').questionDeadline > Date.now());
  await room.webSocketMessage(hostSocket, JSON.stringify({ type: 'answer', option: 0 }));
  assert.equal(data.get('game').round, 1);
  assert.equal(data.get('game').activeTeam, 'B');
  assert.equal(room.isBot(data.get('game').players.find(player => player.id === data.get('game').turn)), true);
  assert.equal(messages.some(message => message.type === 'round_result' && message.answeredTeam === 'A'), true);
});

test('gibha sah fills four seats and rotates the turn through all players', async () => {
  const data = new Map();
  let alarmAt = null;
  const messages = [];
  const hostSocket = { deserializeAttachment: () => ({ userId: 'host' }), send: message => messages.push(JSON.parse(message)) };
  const room = new ChallengeRoom({
    storage: { get: async key => data.get(key), put: async (key, value) => data.set(key, structuredClone(value)), setAlarm: async value => { alarmAt = value; }, deleteAlarm: async () => {} },
    getWebSockets: () => [hostSocket],
  }, { MATCHMAKING_BOT_MIN_MS: '5000', MATCHMAKING_BOT_MAX_MS: '10000' });
  const questions = Array.from({ length: 24 }, (_, index) => ({ question: `Card ${index}?`, options: [`answer-${index}`, `wrong-${index}-1`, `wrong-${index}-2`, `wrong-${index}-3`, `wrong-${index}-4`, `wrong-${index}-5`], correctAnswer: 0 }));
  const startedAt = Date.now();
  const response = await room.fetch(new Request('https://room/internal/init', { method: 'POST', body: JSON.stringify({ hostId: 'host', gameType: 'gibha_sah', questions }) }));
  assert.equal(response.status, 200);
  assert.ok(alarmAt >= startedAt + 5000 && alarmAt <= Date.now() + 10000);
  for (let botNumber = 1; botNumber <= 3; botNumber += 1) {
    const waiting = data.get('game');
    waiting.matchmakingBotSchedule.find(event => !event.joined && !event.cancelled).joinAt = Date.now() - 1;
    data.set('game', waiting);
    await room.alarm();
    assert.equal(data.get('game').players.length, botNumber + 1);
    if (botNumber < 3) assert.equal(data.get('game').status, 'waiting');
  }
  assert.equal(data.get('game').status, 'playing');
  assert.equal(data.get('game').players.length, 4);
  assert.equal(data.get('game').turn, 'host');
  await room.webSocketMessage(hostSocket, JSON.stringify({ type: 'answer', option: 1 }));
  assert.equal(data.get('game').round, 1);
  assert.equal(data.get('game').gibhaQuestionQueue.at(-1), 0);
  const wrongResult = messages.find(message => message.type === 'round_result' && message.correct === false);
  assert.equal(wrongResult.answer, undefined);
  assert.equal(data.get('game').players[0].score, 0);
  assert.equal(data.get('game').gibhaBoardSlots.filter(Boolean).length, 6);
  const retry = data.get('game');
  retry.turn = 'host';
  data.set('game', retry);
  await room.webSocketMessage(hostSocket, JSON.stringify({ type: 'answer', option: 1 }));
  assert.equal(data.get('game').round, 2);
  assert.equal(data.get('game').gibhaBoardSlots.filter(Boolean).length, 5);
  assert.equal(data.get('game').turn, data.get('game').players[1].id);
  assert.equal(messages.some(message => message.type === 'round_result' && message.answeredBy === 'host'), true);

  for (const expectedRound of [3, 4]) {
    const continued = data.get('game');
    continued.turn = 'host';
    data.set('game', continued);
    await room.webSocketMessage(hostSocket, JSON.stringify({ type: 'answer', option: expectedRound - 1 }));
    assert.equal(data.get('game').round, expectedRound);
  }
  assert.equal(data.get('game').gibhaBoardSlots.filter(Boolean).length, 6);
  assert.deepEqual(data.get('game').gibhaRefillSlots, [1, 2, 3]);
});

test('gibha sah removes duplicate answers and accepts matching answer text', async () => {
  const data = new Map();
  const messages = [];
  const hostSocket = { deserializeAttachment: () => ({ userId: 'host' }), send: message => messages.push(JSON.parse(message)) };
  const room = new ChallengeRoom({
    storage: { get: async key => data.get(key), put: async (key, value) => data.set(key, structuredClone(value)), setAlarm: async () => {}, deleteAlarm: async () => {} },
    getWebSockets: () => [hostSocket],
  });
  const answers = ['الغشاء البلازمي', 'الغشاء البلازمي', 'الجدار الخلوي', 'السيتوبلازم', 'النواة', 'الميتوكندريا', 'الريبوسومات'];
  const questions = answers.map((answer, index) => ({ question: `Card ${index}?`, options: [answer, `خطأ-${index}`], correctAnswer: 0 }));
  await room.fetch(new Request('https://room/internal/init', { method: 'POST', body: JSON.stringify({ hostId: 'host', gameType: 'gibha_sah', questions }) }));
  const game = data.get('game');
  game.status = 'playing';
  game.players = [{ id: 'host', name: 'Host', score: 0, answer: null, streak: 0 }];
  game.turn = 'host';
  room.prepareGibhaBoard(game);
  assert.equal(game.gibhaBoardOptions.filter(option => option === 'الغشاء البلازمي').length, 1);
  const correctSlot = game.gibhaBoardOptions.indexOf('الغشاء البلازمي');
  data.set('game', game);
  await room.webSocketMessage(hostSocket, JSON.stringify({ type: 'answer', option: correctSlot }));
  assert.equal(messages.some(message => message.type === 'round_result' && message.correct === true), true);
});

test('gibha sah completes all 24 questions even when answers repeat', async () => {
  const data = new Map();
  const socket = { deserializeAttachment: () => ({ userId: 'host' }), send: () => {} };
  const room = new ChallengeRoom({
    storage: { get: async key => data.get(key), put: async (key, value) => data.set(key, structuredClone(value)), setAlarm: async () => {}, deleteAlarm: async () => {} },
    getWebSockets: () => [socket],
  });
  const questions = Array.from({ length: 24 }, (_, index) => ({ question: `Question ${index + 1}?`, options: [`answer-${index % 8}`, `wrong-${index}`], correctAnswer: 0 }));
  await room.fetch(new Request('https://room/internal/init', { method: 'POST', body: JSON.stringify({ hostId: 'host', gameType: 'gibha_sah', questions }) }));
  const started = data.get('game');
  started.status = 'playing';
  started.turn = 'host';
  room.prepareGibhaBoard(started);
  assert.equal(started.gibhaBoardSlots.filter(Boolean).length, 6);
  assert.equal(started.gibhaPendingQuestions.length, 18);
  data.set('game', started);
  const seen = new Set();
  for (let round = 0; round < 24; round += 1) {
    const current = data.get('game');
    assert.equal(current.status, 'playing', `game ended after ${round} solved questions`);
    const index = current.questionIndex;
    assert.equal(seen.has(index), false, `question ${index} was repeated`);
    seen.add(index);
    const answer = current.questions[index].options[0];
    const slot = current.gibhaBoardOptions.indexOf(answer);
    assert.ok(slot >= 0, `answer ${answer} must be on the board`);
    current.turn = 'host';
    data.set('game', current);
    await room.webSocketMessage(socket, JSON.stringify({ type: 'answer', option: slot }));
  }
  assert.equal(seen.size, 24);
  assert.equal(data.get('game').status, 'finished');
});

test('gibha sah keeps its original exceptional probability sequence', () => {
  const room = new ChallengeRoom({ storage: {}, getWebSockets: () => [] });
  const originalRandom = Math.random;
  try {
    Math.random = () => 0;
    assert.equal(room.botAccuracy({ gameType: 'gibha_sah', round: 0 }), 0.25);
    Math.random = () => 0.999;
    assert.equal(room.botAccuracy({ gameType: 'gibha_sah', round: 0 }), 1);
    assert.equal(room.botAccuracy({ gameType: 'millionaire', round: 0 }), 1);
  } finally {
    Math.random = originalRandom;
  }
});

test('gibha sah bot delay is randomized between five and twenty seconds', () => {
  const room = new ChallengeRoom({ storage: {}, getWebSockets: () => [] });
  const originalRandom = Math.random;
  try {
    Math.random = () => 0;
    assert.equal(room.botAnswerDelay({ gameType: 'gibha_sah' }), 5000);
    Math.random = () => 0.999999;
    assert.equal(room.botAnswerDelay({ gameType: 'gibha_sah' }), 20000);
  } finally {
    Math.random = originalRandom;
  }
});

test('registry exposes room lifecycle states for the challenge center', async () => {
  const data = new Map();
  const registry = new ChallengeRegistry({ storage: { get: async key => data.get(key), put: async (key, value) => data.set(key, structuredClone(value)) } });
  const registered = await registry.fetch(new Request('https://registry/internal/register', {
    method: 'POST',
    body: JSON.stringify({ roomId: 'room-1', subject: 'الأحياء', chapter: 1, lesson: 2, lessonTitle: 'الدرس 2', gameType: 'true_false', gameTitle: 'صواب أم خطأ' }),
  }));
  const { code } = await registered.json();
  await registry.fetch(new Request('https://registry/internal/update', {
    method: 'POST', body: JSON.stringify({ roomCode: code, status: 'playing', players: 2 }),
  }));
  const listed = await registry.fetch(new Request('https://registry/internal/list'));
  const payload = await listed.json();
  assert.equal(payload.rooms[0].status, 'playing');
  assert.equal(payload.rooms[0].players, 2);
});

test('registry accepts a classroom code and exposes it in available rooms', async () => {
  const data = new Map();
  const registry = new ChallengeRegistry({ storage: { get: async key => data.get(key), put: async (key, value) => data.set(key, structuredClone(value)) } });
  const registered = await registry.fetch(new Request('https://registry/internal/register', {
    method: 'POST',
    body: JSON.stringify({ code: '9938', roomId: 'classroom:9938', subject: 'biology', chapter: 1, lesson: 5, lessonTitle: 'الدرس 5', gameType: 'live_classroom', gameTitle: 'الملزمة — غرفة دراسة أونلاين', capacity: 8, contentMode: 'booklet' }),
  }));
  assert.equal(registered.status, 201);
  assert.deepEqual(await registered.json(), { code: '9938' });

  const listed = await registry.fetch(new Request('https://registry/internal/list'));
  const payload = await listed.json();
  assert.equal(payload.rooms.length, 1);
  assert.equal(payload.rooms[0].code, '9938');
  assert.equal(payload.rooms[0].roomId, 'classroom:9938');
  assert.equal(payload.rooms[0].gameType, 'live_classroom');
  assert.equal(payload.rooms[0].contentMode, 'booklet');
  assert.equal(payload.rooms[0].status, 'playing');

  const duplicate = await registry.fetch(new Request('https://registry/internal/register', {
    method: 'POST',
    body: JSON.stringify({ code: '9938', roomId: 'classroom:other', subject: 'biology', chapter: 1, lesson: 5, lessonTitle: 'الدرس 5', gameType: 'live_classroom' }),
  }));
  assert.equal(duplicate.status, 409);
});

test('room relays a trimmed chat message to both players', async () => {
  const received = [];
  const hostSocket = { deserializeAttachment: () => ({ userId: 'host' }), send: message => received.push(JSON.parse(message)) };
  const guestSocket = { deserializeAttachment: () => ({ userId: 'guest' }), send: message => received.push(JSON.parse(message)) };
  const room = new ChallengeRoom({ storage: {}, getWebSockets: () => [hostSocket, guestSocket] });
  await room.webSocketMessage(hostSocket, JSON.stringify({ type: 'chat', text: '  مرحباً بالمنافس  ' }));
  const chatMessages = received.filter(message => message.type === 'chat');
  assert.equal(chatMessages.length, 2);
  assert.equal(chatMessages[0].from, 'host');
  assert.equal(chatMessages[0].text, 'مرحباً بالمنافس');
});

test('gibha sah allows one synchronized reaction per player and turn', async () => {
  const data = new Map();
  const messages = [];
  const hostSocket = { deserializeAttachment: () => ({ userId: 'host' }), send: message => messages.push(JSON.parse(message)) };
  const room = new ChallengeRoom({
    storage: { get: async key => data.get(key), put: async (key, value) => data.set(key, structuredClone(value)) },
    getWebSockets: () => [hostSocket],
  });
  data.set('game', { gameType: 'gibha_sah', status: 'playing', reactionTurn: 3, reactionUses: {}, players: [{ id: 'host' }, { id: 'guest' }] });
  await room.webSocketMessage(hostSocket, JSON.stringify({ type: 'reaction', kind: 'rocket', targetId: 'guest' }));
  await room.webSocketMessage(hostSocket, JSON.stringify({ type: 'reaction', kind: 'laugh' }));
  const reactions = messages.filter(message => message.type === 'reaction');
  assert.equal(reactions.length, 1);
  assert.equal(reactions[0].kind, 'rocket');
  assert.equal(reactions[0].targetId, 'guest');
  const nextTurn = data.get('game');
  nextTurn.reactionTurn = 4;
  data.set('game', nextTurn);
  await room.webSocketMessage(hostSocket, JSON.stringify({ type: 'reaction', kind: 'laugh' }));
  assert.equal(messages.filter(message => message.type === 'reaction').length, 1);
  await room.webSocketMessage(hostSocket, JSON.stringify({ type: 'reaction', kind: 'laugh', targetId: 'guest' }));
  assert.equal(messages.filter(message => message.type === 'reaction').length, 2);
  assert.equal(messages.at(-1).targetId, 'guest');
});
