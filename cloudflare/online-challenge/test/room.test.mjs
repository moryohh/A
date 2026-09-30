import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ChallengeRoom } from '../src/worker.js';

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
    method: 'POST', body: JSON.stringify({ hostId: 'host', questions }),
  }));
  assert.equal(init.status, 200);
  data.set('game', { status: 'playing', round: 0, questions, players: [
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
