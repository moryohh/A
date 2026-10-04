function json(body, status, origin) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Headers': 'authorization, content-type',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Vary': 'Origin',
    },
  });
}

function validGuestId(value) {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

async function authenticate(request, env, origin) {
  var header = request.headers.get('Authorization') || '';
  var guestMatch = header.match(/^Guest ([0-9a-f-]{36})$/i);
  if (guestMatch) {
    if (env.ALLOW_PREVIEW_GUESTS !== 'true' || origin !== env.PREVIEW_GUEST_ORIGIN || !validGuestId(guestMatch[1])) return null;
    return 'guest:' + guestMatch[1].toLowerCase();
  }
  var match = header.match(/^Bearer (.+)$/i);
  if (!match || !env.SUPABASE_ANON_KEY) return null;
  var response = await fetch(env.SUPABASE_URL + '/auth/v1/user', {
    headers: { Authorization: 'Bearer ' + match[1], apikey: env.SUPABASE_ANON_KEY },
  });
  if (!response.ok) return null;
  var user = await response.json();
  return user && typeof user.id === 'string' ? user.id : null;
}

function validQuestions(value) {
  if (!Array.isArray(value) || value.length < 1 || value.length > 10) return false;
  return value.every(function (q) {
    return q && typeof q.question === 'string' && q.question.length > 0 && q.question.length <= 600 &&
      Array.isArray(q.options) && q.options.length >= 2 && q.options.length <= 12 && q.options.every(function (o) {
        return typeof o === 'string' && o.length > 0 && o.length <= 300;
      }) && Number.isInteger(q.correctAnswer) && q.correctAnswer >= 0 && q.correctAnswer < q.options.length;
  });
}

function validGameType(value) {
  return ['millionaire', 'true_false', 'gibha_sah'].includes(value);
}

function validRoomMetadata(body) {
  return body && typeof body.subject === 'string' && body.subject.length <= 120 &&
    Number.isInteger(body.chapter) && body.chapter > 0 && body.chapter < 100 &&
    Number.isInteger(body.lesson) && body.lesson > 0 && body.lesson < 1000 &&
    typeof body.lessonTitle === 'string' && body.lessonTitle.length <= 240;
}

function allowedOrigin(request, env) {
  var configured = (env.ALLOWED_ORIGINS || env.ALLOWED_ORIGIN || 'https://a-1q1.pages.dev').split(',').map(function (item) { return item.trim(); });
  var origin = request.headers.get('Origin') || '';
  return origin && !configured.includes(origin) ? null : (origin || configured[0]);
}

export default {
  async fetch(request, env) {
    var origin = allowedOrigin(request, env);
    if (!origin) return json({ error: 'origin_not_allowed' }, 403, 'null');
    if (request.method === 'OPTIONS') return json({}, 200, origin);
    var url = new URL(request.url);

    if (url.pathname === '/health' && request.method === 'GET') {
      return json({ ok: true, service: 'duha-online-challenge', auth: 'supabase' }, 200, origin);
    }

    if (url.pathname === '/rooms' && request.method === 'POST') {
      var creator = await authenticate(request, env, origin);
      if (!creator) return json({ error: 'unauthorized' }, 401, origin);
      var body = await request.json().catch(function () { return null; });
      if (!body || !validGameType(body.gameType) || !validQuestions(body.questions) || !validRoomMetadata(body)) return json({ error: 'invalid_game' }, 400, origin);
      var roomId = crypto.randomUUID();
      var registry = env.REGISTRY.get(env.REGISTRY.idFromName('active-rooms'));
      var registration = await registry.fetch(new Request('https://registry/internal/register', {
        method: 'POST', body: JSON.stringify({ roomId: roomId, subject: body.subject, chapter: body.chapter, lesson: body.lesson, lessonTitle: body.lessonTitle, gameType: body.gameType, gameTitle: body.gameTitle || body.gameType }),
      }));
      if (!registration.ok) return json({ error: 'room_code_unavailable' }, 503, origin);
      var registrationBody = await registration.json();
      var stub = env.ROOMS.get(env.ROOMS.idFromName(roomId));
      var questions = body.questions.map(function (q) {
        return { question: q.question, options: q.options, correctAnswer: q.correctAnswer };
      });
      var created = await stub.fetch(new Request('https://room/internal/init', {
        method: 'POST', body: JSON.stringify({ hostId: creator, gameType: body.gameType, questions: questions, roomCode: registrationBody.code }),
      }));
      if (!created.ok) {
        await registry.fetch(new Request('https://registry/internal/remove', { method: 'POST', body: JSON.stringify({ roomId: roomId }) }));
        return json({ error: 'room_create_failed' }, 500, origin);
      }
      return json({ roomCode: registrationBody.code }, 201, origin);
    }

    if (url.pathname === '/rooms' && request.method === 'GET') {
      var list = await env.REGISTRY.get(env.REGISTRY.idFromName('active-rooms')).fetch(new Request('https://registry/internal/list'));
      return json(await list.json(), list.status, origin);
    }

    var connectMatch = url.pathname.match(/^\/rooms\/([^/]+)\/connect$/);
    if (connectMatch && request.method === 'POST') {
      var joiner = await authenticate(request, env, origin);
      if (!joiner) return json({ error: 'unauthorized' }, 401, origin);
      var publicCode = connectMatch[1];
      var roomId = publicCode;
      if (/^\d{1,4}$/.test(publicCode)) {
        var resolved = await env.REGISTRY.get(env.REGISTRY.idFromName('active-rooms')).fetch(new Request('https://registry/internal/resolve?code=' + encodeURIComponent(publicCode)));
        if (!resolved.ok) return json({ error: 'room_not_found' }, 404, origin);
        roomId = (await resolved.json()).roomId;
      } else if (!/^[0-9a-f-]{36}$/i.test(publicCode)) {
        return json({ error: 'invalid_room_code' }, 400, origin);
      }
      var connectStub = env.ROOMS.get(env.ROOMS.idFromName(roomId));
      var ticketResponse = await connectStub.fetch(new Request('https://room/internal/ticket', {
        method: 'POST', body: JSON.stringify({ userId: joiner }),
      }));
      if (ticketResponse.ok && /^\d{1,4}$/.test(publicCode)) {
        var ticketPayload = await ticketResponse.json();
        ticketPayload.roomId = roomId;
        if (ticketPayload.joined === true) {
          await env.REGISTRY.get(env.REGISTRY.idFromName('active-rooms')).fetch(new Request('https://registry/internal/remove', { method: 'POST', body: JSON.stringify({ roomId: roomId }) }));
        }
        return json(ticketPayload, ticketResponse.status, origin);
      }
      return json(await ticketResponse.json(), ticketResponse.status, origin);
    }

    var socketMatch = url.pathname.match(/^\/rooms\/([0-9a-f-]{36})\/ws$/);
    if (socketMatch && request.method === 'GET' && (request.headers.get('Upgrade') || '').toLowerCase() === 'websocket') {
      var ticket = url.searchParams.get('ticket');
      if (!ticket) return json({ error: 'ticket_required' }, 401, origin);
      return env.ROOMS.get(env.ROOMS.idFromName(socketMatch[1])).fetch(new Request(
        'https://room/internal/ws?ticket=' + encodeURIComponent(ticket), { headers: { Upgrade: 'websocket' } },
      ));
    }
    return json({ error: 'not_found' }, 404, origin);
  },
};

export class ChallengeRoom {
  constructor(ctx) { this.ctx = ctx; }
  async read() { return this.ctx.storage.get('game'); }
  sockets() { return this.ctx.getWebSockets(); }
  send(socket, payload) { try { socket.send(JSON.stringify(payload)); } catch (_) {} }
  broadcast(payload) { this.sockets().forEach(function (socket) { this.send(socket, payload); }, this); }
  connected(userId) {
    return this.sockets().some(function (socket) {
      var attachment = socket.deserializeAttachment();
      return attachment && attachment.userId === userId;
    });
  }
  view(game) {
    var current = game.status === 'playing' ? game.questions[game.round] : null;
    var winner = null;
    if (game.status === 'finished' && game.players.length === 2) {
      winner = game.players[0].score > game.players[1].score ? game.players[0].id :
        game.players[1].score > game.players[0].score ? game.players[1].id : null;
    }
    return {
      type: 'state', gameType: game.gameType, status: game.status, round: game.round, total: game.questions.length,
      question: current ? { question: current.question, options: current.options } : null,
      players: game.players.map(function (p) {
        return { id: p.id, score: p.score, answered: p.answer !== null, connected: this.connected(p.id) };
      }, this),
      winner: winner,
      tie: game.status === 'finished' && game.players.length === 2 && game.players[0].score === game.players[1].score,
    };
  }
  async fetch(request) {
    var url = new URL(request.url);
    var game = await this.read();
    if (url.pathname === '/internal/init' && request.method === 'POST') {
      if (game) return json({ error: 'already_initialized' }, 409, '');
      var init = await request.json();
      if (!init || typeof init.hostId !== 'string' || !validGameType(init.gameType) || !validQuestions(init.questions)) return json({ error: 'invalid_init' }, 400, '');
      await this.ctx.storage.put('game', { gameType: init.gameType, roomCode: init.roomCode, status: 'waiting', round: 0, questions: init.questions, players: [{ id: init.hostId, score: 0, answer: null }] });
      return json({ ok: true }, 200, '');
    }
    if (!game) return json({ error: 'room_not_found' }, 404, '');
    if (url.pathname === '/internal/ticket' && request.method === 'POST') {
      var ticketBody = await request.json();
      if (!ticketBody || typeof ticketBody.userId !== 'string') return json({ error: 'invalid_user' }, 400, '');
      if (game.players.length >= 2 && !game.players.some(function (p) { return p.id === ticketBody.userId; })) return json({ error: 'room_full' }, 409, '');
      var ticket = crypto.randomUUID();
      await this.ctx.storage.put('ticket:' + ticket, { userId: ticketBody.userId, expires: Date.now() + 60000 });
      return json({ ticket: ticket, joined: game.players.some(function (p) { return p.id !== ticketBody.userId; }) }, 200, '');
    }
    if (url.pathname === '/internal/ws' && (request.headers.get('Upgrade') || '').toLowerCase() === 'websocket') {
      var ticketId = url.searchParams.get('ticket');
      var ticketRecord = ticketId ? await this.ctx.storage.get('ticket:' + ticketId) : null;
      if (!ticketRecord || ticketRecord.expires < Date.now()) return json({ error: 'invalid_ticket' }, 401, '');
      await this.ctx.storage.delete('ticket:' + ticketId);
      var userId = ticketRecord.userId;
      if (!game.players.some(function (p) { return p.id === userId; })) {
        if (game.players.length !== 1 || game.status !== 'waiting') return json({ error: 'room_full' }, 409, '');
        game.players.push({ id: userId, score: 0, answer: null });
        game.status = 'playing';
        await this.ctx.storage.put('game', game);
      }
      this.sockets().forEach(function (old) {
        var attachment = old.deserializeAttachment();
        if (attachment && attachment.userId === userId) old.close(4000, 'reconnected');
      });
      var pair = new WebSocketPair();
      var client = pair[0];
      var server = pair[1];
      this.ctx.acceptWebSocket(server);
      server.serializeAttachment({ userId: userId });
      this.send(server, { type: 'welcome', userId: userId });
      this.broadcast(this.view(game));
      return new Response(null, { status: 101, webSocket: client });
    }
    return json({ error: 'not_found' }, 404, '');
  }
  async webSocketMessage(socket, message) {
    var payload;
    try { payload = JSON.parse(message); } catch (_) { return; }
    if (!payload || payload.type !== 'answer' || !Number.isInteger(payload.option)) return;
    var game = await this.read();
    if (!game || game.status !== 'playing') return;
    var currentQuestion = game.questions[game.round];
    if (payload.option < 0 || payload.option >= currentQuestion.options.length) return;
    var attachment = socket.deserializeAttachment();
    var player = attachment && game.players.find(function (p) { return p.id === attachment.userId; });
    if (!player || player.answer !== null) return;
    player.answer = payload.option;
    if (game.players.every(function (p) { return p.answer !== null; })) {
      var answer = game.questions[game.round].correctAnswer;
      game.players.forEach(function (p) { if (p.answer === answer) p.score += 1; });
      this.broadcast({ type: 'round_result', answer: answer, scores: game.players.map(function (p) { return { id: p.id, score: p.score }; }) });
      game.round += 1;
      if (game.round >= game.questions.length) game.status = 'finished';
      else game.players.forEach(function (p) { p.answer = null; });
    }
    await this.ctx.storage.put('game', game);
    this.broadcast(this.view(game));
  }
  webSocketClose() { this.read().then(function (game) { if (game) this.broadcast(this.view(game)); }.bind(this)); }
}

export class ChallengeRegistry {
  constructor(ctx) { this.ctx = ctx; }
  async readRooms() { return (await this.ctx.storage.get('rooms')) || {}; }
  async fetch(request) {
    var url = new URL(request.url);
    var rooms = await this.readRooms();
    if (url.pathname === '/internal/register' && request.method === 'POST') {
      var body = await request.json().catch(function () { return null; });
      if (!body || typeof body.roomId !== 'string' || !validGameType(body.gameType)) return json({ error: 'invalid_room' }, 400, '');
      var code = null;
      for (var attempt = 0; attempt < 12; attempt += 1) {
        var candidate = String(Math.floor(1000 + Math.random() * 9000));
        if (!rooms[candidate]) { code = candidate; break; }
      }
      if (!code) return json({ error: 'no_room_code' }, 503, '');
      rooms[code] = { code: code, roomId: body.roomId, subject: body.subject, chapter: body.chapter, lesson: body.lesson, lessonTitle: body.lessonTitle, gameType: body.gameType, gameTitle: body.gameTitle, players: 1, createdAt: Date.now() };
      await this.ctx.storage.put('rooms', rooms);
      return json({ code: code }, 201, '');
    }
    if (url.pathname === '/internal/resolve' && request.method === 'GET') {
      var resolved = rooms[url.searchParams.get('code') || ''];
      return resolved ? json({ roomId: resolved.roomId }, 200, '') : json({ error: 'not_found' }, 404, '');
    }
    if (url.pathname === '/internal/remove' && request.method === 'POST') {
      var removeBody = await request.json().catch(function () { return null; });
      if (removeBody && removeBody.roomId) Object.keys(rooms).forEach(function (key) { if (rooms[key].roomId === removeBody.roomId) delete rooms[key]; });
      await this.ctx.storage.put('rooms', rooms);
      return json({ ok: true }, 200, '');
    }
    if (url.pathname === '/internal/list' && request.method === 'GET') {
      var list = Object.values(rooms).filter(function (room) { return Date.now() - room.createdAt < 2 * 60 * 60 * 1000; });
      return json({ rooms: list }, 200, '');
    }
    return json({ error: 'not_found' }, 404, '');
  }
}
