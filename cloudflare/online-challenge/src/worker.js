const json = (body, status = 200, origin = '') => new Response(JSON.stringify(body), {
  status,
  headers: { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Headers': 'authorization, content-type', 'Access-Control-Allow-Methods': 'POST, GET, OPTIONS', 'Vary': 'Origin' },
});

async function authenticate(request, env) {
  const token = request.headers.get('Authorization')?.match(/^Bearer (.+)$/i)?.[1];
  if (!token) return null;
  const response = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
    headers: { Authorization: `Bearer ${token}`, apikey: env.SUPABASE_ANON_KEY },
  });
  if (!response.ok) return null;
  const user = await response.json();
  return typeof user.id === 'string' ? user.id : null;
}

function validQuestions(value) {
  return Array.isArray(value) && value.length >= 1 && value.length <= 10 && value.every(q =>
    typeof q.question === 'string' && q.question.length > 0 && q.question.length <= 600 &&
    Array.isArray(q.options) && q.options.length === 4 && q.options.every(o => typeof o === 'string' && o.length > 0 && o.length <= 300) &&
    Number.isInteger(q.correctAnswer) && q.correctAnswer >= 0 && q.correctAnswer < 4
  );
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const allowed = env.ALLOWED_ORIGIN || 'https://a-1q1.pages.dev';
    if (origin && origin !== allowed) return json({ error: 'origin_not_allowed' }, 403, allowed);
    if (request.method === 'OPTIONS') return json({}, 200, allowed);
    const url = new URL(request.url);
    if (url.pathname === '/health' && request.method === 'GET') return json({ ok: true }, 200, allowed);

    if (url.pathname === '/rooms' && request.method === 'POST') {
      const userId = await authenticate(request, env);
      if (!userId) return json({ error: 'unauthorized' }, 401, allowed);
      const body = await request.json().catch(() => null);
      if (!validQuestions(body?.questions)) return json({ error: 'invalid_questions' }, 400, allowed);
      const roomId = crypto.randomUUID();
      const stub = env.ROOMS.get(env.ROOMS.idFromName(roomId));
      const questions = body.questions.map(q => ({ question: q.question, options: q.options, correctAnswer: q.correctAnswer }));
      const response = await stub.fetch(new Request('https://room/internal/init', { method: 'POST', body: JSON.stringify({ hostId: userId, questions }) }));
      if (!response.ok) return json({ error: 'room_create_failed' }, 500, allowed);
      return json({ roomId }, 201, allowed);
    }

    const match = url.pathname.match(/^\/rooms\/([0-9a-f-]{36})\/connect$/);
    if (match && request.method === 'POST') {
      const userId = await authenticate(request, env);
      if (!userId) return json({ error: 'unauthorized' }, 401, allowed);
      const stub = env.ROOMS.get(env.ROOMS.idFromName(match[1]));
      const response = await stub.fetch(new Request('https://room/internal/ticket', { method: 'POST', body: JSON.stringify({ userId }) }));
      return json(await response.json(), response.status, allowed);
    }
    const wsMatch = url.pathname.match(/^\/rooms\/([0-9a-f-]{36})\/ws$/);
    if (wsMatch && request.method === 'GET' && request.headers.get('Upgrade')?.toLowerCase() === 'websocket') {
      const ticket = url.searchParams.get('ticket');
      if (!ticket) return json({ error: 'ticket_required' }, 401, allowed);
      return env.ROOMS.get(env.ROOMS.idFromName(wsMatch[1])).fetch(new Request(`https://room/internal/ws?ticket=${encodeURIComponent(ticket)}`, { headers: { Upgrade: 'websocket' } }));
    }
    return json({ error: 'not_found' }, 404, allowed);
  },
};

export class ChallengeRoom {
  constructor(ctx) { this.ctx = ctx; }

