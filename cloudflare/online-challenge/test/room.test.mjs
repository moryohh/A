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
  for (const origin of env.PREVIEW_GUEST_ORIGINS.split(',')) {
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

test('a bot joins only after the three-to-five-minute waiting deadline', async () => {
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
  });
  const questions = [{ question: 'Question?', options: ['a', 'b'], correctAnswer: 0 }];
  const startedAt = Date.now();
  await room.fetch(new Request('https://room/internal/init', {
    method: 'POST', body: JSON.stringify({ hostId: 'host', gameType: 'true_false', roomCode: '4321', questions }),
  }));
  assert.ok(alarmAt >= startedAt + 180000);
  assert.ok(alarmAt <= Date.now() + 300000);
  const waiting = data.get('game');
  waiting.botJoinAt = Date.now() - 1;
  data.set('game', waiting);
  await room.alarm();
  assert.equal(data.get('game').status, 'playing');
  assert.equal(data.get('game').players[1].id, 'bot:duha-challenge');
  assert.ok(data.get('game').botAnswerAt > Date.now());
  assert.equal(messages.some(message => message.type === 'bot_joined'), true);
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
  });
  const questions = Array.from({ length: 20 }, (_, index) => ({ question: `Team ${index}?`, options: ['a', 'b', 'c', 'd'], correctAnswer: 0 }));
  const startedAt = Date.now();
  const response = await room.fetch(new Request('https://room/internal/init', { method: 'POST', body: JSON.stringify({ hostId: 'host', gameType: 'millionaire_team', questions }) }));
  assert.equal(response.status, 200);
  assert.ok(alarmAt >= startedAt + 5000 && alarmAt <= Date.now() + 5000);
  const waiting = data.get('game');
  waiting.players.push({ id: 'mate', team: 'A', score: 0, answer: null });
  waiting.botJoinAt = Date.now() - 1;
  data.set('game', waiting);
  await room.alarm();
  assert.equal(data.get('game').players.length, 4);
  assert.deepEqual(data.get('game').players.map(player => player.team), ['A', 'A', 'B', 'B']);
  assert.deepEqual(data.get('game').teamLives, { A: 3, B: 3 });
  assert.equal(data.get('game').turn, 'host');
  assert.ok(data.get('game').questionDeadline > Date.now());
  await room.webSocketMessage(hostSocket, JSON.stringify({ type: 'answer', option: 0 }));
  assert.equal(data.get('game').round, 1);
  assert.equal(data.get('game').activeTeam, 'B');
  assert.equal(data.get('game').turn.startsWith('bot:team:B:'), true);
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
  });
  const questions = Array.from({ length: 24 }, (_, index) => ({ question: `Card ${index}?`, options: ['a', 'b', 'c', 'd', 'e', 'f'], correctAnswer: 0 }));
  const startedAt = Date.now();
  const response = await room.fetch(new Request('https://room/internal/init', { method: 'POST', body: JSON.stringify({ hostId: 'host', gameType: 'gibha_sah', questions }) }));
  assert.equal(response.status, 200);
  assert.ok(alarmAt >= startedAt + 5000 && alarmAt <= Date.now() + 5000);
  const waiting = data.get('game');
  waiting.botJoinAt = Date.now() - 1;
  data.set('game', waiting);
  await room.alarm();
  assert.equal(data.get('game').status, 'playing');
  assert.equal(data.get('game').players.length, 4);
  assert.equal(data.get('game').turn, 'host');
  await room.webSocketMessage(hostSocket, JSON.stringify({ type: 'answer', option: 1 }));
  assert.equal(data.get('game').round, 0);
  const wrongResult = messages.find(message => message.type === 'round_result' && message.correct === false);
  assert.equal(wrongResult.answer, undefined);
  assert.equal(data.get('game').players[0].score, 0);
  const retry = data.get('game');
  retry.turn = 'host';
  data.set('game', retry);
  await room.webSocketMessage(hostSocket, JSON.stringify({ type: 'answer', option: 0 }));
  assert.equal(data.get('game').round, 1);
  assert.equal(data.get('game').turn, data.get('game').players[1].id);
  assert.equal(messages.some(message => message.type === 'round_result' && message.answeredBy === 'host'), true);
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
