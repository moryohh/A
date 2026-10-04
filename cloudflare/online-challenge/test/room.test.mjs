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
  data.set('game', { gameType: 'millionaire', status: 'playing', round: 0, questions, players: [
    { id: 'host', score: 0, answer: null }, { id: 'guest', score: 0, answer: null },
  ] });

  const third = await room.fetch(new Request('https://room/internal/ticket', {
    method: 'POST', body: JSON.stringify({ userId: 'third' }),
  }));
  assert.equal(third.status, 409);
  await room.webSocketMessage(sockets[0], JSON.stringify({ type: 'answer', option: 0 }));
  await room.webSocketMessage(sockets[0], JSON.stringify({ type: 'answer', option: 1 }));
  assert.equal(data.get('game').players[0].answer, 0);
  assert.equal(messages.get('host').filter(message => message.type === 'round_result').length, 0);
  await room.webSocketMessage(sockets[1], JSON.stringify({ type: 'answer', option: 1 }));
  assert.equal(data.get('game').round, 1);
  assert.deepEqual(data.get('game').players.map(player => player.score), [1, 0]);
  assert.equal(messages.get('host').find(message => message.type === 'round_result').answer, 0);
  await room.webSocketMessage(sockets[0], JSON.stringify({ type: 'answer', option: 0 }));
  await room.webSocketMessage(sockets[1], JSON.stringify({ type: 'answer', option: 1 }));
  assert.equal(data.get('game').status, 'finished');
  assert.equal(room.view(data.get('game')).tie, true);
  await room.webSocketMessage(sockets[0], JSON.stringify({ type: 'answer', option: 1 }));
  assert.deepEqual(data.get('game').players.map(player => player.score), [1, 1]);
});

test('temporary disconnect gets a 30 second reconnect grace period before the match ends', async () => {
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
  assert.equal(data.get('game').status, 'abandoned');
  assert.equal(data.get('game').winner, 'host');
  assert.equal(messages.some(message => message.type === 'challenge_ended'), true);
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