  async state() { return this.ctx.storage.get('game'); }
  sockets() { return this.ctx.getWebSockets(); }
  send(socket, payload) { try { socket.send(JSON.stringify(payload)); } catch {} }
  broadcast(payload) { for (const socket of this.sockets()) this.send(socket, payload); }
  view(game) {
    return { type: 'state', status: game.status, round: game.round, total: game.questions.length,
      question: game.status === 'playing' ? { question: game.questions[game.round].question, options: game.questions[game.round].options } : null,
      players: game.players.map(p => ({ id: p.id, score: p.score, answered: p.answer !== null, connected: this.sockets().some(s => s.deserializeAttachment()?.userId === p.id) })),
      winner: game.status === 'finished' ? game.players.reduce((a, b) => a.score > b.score ? a : b).id : null,
      tie: game.status === 'finished' && game.players[0].score === game.players[1].score };
  }

  async fetch(request) {
    const url = new URL(request.url);
    const game = await this.state();
    if (url.pathname === '/internal/init' && request.method === 'POST') {
      if (game) return json({ error: 'already_initialized' }, 409);
      const { hostId, questions } = await request.json();
      await this.ctx.storage.put('game', { status: 'waiting', round: 0, questions, players: [{ id: hostId, score: 0, answer: null }] });
      return json({ ok: true });
    }
    if (!game) return json({ error: 'room_not_found' }, 404);
    if (url.pathname === '/internal/ticket' && request.method === 'POST') {
      const { userId } = await request.json();
      if (game.players.length === 2 && !game.players.some(p => p.id === userId)) return json({ error: 'room_full' }, 409);
      const ticket = crypto.randomUUID();
      await this.ctx.storage.put(`ticket:${ticket}`, { userId, expires: Date.now() + 60_000 });
      return json({ ticket });
    }
    if (url.pathname === '/internal/ws' && request.headers.get('Upgrade')?.toLowerCase() === 'websocket') {
      const ticket = url.searchParams.get('ticket');
      const record = ticket && await this.ctx.storage.get(`ticket:${ticket}`);
      if (!record || record.expires < Date.now()) return json({ error: 'invalid_ticket' }, 401);
      await this.ctx.storage.delete(`ticket:${ticket}`);
      const userId = record.userId;
      if (!game.players.some(p => p.id === userId)) {
        if (game.players.length !== 1 || game.status !== 'waiting') return json({ error: 'room_full' }, 409);
        game.players.push({ id: userId, score: 0, answer: null });
        game.status = 'playing';
        await this.ctx.storage.put('game', game);
      }
      for (const old of this.sockets()) if (old.deserializeAttachment()?.userId === userId) old.close(4000, 'reconnected');
      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);
      this.ctx.acceptWebSocket(server);
      server.serializeAttachment({ userId });
      this.send(server, { type: 'welcome', userId });
      this.broadcast(this.view(game));
      return new Response(null, { status: 101, webSocket: client });
    }
    return json({ error: 'not_found' }, 404);
  }

  async webSocketMessage(socket, message) {
    let payload;
    try { payload = JSON.parse(message); } catch { return; }
    if (payload?.type !== 'answer' || !Number.isInteger(payload.option)) return;
    const game = await this.state();
    if (!game || game.status !== 'playing' || payload.option < 0 || payload.option > 3) return;
    const userId = socket.deserializeAttachment()?.userId;
    const player = game.players.find(p => p.id === userId);
    if (!player || player.answer !== null) return;
    player.answer = payload.option;
    if (game.players.every(p => p.answer !== null)) {
      const answer = game.questions[game.round].correctAnswer;
      for (const p of game.players) if (p.answer === answer) p.score += 1;
      this.broadcast({ type: 'round_result', answer, scores: game.players.map(p => ({ id: p.id, score: p.score })) });
      game.round += 1;
      if (game.round >= game.questions.length) game.status = 'finished';
      else for (const p of game.players) p.answer = null;
    }
    await this.ctx.storage.put('game', game);
    this.broadcast(this.view(game));
  }
  webSocketClose(socket) { const gamePromise = this.state(); gamePromise.then(game => { if (game) this.broadcast(this.view(game)); }); }
}
