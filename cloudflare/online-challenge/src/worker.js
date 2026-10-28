import { ChallengeRoom as October19TrueFalseRoom } from './true-false-october19.js';
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

function isChallengePreviewOrigin(origin) {
  return /^https:\/\/[a-z0-9-]+\.duha-challenge-preview\.pages\.dev$/i.test(origin);
}

async function authenticate(request, env, origin) {
  var header = request.headers.get('Authorization') || '';
  var guestMatch = header.match(/^Guest ([0-9a-f-]{36})$/i);
  if (guestMatch) {
    var guestOrigins = (env.PREVIEW_GUEST_ORIGINS || env.PREVIEW_GUEST_ORIGIN || '').split(',').map(function (item) { return item.trim(); }).filter(Boolean);
    if (env.ALLOW_PREVIEW_GUESTS !== 'true' || (!guestOrigins.includes(origin) && !isChallengePreviewOrigin(origin)) || !validGuestId(guestMatch[1])) return null;
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
  if (!Array.isArray(value) || value.length < 1 || value.length > 30) return false;
  return value.every(function (q) {
    return q && typeof q.question === 'string' && q.question.length > 0 && q.question.length <= 600 &&
      Array.isArray(q.options) && q.options.length >= 2 && q.options.length <= 12 && q.options.every(function (o) {
        return typeof o === 'string' && o.length > 0 && o.length <= 300;
      }) && Number.isInteger(q.correctAnswer) && q.correctAnswer >= 0 && q.correctAnswer < q.options.length;
  });
}

function validGameType(value) {
  return ['millionaire', 'millionaire_team', 'true_false', 'gibha_sah', 'live_classroom'].includes(value);
}

function classroomCapacity(value) {
  return [2, 4, 8, 12, 20, 30, 50].includes(Number(value)) ? Number(value) : 8;
}

function registryBinding(env) {
  return env.REGISTRY_V2 || env.REGISTRY;
}

var BOT_ID = 'bot:duha-challenge';
var TEAM_BOT_PREFIX = 'bot:team:';
var CLASSROOM_BOT_PREFIX = 'bot:classroom:';
var BOT_ANSWER_DELAY_MS = 2000;
var TRUE_FALSE_TURN_MS = 20000;
var GIBHA_SAH_TURN_MS = 25000;
var CHARACTER_VARIANTS = ['anime', 'student', 'student2'];
var BOT_PROFILES = [
  { id: 'opp-1', name: 'سجاد مهدي', avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80', city: 'بغداد - الكرخ', school: 'إعدادية المتميزين', badge: 'نجم التحدي ⚡', level: 12 },
  { id: 'opp-2', name: 'فاطمة العبيدي', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80', city: 'الموصل - نينوى', school: 'ثانوية المتفوقات', badge: 'عالمة المستقبل 🔬', level: 14 },
  { id: 'opp-3', name: 'علي التميمي', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', city: 'البصرة - العشار', school: 'إعدادية المعقل', badge: 'فارس الأوائل 🏆', level: 11 },
  { id: 'opp-4', name: 'زينب الكرخي', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80', city: 'بابل - الحلة', school: 'ثانوية الإسراء', badge: 'شعلة الذكاء 💡', level: 13 },
  { id: 'opp-5', name: 'حيدر الكعبي', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80', city: 'النجف الأشرف', school: 'إعدادية الكوفة', badge: 'صائد المليون 🎯', level: 15 },
];
function randomDelay(minimum, maximum) {
  return minimum + Math.floor(Math.random() * (maximum - minimum + 1));
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
  return origin && !configured.includes(origin) && !isChallengePreviewOrigin(origin) ? null : (origin || configured[0]);
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
      if (body.gameType === 'live_classroom') {
        try {
          var directQuestions = body.questions.map(function (q) { return { question: q.question, options: q.options, correctAnswer: q.correctAnswer }; });
          var directRegistryNamespace = registryBinding(env);
          var directRegistry = directRegistryNamespace.get(directRegistryNamespace.idFromName('active-rooms'));
          for (var directAttempt = 0; directAttempt < 20; directAttempt += 1) {
            var directCode = String(Math.floor(1000 + Math.random() * 9000));
            var directRoomId = 'classroom:' + directCode;
            var directRegistration = await directRegistry.fetch(new Request('https://registry/internal/register', {
              method: 'POST', body: JSON.stringify({ code: directCode, roomId: directRoomId, subject: body.subject, chapter: body.chapter, lesson: body.lesson, lessonTitle: body.lessonTitle, gameType: body.gameType, gameTitle: body.gameTitle || body.gameType, capacity: classroomCapacity(body.capacity), contentMode: body.contentMode === 'booklet' ? 'booklet' : 'board' }),
            }));
            if (directRegistration.status === 409) continue;
            if (!directRegistration.ok) return json({ error: 'room_code_unavailable' }, 503, origin);
            var directStub = env.ROOMS.get(env.ROOMS.idFromName(directRoomId));
            var directCreated = await directStub.fetch(new Request('https://room/internal/init', {
              method: 'POST', body: JSON.stringify({ hostId: creator, gameType: body.gameType, questions: directQuestions, roomCode: directCode, capacity: classroomCapacity(body.capacity), durationMinutes: Math.max(5, Math.min(180, Number(body.durationMinutes) || 45)), studyMode: body.studyMode === 'together' ? 'together' : 'teacher', sharedMission: String(body.sharedMission || '').trim().slice(0, 120), contentMode: body.contentMode === 'booklet' ? 'booklet' : 'board', content: body.content || null }),
            }));
            if (directCreated.ok) return json({ roomCode: directCode }, 201, origin);
            await directRegistry.fetch(new Request('https://registry/internal/remove', { method: 'POST', body: JSON.stringify({ roomId: directRoomId }) }));
            if (directCreated.status !== 409) return json({ error: 'room_create_failed' }, 500, origin);
          }
        } catch (_) {
          return json({ error: 'room_runtime_unavailable' }, 503, origin);
        }
        return json({ error: 'room_code_unavailable' }, 503, origin);
      }
      var roomId = crypto.randomUUID();
      var registryNamespace = registryBinding(env);
      var registry = registryNamespace.get(registryNamespace.idFromName('active-rooms'));
      var registration = await registry.fetch(new Request('https://registry/internal/register', {
        method: 'POST', body: JSON.stringify({ roomId: roomId, subject: body.subject, chapter: body.chapter, lesson: body.lesson, lessonTitle: body.lessonTitle, gameType: body.gameType, gameTitle: body.gameTitle || body.gameType, capacity: classroomCapacity(body.capacity) }),
      }));
      if (!registration.ok) return json({ error: 'room_code_unavailable' }, 503, origin);
      var registrationBody = await registration.json();
      var stub = env.ROOMS.get(env.ROOMS.idFromName(roomId));
      var questions = body.questions.map(function (q) {
        return { question: q.question, options: q.options, correctAnswer: q.correctAnswer };
      });
      var created = await stub.fetch(new Request('https://room/internal/init', {
        method: 'POST', body: JSON.stringify({ hostId: creator, gameType: body.gameType, questions: questions, roomCode: registrationBody.code, capacity: classroomCapacity(body.capacity), durationMinutes: Math.max(5, Math.min(180, Number(body.durationMinutes) || 45)), studyMode: body.studyMode === 'together' ? 'together' : 'teacher', sharedMission: String(body.sharedMission || '').trim().slice(0, 120), contentMode: body.contentMode === 'booklet' ? 'booklet' : 'board', content: body.content || null }),
      }));
      if (!created.ok) {
        await registry.fetch(new Request('https://registry/internal/remove', { method: 'POST', body: JSON.stringify({ roomId: roomId }) }));
        return json({ error: 'room_create_failed' }, 500, origin);
      }
      return json({ roomCode: registrationBody.code }, 201, origin);
    }

    if (url.pathname === '/rooms' && request.method === 'GET') {
      var listRegistry = registryBinding(env);
      var list = await listRegistry.get(listRegistry.idFromName('active-rooms')).fetch(new Request('https://registry/internal/list'));
      return json(await list.json(), list.status, origin);
    }

    var connectMatch = url.pathname.match(/^\/rooms\/([^/]+)\/connect$/);
    if (connectMatch && request.method === 'POST') {
      var joiner = await authenticate(request, env, origin);
      if (!joiner) return json({ error: 'unauthorized' }, 401, origin);
      var connectBody = await request.json().catch(function () { return {}; });
      var publicCode = connectMatch[1];
      var roomId = publicCode;
      if (/^\d{1,4}$/.test(publicCode)) {
        var directConnectStub = env.ROOMS.get(env.ROOMS.idFromName('classroom:' + publicCode));
        var directTicketResponse = await directConnectStub.fetch(new Request('https://room/internal/ticket', {
          method: 'POST', body: JSON.stringify({ userId: joiner, profile: connectBody.profile || null }),
        }));
        if (directTicketResponse.ok) {
          var directTicketPayload = await directTicketResponse.json();
          directTicketPayload.roomId = 'c-' + publicCode;
          return json(directTicketPayload, directTicketResponse.status, origin);
        }
        var resolveRegistry = registryBinding(env);
        if (!resolveRegistry) return json({ error: 'room_not_found' }, 404, origin);
        var resolved = await resolveRegistry.get(resolveRegistry.idFromName('active-rooms')).fetch(new Request('https://registry/internal/resolve?code=' + encodeURIComponent(publicCode)));
        if (!resolved.ok) return json({ error: 'room_not_found' }, 404, origin);
        roomId = (await resolved.json()).roomId;
      } else if (!/^[0-9a-f-]{36}$/i.test(publicCode)) {
        return json({ error: 'invalid_room_code' }, 400, origin);
      }
      var connectStub = env.ROOMS.get(env.ROOMS.idFromName(roomId));
      var ticketResponse = await connectStub.fetch(new Request('https://room/internal/ticket', {
        method: 'POST', body: JSON.stringify({ userId: joiner, profile: connectBody.profile || null }),
      }));
      if (ticketResponse.ok && /^\d{1,4}$/.test(publicCode)) {
        var ticketPayload = await ticketResponse.json();
        ticketPayload.roomId = roomId;
        return json(ticketPayload, ticketResponse.status, origin);
      }
      return json(await ticketResponse.json(), ticketResponse.status, origin);
    }

    var leaveMatch = url.pathname.match(/^\/rooms\/([^/]+)\/leave$/);
    if (leaveMatch && request.method === 'POST') {
      var leaver = await authenticate(request, env, origin);
      if (!leaver) return json({ error: 'unauthorized' }, 401, origin);
      var leaveCode = leaveMatch[1];
      var leaveRoomId = leaveCode;
      if (/^\d{1,4}$/.test(leaveCode)) {
        var directLeaveStub = env.ROOMS.get(env.ROOMS.idFromName('classroom:' + leaveCode));
        var directLeaveResponse = await directLeaveStub.fetch(new Request('https://room/internal/leave', { method: 'POST', body: JSON.stringify({ userId: leaver }) }));
        if (directLeaveResponse.ok) return json(await directLeaveResponse.json(), directLeaveResponse.status, origin);
        var leaveRegistry = registryBinding(env);
        if (!leaveRegistry) return json({ ok: true }, 200, origin);
        var leaveResolved = await leaveRegistry.get(leaveRegistry.idFromName('active-rooms')).fetch(new Request('https://registry/internal/resolve?code=' + encodeURIComponent(leaveCode)));
        if (!leaveResolved.ok) return json({ ok: true }, 200, origin);
        leaveRoomId = (await leaveResolved.json()).roomId;
      } else if (!/^[0-9a-f-]{36}$/i.test(leaveCode)) {
        return json({ error: 'invalid_room_code' }, 400, origin);
      }
      var leaveStub = env.ROOMS.get(env.ROOMS.idFromName(leaveRoomId));
      var leaveResponse = await leaveStub.fetch(new Request('https://room/internal/leave', { method: 'POST', body: JSON.stringify({ userId: leaver }) }));
      var leavePayload = await leaveResponse.json();
      return json(leavePayload, leaveResponse.status, origin);
    }

    var socketMatch = url.pathname.match(/^\/rooms\/([0-9a-f-]{36}|c-\d{4})\/ws$/);
    if (socketMatch && request.method === 'GET' && (request.headers.get('Upgrade') || '').toLowerCase() === 'websocket') {
      var ticket = url.searchParams.get('ticket');
      if (!ticket) return json({ error: 'ticket_required' }, 401, origin);
      var socketRoomName = socketMatch[1].startsWith('c-') ? 'classroom:' + socketMatch[1].slice(2) : socketMatch[1];
      return env.ROOMS.get(env.ROOMS.idFromName(socketRoomName)).fetch(new Request(
        'https://room/internal/ws?ticket=' + encodeURIComponent(ticket), { headers: { Upgrade: 'websocket' } },
      ));
    }
    return json({ error: 'not_found' }, 404, origin);
  },
};

export class ChallengeRoom {
  october19() { return new October19TrueFalseRoom(this.ctx, { ...this.env, REGISTRY: this.env?.REGISTRY_V2 || this.env?.REGISTRY }); }
  constructor(ctx, env) { this.ctx = ctx; this.env = env; }
  async read() { return this.ctx.storage.get('game'); }
  sockets() { return this.ctx.getWebSockets(); }
  send(socket, payload) { try { socket.send(JSON.stringify(payload)); } catch (_) {} }
  broadcast(payload) { this.sockets().forEach(function (socket) { this.send(socket, payload); }, this); }
  connected(userId, excludedSocket) {
    if (userId === BOT_ID || (typeof userId === 'string' && (userId.startsWith(TEAM_BOT_PREFIX) || userId.startsWith(CLASSROOM_BOT_PREFIX)))) return true;
    return this.sockets().some(function (socket) {
      if (socket === excludedSocket) return false;
      var attachment = socket.deserializeAttachment();
      return attachment && attachment.userId === userId;
    });
  }
  isBot(player) { return Boolean(player && typeof player.id === 'string' && (player.id === BOT_ID || player.id.startsWith(TEAM_BOT_PREFIX) || player.id.startsWith(CLASSROOM_BOT_PREFIX))); }
  humanPlayers(game) { return game.players.filter(function (player) { return !this.isBot(player); }, this); }
  hasConnectedHuman(game) { return this.humanPlayers(game).some(function (player) { return this.connected(player.id); }, this); }
  assignCharacter(game, player) {
    if (!player || player.character) return player && player.character;
    var used = game.players.map(function (item) { return item.character; }).filter(Boolean);
    var available = CHARACTER_VARIANTS.filter(function (variant) { return !used.includes(variant); });
    var pool = available.length ? available : CHARACTER_VARIANTS;
    player.character = pool[Math.floor(Math.random() * pool.length)];
    return player.character;
  }
  resultDuration(game, player, correct) {
    if (game.gameType !== 'true_false') return 0;
    var durations = { anime: [5000, 8000], student: [4000, 4100], student2: [4000, 3350] };
    return (durations[player?.character] || durations.anime)[correct ? 0 : 1] + 1500;
  }
  beginSoloTurn(game, resultDurationMs = 0) {
    game.resultUntil = Date.now() + resultDurationMs;
    delete game.questionDeadline;
    delete game.botAnswerAt;
    var active = game.players.find(function (player) { return player.id === game.turn; });
    if (!active || game.status !== 'playing') return;
    if (this.isBot(active)) game.botAnswerAt = Math.max(Date.now(), game.resultUntil || 0) + this.botAnswerDelay(game);
    else if (game.gameType === 'true_false' || game.gameType === 'gibha_sah' || game.gameType === 'millionaire') game.questionDeadline = Math.max(Date.now(), game.resultUntil || 0) + (game.gameType === 'true_false' ? TRUE_FALSE_TURN_MS : game.gameType === 'gibha_sah' ? GIBHA_SAH_TURN_MS : 60000);
  }
  teamPlayers(game, team) { return game.players.filter(function (player) { return player.team === team; }); }
  sendToTeam(game, team, payload) {
    this.sockets().forEach(function (socket) {
      var attachment = socket.deserializeAttachment();
      var player = attachment && game.players.find(function (item) { return item.id === attachment.userId; });
      if (player && player.team === team) this.send(socket, payload);
    }, this);
  }
  async scheduleNextAlarm(game) {
    var classroomBotDeadlines = Array.isArray(game.classroomBotSchedule) ? game.classroomBotSchedule.flatMap(function (event) {
      if (event.left) return [];
      return event.joined ? [event.leaveAt] : [event.joinAt];
    }) : [];
    var matchmakingBotDeadlines = game.status === 'waiting' && Array.isArray(game.matchmakingBotSchedule) ? game.matchmakingBotSchedule.filter(function (event) { return !event.joined && !event.cancelled; }).map(function (event) { return event.joinAt; }) : [];
    var deadlines = [game.botJoinAt, game.disconnectDeadline, game.emptyDeadline, game.botDiscussionAt, game.botAnswerAt, game.questionDeadline].concat(classroomBotDeadlines, matchmakingBotDeadlines).filter(function (value) {
      return Number.isFinite(value);
    });
    if (deadlines.length && this.ctx.storage.setAlarm) await this.ctx.storage.setAlarm(Math.min.apply(Math, deadlines));
    else if (this.ctx.storage.deleteAlarm) await this.ctx.storage.deleteAlarm();
  }
  botAccuracy(game) {
    if (game.gameType === 'gibha_sah') {
      // Keep Jبتها صح's original exceptional rules exactly as designed.
      var gibhaProbabilities = [0.25, 0.5, 0.75, 1, 0, 0.5, 1, 1];
      return gibhaProbabilities[Math.floor(Math.random() * gibhaProbabilities.length)] ?? 0.5;
    }
    // The Millionaire opponent has the clearest progressive rule: strong early,
    // then its error rate grows by 5% from question eight onward.
    return Math.max(0.6, 1 - (game.round >= 7 ? (game.round - 6) * 0.05 : 0));
  }
  answerKey(value) {
    return String(value || '').normalize('NFKC').replace(/[\u0640\u064B-\u065F\u0670]/g, '').replace(/\s+/g, ' ').trim();
  }
  botAnswerDelay(game) {
    if (game.gameType === 'gibha_sah') return randomDelay(5000, 20000);
    if (game.gameType === 'millionaire') return randomDelay(10000, 30000);
    return BOT_ANSWER_DELAY_MS;
  }
  syncGibhaQuestionQueue(game) {
    var available = game.gibhaBoardSlots.filter(Boolean).map(function (slot) { return slot.questionIndex; });
    var queue = Array.isArray(game.gibhaQuestionQueue) ? game.gibhaQuestionQueue.filter(function (index, position, all) {
      return available.includes(index) && all.indexOf(index) === position;
    }) : [];
    available.forEach(function (index) { if (!queue.includes(index)) queue.push(index); });
    game.gibhaQuestionQueue = queue;
    return queue;
  }
  advanceGibhaQuestion(game, currentIndex, solved) {
    var queue = this.syncGibhaQuestionQueue(game).filter(function (index) { return index !== currentIndex; });
    if (!solved && game.gibhaBoardSlots.some(function (slot) { return slot && slot.questionIndex === currentIndex; })) queue.push(currentIndex);
    game.gibhaQuestionQueue = queue;
    return queue[0] ?? game.questions.length;
  }
  prepareGibhaBoard(game) {
    if (game.gameType !== 'gibha_sah') return;
    var questionIndex = Number.isInteger(game.questionIndex) ? game.questionIndex : game.round;
    if (Array.isArray(game.gibhaBoardSlots)) return;
    game.gibhaBoardSlots = [];
    game.gibhaPendingQuestions = [];
    for (var scanIndex = questionIndex; scanIndex < game.questions.length; scanIndex += 1) {
      var question = game.questions[scanIndex];
      var option = question.options[question.correctAnswer];
      var optionKey = this.answerKey(option);
      if (optionKey && game.gibhaBoardSlots.length < 6 && !game.gibhaBoardSlots.some(function (slot) { return this.answerKey(slot.option) === optionKey; }, this)) game.gibhaBoardSlots.push({ questionIndex: scanIndex, option: option });
      else game.gibhaPendingQuestions.push(scanIndex);
    }
    while (game.gibhaBoardSlots.length < 6) game.gibhaBoardSlots.push(null);
    game.gibhaNextQuestionIndex = game.questions.length;
    game.gibhaBoardOptions = game.gibhaBoardSlots.map(function (slot) { return slot ? slot.option : ''; });
    game.gibhaQuestionQueue = game.gibhaBoardSlots.filter(Boolean).map(function (slot) { return slot.questionIndex; });
    game.gibhaRefillSlots = [];
  }
  refillGibhaBoard(game) {
    var emptySlots = game.gibhaBoardSlots.map(function (slot, index) { return slot ? -1 : index; }).filter(function (index) { return index >= 0; }).slice(0, 3);
    var filledSlots = [];
    emptySlots.forEach(function (slot) {
      var pending = game.gibhaPendingQuestions || [];
      for (var position = 0; position < pending.length; position += 1) {
        var questionIndex = pending[position];
        var question = game.questions[questionIndex];
        var option = question.options[question.correctAnswer];
        var optionKey = this.answerKey(option);
        if (!optionKey || game.gibhaBoardSlots.some(function (existing) { return existing && this.answerKey(existing.option) === optionKey; }, this)) continue;
        game.gibhaBoardSlots[slot] = { questionIndex: questionIndex, option: option };
        pending.splice(position, 1);
        filledSlots.push(slot);
        break;
      }
    }, this);
    game.gibhaBoardOptions = game.gibhaBoardSlots.map(function (slot) { return slot ? slot.option : ''; });
    this.syncGibhaQuestionQueue(game);
    game.gibhaRefillSlots = filledSlots;
    game.gibhaRefillVersion = (game.gibhaRefillVersion || 0) + 1;
  }
  chooseBotAnswer(game) {
    var question = game.questions[game.round];
    if (!question) return null;
    if (game.gameType === 'gibha_sah') {
      this.prepareGibhaBoard(game);
      var activeQuestion = game.questions[game.questionIndex];
      var activeAnswer = activeQuestion && activeQuestion.options[activeQuestion.correctAnswer];
      var activeAnswerKey = this.answerKey(activeAnswer);
      var correctSlot = game.gibhaBoardOptions.findIndex(function (option) { return this.answerKey(option) === activeAnswerKey; }, this);
      if (Math.random() < this.botAccuracy(game)) return correctSlot;
      var visibleWrong = game.gibhaBoardOptions.map(function (option, index) { return option && index !== correctSlot ? index : -1; }).filter(function (index) { return index >= 0; });
      return visibleWrong.length ? visibleWrong[Math.floor(Math.random() * visibleWrong.length)] : correctSlot;
    }
    if (Math.random() < this.botAccuracy(game)) return question.correctAnswer;
    var wrong = question.options.map(function (_, index) { return index; }).filter(function (index) {
      return index !== question.correctAnswer;
    });
    return wrong.length ? wrong[Math.floor(Math.random() * wrong.length)] : question.correctAnswer;
  }
  teamHumans(game) { return game.players.filter(function (player) { return !this.isBot(player); }, this); }
  captainForTeam(game, team) {
    var members = this.teamPlayers(game, team);
    if (!members.length) return null;
    game.captainCursor = game.captainCursor || { A: 0, B: 0 };
    var index = game.captainCursor[team] % members.length;
    game.captainCursor[team] += 1;
    return members[index].id;
  }
  beginTeamTurn(game, team) {
    game.activeTeam = team;
    game.turn = this.captainForTeam(game, team);
    game.recommendations = {};
    delete game.botDiscussionAt;
    delete game.botAnswerAt;
    delete game.questionDeadline;
    var captain = game.players.find(function (player) { return player.id === game.turn; });
    var botMate = this.teamPlayers(game, team).find(function (player) { return this.isBot(player) && player.id !== game.turn; }, this);
    if ((captain && this.isBot(captain)) || botMate) game.botDiscussionAt = Date.now() + randomDelay(3000, 7000);
    else game.questionDeadline = Date.now() + 60000;
  }
  async finishTeamRound(game, selected, answeredBy, timedOut) {
    var currentIndex = Number.isInteger(game.questionIndex) ? game.questionIndex : game.round;
    var question = game.questions[currentIndex];
    if (!question) return;
    var team = game.activeTeam || 'A';
    var correct = !timedOut && selected === question.correctAnswer;
    if (correct) game.teamScores[team] += 1;
    else game.teamLives[team] = Math.max(0, game.teamLives[team] - 1);
    this.teamPlayers(game, team).forEach(function (player) { player.score = game.teamScores[team]; });
    game.players.forEach(function (player) { player.answer = null; });
    game.round = currentIndex + 1;
    game.questionIndex = game.round;
    var nextTeam = team === 'A' ? 'B' : 'A';
    if ((game.teamLives.A <= 0 && game.teamLives.B <= 0) || game.questionIndex >= game.questions.length) {
      game.status = 'finished';
      game.winner = game.teamScores.A > game.teamScores.B ? 'A' : game.teamScores.B > game.teamScores.A ? 'B' : null;
    } else {
      if (game.teamLives[nextTeam] <= 0) nextTeam = team;
      this.beginTeamTurn(game, nextTeam);
    }
    this.broadcast({ type: 'round_result', question: { question: question.question, options: question.options }, answer: question.correctAnswer, selected: selected, scores: game.players.map(function (item) { return { id: item.id, score: item.score }; }), answeredBy: answeredBy, answeredTeam: team, timedOut: Boolean(timedOut) });
  }
  async scheduleBotAnswer(game) {
    var bot = game.players.find(function (player) { return player.id === game.turn && this.isBot(player); }, this);
    if (game.status === 'playing' && bot && bot.answer === null && !game.botAnswerAt) {
      game.botAnswerAt = Math.max(Date.now(), game.resultUntil || 0) + this.botAnswerDelay(game);
    }
    await this.scheduleNextAlarm(game);
  }
  async replacePlayerWithBot(game, userId) {
    var player = game.players.find(function (item) { return item.id === userId; });
    if (!player || this.isBot(player)) return false;
    var wasTurn = !game.turn || game.turn === userId;
    player.id = game.gameType === 'millionaire_team' || game.gameType === 'gibha_sah' ? TEAM_BOT_PREFIX + (player.team || 'solo') + ':' + crypto.randomUUID() : BOT_ID;
    player.profile = BOT_PROFILES[Math.floor(Math.random() * BOT_PROFILES.length)];
    player.answer = null;
    game.botReplacedUserId = userId;
    delete game.disconnectUserId;
    delete game.disconnectDeadline;
    game.status = 'playing';
    if (game.gameType === 'millionaire_team' && wasTurn) {
      game.turn = player.id;
      game.botDiscussionAt = Date.now() + randomDelay(3000, 7000);
    } else if (game.gameType !== 'millionaire_team' && wasTurn) {
      game.turn = player.id;
      this.beginSoloTurn(game);
    }
    await this.ctx.storage.put('game', game);
    await this.updateRegistry('playing', game);
    this.broadcast({ type: 'bot_joined', replacedUserId: userId });
    this.broadcast(this.view(game));
    await this.scheduleNextAlarm(game);
    return true;
  }
  async completeRoundIfReady(game) {
    if (!game.players.every(function (player) { return player.answer !== null; })) return false;
    var answer = game.questions[game.round].correctAnswer;
    game.players.forEach(function (player) { if (player.answer === answer) player.score += 1; });
    this.broadcast({ type: 'round_result', answer: answer, scores: game.players.map(function (player) { return { id: player.id, score: player.score }; }) });
    game.round += 1;
    delete game.botAnswerAt;
    if (game.round >= game.questions.length) game.status = 'finished';
    else game.players.forEach(function (player) { player.answer = null; });
    return true;
  }
  async updateRegistry(status, game) {
    if (!this.env || !registryBinding(this.env) || !game || !game.roomCode) return;
    try {
      var registry = registryBinding(this.env);
      await registry.get(registry.idFromName('active-rooms')).fetch(new Request('https://registry/internal/update', {
        method: 'POST',
        body: JSON.stringify({ roomId: this.ctx.id && this.ctx.id.toString ? this.ctx.id.toString() : null, roomCode: game.roomCode, status: status, players: game.players.length }),
      }));
    } catch (_) { /* Registry status is helpful, but must never stop the match. */ }
  }
  view(game) {
    if (game.gameType === 'true_false') return this.october19().view(game);
    var currentIndex = Number.isInteger(game.questionIndex) ? game.questionIndex : game.round;
    if (game.gameType === 'gibha_sah' && game.status === 'playing') this.prepareGibhaBoard(game);
    var current = game.status === 'playing' ? game.questions[currentIndex] : null;
    var winner = game.winner || null;
    if (game.gameType === 'millionaire_team' && game.status === 'finished') {
      winner = game.winner || null;
    } else if (game.status === 'finished' && game.players.length >= 2) {
      var highestScore = Math.max.apply(Math, game.players.map(function (player) { return player.score; }));
      var leaders = game.players.filter(function (player) { return player.score === highestScore; });
      winner = leaders.length === 1 ? leaders[0].id : null;
    }
    return {
      type: 'state', gameType: game.gameType, status: game.status, round: currentIndex, total: game.questions.length, turn: game.turn || null,
      question: current ? { question: current.question, options: game.gameType === 'gibha_sah' ? game.gibhaBoardOptions : current.options } : null,
      gibhaRefillSlots: game.gameType === 'gibha_sah' ? game.gibhaRefillSlots || [] : undefined,
      gibhaRefillVersion: game.gameType === 'gibha_sah' ? game.gibhaRefillVersion || 0 : undefined,
      players: game.players.map(function (p) {
        var profile = p.profile || (this.isBot(p) ? game.botProfile : null);
        return { id: p.id, team: p.team || null, score: p.score, streak: p.streak || 0, answered: p.answer !== null, connected: this.connected(p.id), bot: this.isBot(p), name: profile && profile.name, avatar: profile && profile.avatar, character: p.character || (this.isBot(p) ? 'student2' : null), city: profile && profile.city, school: profile && profile.school, badge: profile && profile.badge, level: profile && profile.level, handRaised: Boolean(p.handRaised), micAllowed: Boolean(p.micAllowed), drawAllowed: Boolean(p.drawAllowed), answerFrozen: Boolean(p.answerFrozen), lastAnswer: p.lastAnswer || '', progress: p.progress || null, mission: p.mission || null, joinedAt: p.joinedAt || null, activity: p.activity || '', activityAt: p.activityAt || null };
      }, this),
      winner: winner,
      tie: game.status === 'finished' && game.players.length >= 2 && winner === null,
      endedReason: game.endedReason || null,
      leftPlayerId: game.leftPlayerId || null,
      reconnectDeadline: game.disconnectDeadline || null,
      activeTeam: game.activeTeam || null,
      teamLives: game.teamLives,
      teamScores: game.teamScores,
      discussionPhase: game.botDiscussionAt ? 'thinking' : game.botAnswerAt ? 'recommended' : null,
      questionDeadline: game.questionDeadline || null,
      lifelines: game.lifelines || null,
      classroom: game.gameType === 'live_classroom' ? {
        hostId: game.hostId,
        capacity: game.capacity,
        answersLocked: game.answersLocked !== false,
        endsAt: game.endsAt,
        contentMode: game.contentMode,
        content: game.content || null,
        drawingVersion: game.drawingVersion || 0,
        strokes: game.strokes || [],
        presenterId: game.presenterId || game.hostId,
        presenterState: game.presenterState || null,
        studyMode: game.studyMode === 'together' ? 'together' : 'teacher',
        sharedMission: game.sharedMission || '',
        bookletIndex: Math.max(0, Number(game.bookletIndex) || 0),
        bookletAnswerVisible: Boolean(game.bookletAnswerVisible),
        bookletShares: Array.isArray(game.bookletShares) ? game.bookletShares.slice(-50) : [],
        participants: game.players.map(function (player) {
          return { id: player.id, handRaised: Boolean(player.handRaised), micAllowed: Boolean(player.micAllowed), drawAllowed: Boolean(player.drawAllowed) };
        }),
      } : undefined,
    };
  }
  async fetch(request) {
    const existing = await this.read();
    const legacyInit = !existing && new URL(request.url).pathname === '/internal/init' && request.method === 'POST'
      ? await request.clone().json().catch(() => null) : null;
    if ((existing?.gameType || legacyInit?.gameType) === 'true_false') return this.october19().fetch(request);
    var url = new URL(request.url);
    var game = await this.read();
    if (url.pathname === '/internal/init' && request.method === 'POST') {
      if (game) return json({ error: 'already_initialized' }, 409, '');
      var init = await request.json();
      if (!init || typeof init.hostId !== 'string' || !validGameType(init.gameType) || !validQuestions(init.questions)) return json({ error: 'invalid_init' }, 400, '');
      var teamMode = init.gameType === 'millionaire_team';
      var fourPlayerMode = teamMode || init.gameType === 'gibha_sah';
      var classroomMode = init.gameType === 'live_classroom';
      var createdAt = Date.now();
      var availableProfileIndexes = BOT_PROFILES.map(function (_, index) { return index; }).sort(function () { return Math.random() - 0.5; });
      var configuredMatchmakingMinimum = Number(this.env && this.env.MATCHMAKING_BOT_MIN_MS);
      var configuredMatchmakingMaximum = Number(this.env && this.env.MATCHMAKING_BOT_MAX_MS);
      var matchmakingMinimum = Number.isFinite(configuredMatchmakingMinimum) && configuredMatchmakingMinimum >= 5000 ? configuredMatchmakingMinimum : 60000;
      var matchmakingMaximum = Number.isFinite(configuredMatchmakingMaximum) && configuredMatchmakingMaximum >= matchmakingMinimum ? configuredMatchmakingMaximum : 180000;
      var matchmakingCursor = createdAt;
      var matchmakingSeats = classroomMode ? 0 : (fourPlayerMode ? 3 : 1);
      var matchmakingBotSchedule = classroomMode ? undefined : Array.from({ length: matchmakingSeats }, function (_, index) {
        matchmakingCursor += randomDelay(matchmakingMinimum, matchmakingMaximum);
        return { id: TEAM_BOT_PREFIX + 'match:' + crypto.randomUUID(), profileIndex: availableProfileIndexes[index % availableProfileIndexes.length] ?? 0, joinAt: matchmakingCursor, joined: false, cancelled: false };
      });
      var classroomBotSchedule = classroomMode ? [
        { id: CLASSROOM_BOT_PREFIX + crypto.randomUUID(), profileIndex: availableProfileIndexes[0] ?? 0, score: randomDelay(20, 44), joinAt: createdAt + randomDelay(10000, 30000), stayMs: 120000, joined: false, left: false },
        { id: CLASSROOM_BOT_PREFIX + crypto.randomUUID(), profileIndex: availableProfileIndexes[1] ?? 1, score: randomDelay(50, 69), joinAt: createdAt + randomDelay(70000, 79000), stayMs: randomDelay(240000, 480000), joined: false, left: false },
        { id: CLASSROOM_BOT_PREFIX + crypto.randomUUID(), profileIndex: availableProfileIndexes[2] ?? 2, score: randomDelay(75, 96), joinAt: createdAt + randomDelay(80000, 90000), stayMs: randomDelay(240000, 480000), joined: false, left: false },
      ] : undefined;
      var initialGame = { gameType: init.gameType, roomCode: init.roomCode, hostId: init.hostId, status: classroomMode ? 'playing' : 'waiting', round: 0, questionIndex: 0, turn: init.hostId, questions: init.questions, players: [{ id: init.hostId, team: teamMode ? 'A' : null, score: 0, streak: 0, answer: null, micAllowed: classroomMode, drawAllowed: classroomMode, answerFrozen: false, handRaised: false, joinedAt: createdAt, mission: null, activity: classroomMode ? 'أنشأ الغرفة' : undefined, activityAt: classroomMode ? createdAt : undefined }], capacity: classroomMode ? classroomCapacity(init.capacity) : undefined, answersLocked: classroomMode ? true : undefined, presenterId: classroomMode ? init.hostId : undefined, presenterState: classroomMode ? null : undefined, bookletIndex: classroomMode ? 0 : undefined, bookletAnswerVisible: classroomMode ? false : undefined, studyMode: classroomMode && init.studyMode === 'together' ? 'together' : 'teacher', sharedMission: classroomMode ? String(init.sharedMission || '').trim().slice(0, 120) : undefined, durationMinutes: classroomMode ? Math.max(5, Math.min(180, Number(init.durationMinutes) || 45)) : undefined, endsAt: classroomMode ? createdAt + Math.max(5, Math.min(180, Number(init.durationMinutes) || 45)) * 60000 : undefined, contentMode: classroomMode ? (init.contentMode === 'booklet' ? 'booklet' : 'board') : undefined, content: classroomMode ? init.content || null : undefined, strokes: classroomMode ? [] : undefined, drawingVersion: classroomMode ? 0 : undefined, classroomBotSchedule: classroomBotSchedule, matchmakingBotSchedule: matchmakingBotSchedule, matchmakingBotMinimum: classroomMode ? undefined : matchmakingMinimum, matchmakingBotMaximum: classroomMode ? undefined : matchmakingMaximum, botProfile: BOT_PROFILES[Math.floor(Math.random() * BOT_PROFILES.length)], botJoinAt: undefined, activeTeam: teamMode ? 'A' : undefined, teamLives: teamMode ? { A: 3, B: 3 } : undefined, teamScores: teamMode ? { A: 0, B: 0 } : undefined, captainCursor: teamMode ? { A: 0, B: 0 } : undefined, recommendations: teamMode ? {} : undefined, lifelines: teamMode ? { fifty: false, audience: false, phone: false } : undefined };
      await this.ctx.storage.put('game', initialGame);
      await this.scheduleNextAlarm(initialGame);
      return json({ ok: true }, 200, '');
    }
    if (!game) return json({ error: 'room_not_found' }, 404, '');
    if (url.pathname === '/internal/ticket' && request.method === 'POST') {
      var ticketBody = await request.json();
      if (!ticketBody || typeof ticketBody.userId !== 'string') return json({ error: 'invalid_user' }, 400, '');
      var maxPlayers = game.gameType === 'live_classroom' ? classroomCapacity(game.capacity) + 1 : game.gameType === 'millionaire_team' || game.gameType === 'gibha_sah' ? 4 : 2;
      var occupiedSeats = game.gameType === 'live_classroom' ? this.humanPlayers(game).length : game.players.length;
      if (occupiedSeats >= maxPlayers && !game.players.some(function (p) { return p.id === ticketBody.userId; })) return json({ error: 'room_full' }, 409, '');
      var ticket = crypto.randomUUID();
      var profile = ticketBody.profile && typeof ticketBody.profile === 'object' ? {
        name: typeof ticketBody.profile.name === 'string' ? ticketBody.profile.name.slice(0, 60) : '',
        avatar: typeof ticketBody.profile.avatar === 'string' && ticketBody.profile.avatar.length <= 800 ? ticketBody.profile.avatar : '',
      } : null;
      await this.ctx.storage.put('ticket:' + ticket, { userId: ticketBody.userId, profile: profile, expires: Date.now() + 60000 });
      return json({ ticket: ticket, joined: game.players.some(function (p) { return p.id !== ticketBody.userId; }) }, 200, '');
    }
    if (url.pathname === '/internal/leave' && request.method === 'POST') {
      var leaveBody = await request.json().catch(function () { return null; });
      if (!leaveBody || typeof leaveBody.userId !== 'string') return json({ error: 'invalid_user' }, 400, '');
      if (game.gameType === 'live_classroom') {
        game.players = game.players.filter(function (player) { return player.id !== leaveBody.userId; });
        var remainingHumans = this.humanPlayers(game);
        if (remainingHumans.length && leaveBody.userId === game.hostId) {
          game.hostId = remainingHumans[0].id;
          game.presenterId = game.hostId;
          remainingHumans[0].micAllowed = true;
          remainingHumans[0].drawAllowed = true;
          remainingHumans[0].activity = 'أصبح مضيف الغرفة';
          remainingHumans[0].activityAt = Date.now();
        }
        if (!remainingHumans.length) { game.players = []; game.emptyDeadline = Date.now() + 60000; }
        await this.ctx.storage.put('game', game);
        this.broadcast(this.view(game));
        await this.updateRegistry('playing', game);
        await this.scheduleNextAlarm(game);
        return json({ ok: true, closed: false, emptyGraceSeconds: game.players.length ? 0 : 60 }, 200, '');
      }
      if (game.status === 'playing' && game.players.some(function (player) { return player.id === leaveBody.userId; }) && (game.players.length >= 2 || game.gameType === 'millionaire_team')) {
        await this.replacePlayerWithBot(game, leaveBody.userId);
        return json({ ok: true, botContinues: true }, 200, '');
      }
      if (leaveBody.userId === (game.hostId || (game.players[0] && game.players[0].id))) {
        game.status = 'closed';
        game.endedReason = 'host_left';
        game.leftPlayerId = leaveBody.userId;
        await this.ctx.storage.put('game', game);
        await this.updateRegistry('ended', game);
        this.broadcast({ type: 'room_closed', reason: 'host_left' });
        this.sockets().forEach(function (socket) { try { socket.close(4001, 'host_left'); } catch (_) {} });
        return json({ ok: true, closed: true }, 200, '');
      }
      return json({ ok: true, closed: false }, 200, '');
    }
    if (url.pathname === '/internal/ws' && (request.headers.get('Upgrade') || '').toLowerCase() === 'websocket') {
      var ticketId = url.searchParams.get('ticket');
      var ticketRecord = ticketId ? await this.ctx.storage.get('ticket:' + ticketId) : null;
      if (!ticketRecord || ticketRecord.expires < Date.now()) return json({ error: 'invalid_ticket' }, 401, '');
      await this.ctx.storage.delete('ticket:' + ticketId);
      var userId = ticketRecord.userId;
      if (!game.players.some(function (p) { return p.id === userId; })) {
        var canJoinClassroom = game.gameType === 'live_classroom' && this.humanPlayers(game).length < classroomCapacity(game.capacity) + 1 && game.status === 'playing';
        var canJoinTeam = game.gameType === 'millionaire_team' && game.players.length < 4 && game.status === 'waiting';
        var canJoinGibha = game.gameType === 'gibha_sah' && game.players.length < 4 && game.status === 'waiting';
        if (!canJoinClassroom && !canJoinTeam && !canJoinGibha && (game.players.length !== 1 || game.status !== 'waiting')) return json({ error: 'room_full' }, 409, '');
        var team = null;
        if (game.gameType === 'millionaire_team') {
          var humans = this.teamHumans(game).length;
          team = humans === 0 || humans === 1 ? 'A' : 'B';
        }
        var joinedPlayer = { id: userId, team: team, score: 0, streak: 0, answer: null, profile: ticketRecord.profile || null, micAllowed: false, drawAllowed: false, answerFrozen: false, handRaised: false, joinedAt: Date.now(), mission: null, activity: game.gameType === 'live_classroom' ? 'انضم إلى الغرفة' : undefined, activityAt: game.gameType === 'live_classroom' ? Date.now() : undefined };
        game.players.push(joinedPlayer);
        if (game.gameType === 'live_classroom') {
          delete game.emptyDeadline;
          if (!game.players.some(function (player) { return player.id === game.hostId; })) {
            game.hostId = userId;
            game.presenterId = userId;
            joinedPlayer.micAllowed = true;
            joinedPlayer.drawAllowed = true;
          }
        }
        this.assignCharacter(game, joinedPlayer);
        if (game.gameType !== 'millionaire_team' && game.gameType !== 'gibha_sah') game.status = 'playing';
        if (game.gameType === 'gibha_sah' && game.players.length === 4) game.status = 'playing';
        if (game.gameType === 'millionaire_team' && game.players.length === 4) game.status = 'playing';
        game.questionIndex = Number.isInteger(game.questionIndex) ? game.questionIndex : 0;
        if (game.gameType !== 'millionaire_team' && game.gameType !== 'gibha_sah') {
          game.turn = game.players[0].id;
          delete game.botJoinAt;
          if (Array.isArray(game.matchmakingBotSchedule)) game.matchmakingBotSchedule.forEach(function (event) { if (!event.joined) event.cancelled = true; });
          this.beginSoloTurn(game);
        }
        if (game.gameType === 'gibha_sah' && game.status === 'playing') {
          game.turn = game.players[0].id;
          delete game.botJoinAt;
          this.beginSoloTurn(game);
        }
        if (game.gameType === 'millionaire_team' && game.status === 'playing') this.beginTeamTurn(game, 'A');
        if (game.status === 'playing' && Array.isArray(game.matchmakingBotSchedule)) game.matchmakingBotSchedule.forEach(function (event) { if (!event.joined) event.cancelled = true; });
      }
      var currentPlayer = game.players.find(function (player) { return player.id === userId; });
      if (currentPlayer && ticketRecord.profile) {
        currentPlayer.profile = ticketRecord.profile;
      }
      this.assignCharacter(game, currentPlayer);
      if (game.disconnectUserId === userId) {
        delete game.disconnectUserId;
        delete game.disconnectDeadline;
        await this.scheduleNextAlarm(game);
      }
      await this.ctx.storage.put('game', game);
      await this.scheduleBotAnswer(game);
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
      await this.updateRegistry(game.status === 'waiting' ? 'waiting' : 'playing', game);
      return new Response(null, { status: 101, webSocket: client });
    }
    return json({ error: 'not_found' }, 404, '');
  }
  async webSocketMessage(socket, message) {
    if (this.ctx.storage?.get && (await this.read())?.gameType === 'true_false') return this.october19().webSocketMessage(socket, message);
    var payload;
    try { payload = JSON.parse(message); } catch (_) { return; }
    var sender = socket.deserializeAttachment();
    var liveGame = this.ctx.storage && typeof this.ctx.storage.get === 'function' ? await this.read() : null;
    if (payload && sender && liveGame && liveGame.gameType === 'live_classroom') {
      var senderPlayer = liveGame.players.find(function (player) { return player.id === sender.userId; });
      var isTeacher = sender.userId === liveGame.hostId;
      if (payload.type === 'raise_hand' && senderPlayer && !isTeacher) {
        senderPlayer.handRaised = Boolean(payload.raised);
        senderPlayer.activity = senderPlayer.handRaised ? 'رفع يده' : 'يتابع الدرس';
        senderPlayer.activityAt = Date.now();
      } else if (payload.type === 'classroom_mission' && senderPlayer) {
        var missionText = String(payload.text || '').trim().slice(0, 100);
        var missionTarget = Math.max(1, Math.min(100, Number(payload.target) || 1));
        var missionProgress = Math.max(0, Math.min(missionTarget, Number(payload.progress) || 0));
        var completionAllowed = Date.now() - Number(senderPlayer.joinedAt || Date.now()) >= 60000;
        senderPlayer.mission = missionText ? {
          text: missionText,
          target: missionTarget,
          progress: missionProgress,
          completed: completionAllowed && missionProgress >= missionTarget,
          updatedAt: Date.now(),
        } : null;
        senderPlayer.activity = missionProgress >= missionTarget ? 'أنجز مهمته' : 'ينجز مهمته';
        senderPlayer.activityAt = Date.now();
      } else if (payload.type === 'classroom_answer' && senderPlayer && !isTeacher) {
        if (liveGame.answersLocked || senderPlayer.answerFrozen) return;
        senderPlayer.lastAnswer = String(payload.value || '').slice(0, 500);
        senderPlayer.progress = payload.progress && typeof payload.progress === 'object' ? payload.progress : senderPlayer.progress;
        senderPlayer.activity = 'يكتب إجابة';
        senderPlayer.activityAt = Date.now();
        this.broadcast({ type: 'classroom_answer', from: sender.userId, value: senderPlayer.lastAnswer, sentAt: Date.now() });
      } else if (payload.type === 'classroom_progress' && senderPlayer && !isTeacher) {
        if (liveGame.answersLocked || senderPlayer.answerFrozen || !payload.progress || typeof payload.progress !== 'object') return;
        senderPlayer.progress = {
          step: Math.max(1, Math.min(200, Number(payload.progress.step) || 1)),
          solved: Math.max(0, Math.min(500, Number(payload.progress.solved) || 0)),
          total: Math.max(0, Math.min(500, Number(payload.progress.total) || 0)),
          answer: String(payload.progress.answer || '').slice(0, 120),
        };
        senderPlayer.lastAnswer = senderPlayer.progress.answer;
        senderPlayer.activity = 'يحل الآن';
        senderPlayer.activityAt = Date.now();
      } else if (payload.type === 'classroom_booklet_navigation' && senderPlayer && liveGame.studyMode === 'teacher' && isTeacher) {
        liveGame.bookletIndex = Math.max(0, Math.min(999, Number(payload.index) || 0));
        liveGame.bookletAnswerVisible = Boolean(payload.answerVisible);
        senderPlayer.activity = 'يتنقل في الملزمة';
        senderPlayer.activityAt = Date.now();
      } else if (payload.type === 'classroom_booklet_share' && senderPlayer) {
        var sharedQuestion = String(payload.question || '').trim().slice(0, 1200);
        if (!sharedQuestion) return;
        var sharedIndex = Math.max(0, Math.min(999, Number(payload.index) || 0));
        var sharedQuestionKey = sender.userId + ':' + sharedIndex;
        liveGame.bookletShareKeys = liveGame.bookletShareKeys && typeof liveGame.bookletShareKeys === 'object' ? liveGame.bookletShareKeys : {};
        if (liveGame.bookletShareKeys[sharedQuestionKey]) return;
        liveGame.bookletShareKeys[sharedQuestionKey] = true;
        liveGame.bookletShares = (liveGame.bookletShares || []).slice(-49).concat({
          id: crypto.randomUUID(),
          from: sender.userId,
          index: sharedIndex,
          question: sharedQuestion,
          answer: String(payload.answer || '').trim().slice(0, 1800),
          createdAt: Date.now(),
        });
        senderPlayer.activity = 'شارك سؤالاً';
        senderPlayer.activityAt = Date.now();
      } else if (payload.type === 'classroom_presenter_state' && (isTeacher || sender.userId === liveGame.presenterId)) {
        var serializedPresenterState = JSON.stringify(payload.state || {});
        if (serializedPresenterState.length > 220000) return;
        liveGame.presenterState = payload.state && typeof payload.state === 'object' ? payload.state : null;
      } else if (payload.type === 'classroom_board_share' && senderPlayer && (isTeacher || senderPlayer.drawAllowed)) {
        var sharedStrokes = Array.isArray(payload.strokes) ? payload.strokes.slice(-120) : [];
        var normalizedSharedStrokes = sharedStrokes.map(function (stroke) {
          if (!stroke || !Array.isArray(stroke.points) || stroke.points.length < 2 || stroke.points.length > 1200) return null;
          return {
            id: String(stroke.id || crypto.randomUUID()).slice(0, 80),
            owner: sender.userId,
            color: typeof stroke.color === 'string' ? stroke.color.slice(0, 20) : '#173f5f',
            size: Math.max(1, Math.min(24, Number(stroke.size) || 4)),
            tool: ['pen', 'eraser', 'text'].includes(stroke.tool) ? stroke.tool : 'pen',
            text: stroke.tool === 'text' ? String(stroke.text || '').trim().slice(0, 120) : undefined,
            fontSize: stroke.tool === 'text' ? Math.max(12, Math.min(72, Number(stroke.fontSize) || 24)) : undefined,
            points: stroke.points.map(function (point) { return { x: Math.max(0, Math.min(1, Number(point.x) || 0)), y: Math.max(0, Math.min(1, Number(point.y) || 0)) }; }),
          };
        }).filter(Boolean);
        if (!normalizedSharedStrokes.length) return;
        liveGame.strokes = (liveGame.strokes || []).concat(normalizedSharedStrokes).slice(-300);
        liveGame.drawingVersion = Number(liveGame.drawingVersion || 0) + 1;
        senderPlayer.activity = 'شارك سبورته';
        senderPlayer.activityAt = Date.now();
      } else if (payload.type === 'classroom_stroke' && senderPlayer && (isTeacher || senderPlayer.drawAllowed)) {
        var stroke = payload.stroke;
        if (!stroke || !Array.isArray(stroke.points) || stroke.points.length < 2 || stroke.points.length > 1200) return;
        var normalized = {
          id: String(stroke.id || crypto.randomUUID()).slice(0, 80),
          owner: sender.userId,
          color: typeof stroke.color === 'string' ? stroke.color.slice(0, 20) : '#facc15',
          size: Math.max(1, Math.min(24, Number(stroke.size) || 4)),
          tool: ['pen', 'eraser', 'text'].includes(stroke.tool) ? stroke.tool : 'pen',
          text: stroke.tool === 'text' ? String(stroke.text || '').trim().slice(0, 120) : undefined,
          fontSize: stroke.tool === 'text' ? Math.max(12, Math.min(72, Number(stroke.fontSize) || 24)) : undefined,
          points: stroke.points.map(function (point) { return { x: Math.max(0, Math.min(1, Number(point.x) || 0)), y: Math.max(0, Math.min(1, Number(point.y) || 0)) }; }),
        };
        liveGame.strokes = (liveGame.strokes || []).slice(-299).concat(normalized);
        liveGame.drawingVersion = Number(liveGame.drawingVersion || 0) + 1;
      } else if (payload.type === 'classroom_control' && isTeacher) {
        var action = payload.action;
        var target = liveGame.players.find(function (player) { return player.id === payload.targetId; });
        if (action === 'answers_locked') liveGame.answersLocked = Boolean(payload.value);
        if (action === 'shared_mission') liveGame.sharedMission = String(payload.value || '').trim().slice(0, 120);
        if (action === 'mic_permission' && target && target.id !== liveGame.hostId) {
          target.micAllowed = Boolean(payload.value);
          if (target.micAllowed) target.handRaised = false;
        }
        if (action === 'draw_permission' && target && target.id !== liveGame.hostId) target.drawAllowed = Boolean(payload.value);
        if (action === 'answer_permission' && target && target.id !== liveGame.hostId) target.answerFrozen = !Boolean(payload.value);
        if (action === 'select_presenter' && target) {
          liveGame.presenterId = target.id;
          liveGame.players.forEach(function (player) { if (player.id !== liveGame.hostId) player.drawAllowed = player.id === target.id; });
          target.handRaised = false;
          target.activity = 'يشرح الآن';
          target.activityAt = Date.now();
        }
        if (action === 'restore_presenter') {
          liveGame.presenterId = liveGame.hostId;
          liveGame.players.forEach(function (player) { if (player.id !== liveGame.hostId) player.drawAllowed = false; });
        }
        if (action === 'mute_all') liveGame.players.forEach(function (player) { if (player.id !== liveGame.hostId) player.micAllowed = false; });
        if (action === 'select_speaker' && target && target.id !== liveGame.hostId) {
          liveGame.players.forEach(function (player) { if (player.id !== liveGame.hostId) player.micAllowed = player.id === target.id; });
          target.handRaised = false;
          target.activity = 'يتحدث الآن';
          target.activityAt = Date.now();
        }
        if (action === 'clear_drawing') { liveGame.strokes = []; liveGame.drawingVersion = Number(liveGame.drawingVersion || 0) + 1; }
        if (action === 'extend_time') liveGame.endsAt = Math.max(Date.now(), Number(liveGame.endsAt) || Date.now()) + Math.max(1, Math.min(60, Number(payload.minutes) || 5)) * 60000;
        if (action === 'change_content' && payload.content && typeof payload.content === 'object') {
          liveGame.contentMode = payload.contentMode === 'booklet' ? 'booklet' : 'board';
          liveGame.content = payload.content;
          liveGame.strokes = [];
          liveGame.drawingVersion = Number(liveGame.drawingVersion || 0) + 1;
        }
      } else if (payload.type === 'audio_state') {
        if (!isTeacher && !(senderPlayer && senderPlayer.micAllowed)) return;
        this.broadcast({ type: 'audio_state', from: sender.userId, enabled: Boolean(payload.enabled) });
        return;
      } else if (payload.type === 'audio_signal') {
        if (!isTeacher && !(senderPlayer && senderPlayer.micAllowed)) return;
        this.broadcast({ type: 'audio_signal', from: sender.userId, targetId: payload.targetId || null, signal: payload.signal }, socket);
        return;
      } else return;
      await this.ctx.storage.put('game', liveGame);
      this.broadcast(this.view(liveGame));
      await this.updateRegistry('playing', liveGame);
      return;
    }
    if (payload && payload.type === 'reaction' && sender && liveGame && liveGame.gameType === 'gibha_sah' && liveGame.status === 'playing') {
      var reactionKinds = ['clap', 'laugh', 'think', 'angry', 'rocket'];
      if (!reactionKinds.includes(payload.kind)) return;
      liveGame.reactionTurn = Number(liveGame.reactionTurn || 0);
      liveGame.reactionUses = liveGame.reactionUses || {};
      if (liveGame.reactionUses[sender.userId] === liveGame.reactionTurn) return;
      var needsTarget = payload.kind === 'rocket' || payload.kind === 'laugh';
      var reactionTarget = needsTarget ? liveGame.players.find(function (player) { return player.id === payload.targetId && player.id !== sender.userId; }) : null;
      if (needsTarget && !reactionTarget) return;
      liveGame.reactionUses[sender.userId] = liveGame.reactionTurn;
      await this.ctx.storage.put('game', liveGame);
      this.broadcast({ type: 'reaction', kind: payload.kind, from: sender.userId, targetId: reactionTarget ? reactionTarget.id : null, sentAt: Date.now(), turn: liveGame.reactionTurn });
      return;
    }
    if (payload && payload.type === 'chat' && sender && typeof payload.text === 'string') {
      var chatText = payload.text.trim().slice(0, 300);
      if (!chatText) return;
      var chatSender = liveGame && liveGame.players.find(function (player) { return player.id === sender.userId; });
      if (liveGame && liveGame.gameType === 'millionaire_team' && chatSender) this.sendToTeam(liveGame, chatSender.team, { type: 'chat', from: sender.userId, text: chatText, sentAt: Date.now(), team: chatSender.team });
      else this.broadcast({ type: 'chat', from: sender.userId, text: chatText, sentAt: Date.now() });
      return;
    }
    if (payload && payload.type === 'audio_state' && sender && typeof payload.enabled === 'boolean') {
      var audioSender = liveGame && liveGame.players.find(function (player) { return player.id === sender.userId; });
      this.sockets().forEach(function (peer) {
        var peerAttachment = peer.deserializeAttachment();
        var peerPlayer = liveGame && liveGame.players.find(function (player) { return player.id === (peerAttachment && peerAttachment.userId); });
        if (peer !== socket && (!liveGame || liveGame.gameType !== 'millionaire_team' || (audioSender && peerPlayer && audioSender.team === peerPlayer.team))) this.send(peer, { type: 'audio_state', from: sender.userId, enabled: payload.enabled });
      }, this);
      return;
    }
    if (payload && payload.type === 'audio_signal' && sender && payload.signal && typeof payload.signal === 'object') {
      var signalSender = liveGame && liveGame.players.find(function (player) { return player.id === sender.userId; });
      this.sockets().forEach(function (peer) {
        var peerAttachment = peer.deserializeAttachment();
        var peerPlayer = liveGame && liveGame.players.find(function (player) { return player.id === (peerAttachment && peerAttachment.userId); });
        var targeted = !payload.targetId || (peerAttachment && peerAttachment.userId === payload.targetId);
        if (peer !== socket && targeted && (!liveGame || liveGame.gameType !== 'millionaire_team' || (signalSender && peerPlayer && signalSender.team === peerPlayer.team))) this.send(peer, { type: 'audio_signal', from: sender.userId, targetId: payload.targetId || null, signal: payload.signal });
      }, this);
      return;
    }
    if (payload && payload.type === 'recommend' && sender && Number.isInteger(payload.option) && liveGame && liveGame.gameType === 'millionaire_team' && liveGame.status === 'playing') {
      var recommender = liveGame.players.find(function (player) { return player.id === sender.userId; });
      var recommendQuestion = liveGame.questions[liveGame.questionIndex];
      if (!recommender || recommender.team !== liveGame.activeTeam || payload.option < 0 || payload.option >= recommendQuestion.options.length) return;
      liveGame.recommendations[recommender.id] = payload.option;
      await this.ctx.storage.put('game', liveGame);
      this.sendToTeam(liveGame, recommender.team, { type: 'team_recommendation', from: recommender.id, option: payload.option, team: recommender.team });
      this.broadcast(this.view(liveGame));
      return;
    }
    if (payload && payload.type === 'lifeline' && sender && ['fifty', 'audience', 'phone'].includes(payload.kind)) {
      var lifelineGame = await this.read();
      if (!lifelineGame || lifelineGame.gameType !== 'millionaire_team' || lifelineGame.status !== 'playing' || lifelineGame.turn !== sender.userId || lifelineGame.lifelines[payload.kind]) return;
      var lifelineQuestion = lifelineGame.questions[lifelineGame.questionIndex];
      if (!lifelineQuestion) return;
      lifelineGame.lifelines[payload.kind] = true;
      var result = { type: 'lifeline_result', kind: payload.kind };
      if (payload.kind === 'fifty') {
        var wrongOptions = lifelineQuestion.options.map(function (_, index) { return index; }).filter(function (index) { return index !== lifelineQuestion.correctAnswer; });
        result.keep = [lifelineQuestion.correctAnswer, wrongOptions[Math.floor(Math.random() * wrongOptions.length)]].sort(function (a, b) { return a - b; });
      } else if (payload.kind === 'audience') {
        var remaining = 35;
        result.percentages = lifelineQuestion.options.map(function (_, index) {
          if (index === lifelineQuestion.correctAnswer) return 65;
          var share = index === lifelineQuestion.options.length - 1 ? remaining : Math.floor(Math.random() * (remaining + 1));
          remaining -= share;
          return share;
        });
      } else {
        result.suggested = Math.random() < 0.8 ? lifelineQuestion.correctAnswer : Math.floor(Math.random() * lifelineQuestion.options.length);
      }
      await this.ctx.storage.put('game', lifelineGame);
      var lifelinePlayer = lifelineGame.players.find(function (player) { return player.id === sender.userId; });
      this.sendToTeam(lifelineGame, lifelinePlayer.team, result);
      this.broadcast(this.view(lifelineGame));
      return;
    }
    if (payload && payload.type === 'gibha_power' && sender && ['fifty', 'freeze', 'reveal'].includes(payload.kind)) {
      var powerGame = await this.read();
      if (!powerGame || powerGame.gameType !== 'gibha_sah' || powerGame.status !== 'playing' || powerGame.turn !== sender.userId) return;
      powerGame.gibhaPowers = powerGame.gibhaPowers || {};
      powerGame.gibhaPowers[sender.userId] = powerGame.gibhaPowers[sender.userId] || {};
      if (powerGame.gibhaPowers[sender.userId][payload.kind]) return;
      this.prepareGibhaBoard(powerGame);
      var powerQuestion = powerGame.questions[powerGame.questionIndex];
      if (!powerQuestion) return;
      powerGame.gibhaPowers[sender.userId][payload.kind] = true;
      var powerResult = { type: 'gibha_power_result', kind: payload.kind };
      if (payload.kind === 'fifty') {
        var powerAnswer = powerQuestion.options[powerQuestion.correctAnswer];
        var powerAnswerKey = this.answerKey(powerAnswer);
        var powerCorrect = powerGame.gibhaBoardOptions.findIndex(function (option) { return this.answerKey(option) === powerAnswerKey; }, this);
        var powerWrong = powerGame.gibhaBoardOptions.map(function (option, index) { return option && index !== powerCorrect ? index : -1; }).filter(function (index) { return index >= 0; });
        var keepWrongCount = Math.min(3, Math.max(1, powerGame.gibhaBoardOptions.length - 3));
        powerWrong.sort(function () { return Math.random() - 0.5; });
        powerResult.keep = [powerCorrect].concat(powerWrong.slice(0, keepWrongCount));
      } else if (payload.kind === 'freeze') {
        powerResult.seconds = 5;
      } else {
        var rivalSelection = Object.entries(powerGame.lastSelections || {}).reverse().find(function (entry) { return entry[0] !== sender.userId; });
        powerResult.option = rivalSelection ? rivalSelection[1] : null;
      }
      await this.ctx.storage.put('game', powerGame);
      this.send(socket, powerResult);
      return;
    }
    if (!payload || payload.type !== 'answer' || !Number.isInteger(payload.option)) return;
    var game = await this.read();
    if (!game || game.status !== 'playing') return;
    if (Date.now() < (game.resultUntil || 0)) return;
    if (payload.round !== undefined && payload.round !== game.round) return;
    var currentIndex = Number.isInteger(game.questionIndex) ? game.questionIndex : game.round;
    var currentQuestion = game.questions[currentIndex];
    if (game.gameType === 'gibha_sah') this.prepareGibhaBoard(game);
    var liveOptions = game.gameType === 'gibha_sah' ? game.gibhaBoardOptions : currentQuestion.options;
    if (payload.option < 0 || payload.option >= liveOptions.length || !liveOptions[payload.option]) return;
    var attachment = socket.deserializeAttachment();
    var player = attachment && game.players.find(function (p) { return p.id === attachment.userId; });
    if (!player || player.answer !== null) return;
    if (game.turn && attachment.userId !== game.turn) return;
    player.answer = payload.option;
    game.lastSelections = game.lastSelections || {};
    game.lastSelections[attachment.userId] = payload.option;
    if (game.gameType === 'millionaire_team') {
      await this.finishTeamRound(game, payload.option, attachment.userId, false);
      await this.ctx.storage.put('game', game);
      this.broadcast(this.view(game));
      if (game.status === 'finished') await this.updateRegistry('ended', game);
      else await this.scheduleNextAlarm(game);
      return;
    }
    // Every supported challenge is turn based. The other player watches the
    // selected answer and its result before the turn moves to them. Keeping a
    // single path also prevents the two clients from drifting between rounds.
    if (game.gameType === 'millionaire' || game.gameType === 'true_false' || game.gameType === 'gibha_sah') {
      var chosen = player.answer;
      var correctText = game.gameType === 'gibha_sah' ? currentQuestion.options[currentQuestion.correctAnswer] : null;
      var correctTextKey = this.answerKey(correctText);
      var correctAnswer = game.gameType === 'gibha_sah' ? game.gibhaBoardOptions.findIndex(function (option) { return this.answerKey(option) === correctTextKey; }, this) : currentQuestion.correctAnswer;
      var isCorrect = game.gameType === 'gibha_sah' ? this.answerKey(game.gibhaBoardOptions[chosen]) === correctTextKey : chosen === correctAnswer;
      var resultOptions = game.gameType === 'gibha_sah' ? game.gibhaBoardOptions.slice() : currentQuestion.options;
      if (isCorrect) {
        if (game.gameType === 'gibha_sah') {
          player.streak = (player.streak || 0) + 1;
          player.score += player.streak >= 3 ? 2 : 1;
        } else player.score += 1;
      } else if (game.gameType === 'gibha_sah') player.streak = 0;
      // In Gibha Sah, a wrong answer stays on the board but moves to the end
      // of the question queue. This prevents repeated immediate retries while
      // ensuring the unsolved card returns later.
      var nextQuestionIndex = currentIndex + 1;
      if (game.gameType === 'gibha_sah') {
        game.gibhaRefillSlots = [];
        var finishAfterThisAnswer = false;
        if (isCorrect) {
          game.gibhaBoardSlots[chosen] = null;
          game.gibhaBoardOptions[chosen] = '';
          var remainingCards = game.gibhaBoardSlots.filter(Boolean).length;
          var pendingCards = (game.gibhaPendingQuestions || []).length;
          // When only two cards existed before this correct answer and there is
          // nothing left to refill, finish immediately instead of forcing the
          // players to answer the final orphan card.
          finishAfterThisAnswer = remainingCards === 0 && pendingCards === 0;
          if (!finishAfterThisAnswer && remainingCards <= 3) this.refillGibhaBoard(game);
        }
        nextQuestionIndex = finishAfterThisAnswer ? game.questions.length : this.advanceGibhaQuestion(game, currentIndex, isCorrect);
      }
      game.round = nextQuestionIndex;
      game.questionIndex = nextQuestionIndex;
      if (game.gameType === 'gibha_sah') {
        var currentPlayerIndex = game.players.findIndex(function (item) { return item.id === attachment.userId; });
        game.turn = game.players[(currentPlayerIndex + 1) % game.players.length]?.id || null;
      } else game.turn = game.players.find(function (item) { return item.id !== attachment.userId; })?.id || null;
      game.players.forEach(function (item) { item.answer = null; });
      game.reactionTurn = Number(game.reactionTurn || 0) + 1;
      if (game.questionIndex >= game.questions.length) game.status = 'finished';
      else this.beginSoloTurn(game, this.resultDuration(game, player, isCorrect));
      var roundPayload = { type: 'round_result', question: { question: currentQuestion.question, options: resultOptions }, selected: chosen, correct: isCorrect, scores: game.players.map(function (item) { return { id: item.id, score: item.score }; }), answeredBy: attachment.userId };
      if (game.gameType === 'true_false') roundPayload.resultDurationMs = this.resultDuration(game, player, isCorrect);
      // Never disclose Gibha Sah's correct card after a mistake.
      if (game.gameType !== 'gibha_sah' || isCorrect) roundPayload.answer = correctAnswer;
      this.broadcast(roundPayload);
      await this.ctx.storage.put('game', game);
      this.broadcast(this.view(game));
      if (game.status === 'finished') await this.updateRegistry('ended', game);
      else await this.scheduleNextAlarm(game);
      return;
    }
    // Unknown legacy game types retain the old simultaneous-answer behaviour.
    await this.completeRoundIfReady(game);
    await this.ctx.storage.put('game', game);
    this.broadcast(this.view(game));
    if (game.status === 'finished') await this.updateRegistry('ended', game);
  }
  async handleDisconnect(socket) {
    if ((await this.read())?.gameType === 'true_false') return this.october19().handleDisconnect(socket);
    var game = await this.read();
    if (!game || game.status === 'closed' || game.status === 'finished' || game.status === 'abandoned') return;
    var attachment = socket && socket.deserializeAttachment ? socket.deserializeAttachment() : null;
    var userId = attachment && attachment.userId;
    // A closing socket can remain in getWebSockets() briefly. Exclude the socket
    // that raised this event, otherwise the reconnect grace period never starts.
    if (!userId || !game.players.some(function (player) { return player.id === userId; }) || this.connected(userId, socket)) return;
    if (game.gameType === 'live_classroom') {
      game.players = game.players.filter(function (player) { return player.id !== userId; });
      var remainingClassroomHumans = this.humanPlayers(game);
      if (remainingClassroomHumans.length && userId === game.hostId) {
        game.hostId = remainingClassroomHumans[0].id;
        game.presenterId = game.hostId;
        remainingClassroomHumans[0].micAllowed = true;
        remainingClassroomHumans[0].drawAllowed = true;
        remainingClassroomHumans[0].activity = 'أصبح مضيف الغرفة';
        remainingClassroomHumans[0].activityAt = Date.now();
      }
      if (!remainingClassroomHumans.length) { game.players = []; game.emptyDeadline = Date.now() + 60000; }
      await this.ctx.storage.put('game', game);
      this.broadcast(this.view(game));
      await this.updateRegistry('playing', game);
      await this.scheduleNextAlarm(game);
      return;
    }
    game.disconnectUserId = userId;
    game.disconnectDeadline = Date.now() + 30000;
    await this.ctx.storage.put('game', game);
    this.broadcast(this.view(game));
    await this.updateRegistry('reconnecting', game);
    await this.ctx.storage.setAlarm(game.disconnectDeadline);
  }
  async alarm() {
    if ((await this.read())?.gameType === 'true_false') return this.october19().alarm();
    var game = await this.read();
    if (!game || ['closed', 'finished', 'abandoned'].includes(game.status)) return;
    var now = Date.now();
    if (game.gameType === 'live_classroom' && game.emptyDeadline && now >= game.emptyDeadline) {
      if (!game.players.length) {
        game.status = 'closed';
        game.endedReason = 'empty_room';
        delete game.emptyDeadline;
        await this.ctx.storage.put('game', game);
        await this.updateRegistry('ended', game);
        return;
      }
      delete game.emptyDeadline;
    }
    if (game.gameType === 'live_classroom' && Array.isArray(game.classroomBotSchedule)) {
      var classroomBotsChanged = false;
      var classroomHasHuman = this.hasConnectedHuman(game);
      game.classroomBotSchedule.forEach(function (event) {
        if (event.left) return;
        if (!event.joined && now >= event.joinAt) {
          if (!classroomHasHuman) { event.joinAt = now + 30000; return; }
          var botProfile = BOT_PROFILES[event.profileIndex % BOT_PROFILES.length] || BOT_PROFILES[0];
          game.players.push({ id: event.id, score: event.score, streak: 0, answer: null, profile: botProfile, micAllowed: false, drawAllowed: false, answerFrozen: false, handRaised: false, joinedAt: now, mission: null, activity: 'انضم إلى الدرس', activityAt: now });
          event.joined = true;
          event.leaveAt = now + event.stayMs;
          classroomBotsChanged = true;
        } else if (event.joined && now >= event.leaveAt) {
          game.players = game.players.filter(function (player) { return player.id !== event.id; });
          event.left = true;
          classroomBotsChanged = true;
        }
      });
      if (classroomBotsChanged) {
        await this.updateRegistry('playing', game);
        this.broadcast(this.view(game));
      }
    }
    if (game.status === 'waiting' && Array.isArray(game.matchmakingBotSchedule) && this.hasConnectedHuman(game)) {
      var matchmakingTarget = game.gameType === 'millionaire_team' || game.gameType === 'gibha_sah' ? 4 : 2;
      var dueMatchmakingBot = game.matchmakingBotSchedule.find(function (event) { return !event.joined && !event.cancelled && now >= event.joinAt; });
      if (dueMatchmakingBot && game.players.length < matchmakingTarget) {
        var matchmakingProfile = BOT_PROFILES[dueMatchmakingBot.profileIndex % BOT_PROFILES.length] || BOT_PROFILES[0];
        var matchmakingTeam = null;
        if (game.gameType === 'millionaire_team') {
          var matchmakingTeamASeats = this.teamPlayers(game, 'A').length;
          var matchmakingTeamBSeats = this.teamPlayers(game, 'B').length;
          matchmakingTeam = matchmakingTeamASeats < 2 && matchmakingTeamASeats <= matchmakingTeamBSeats ? 'A' : 'B';
        }
        var matchmakingBot = { id: dueMatchmakingBot.id, team: matchmakingTeam, score: 0, streak: 0, answer: null, profile: matchmakingProfile };
        game.players.push(matchmakingBot);
        this.assignCharacter(game, matchmakingBot);
        dueMatchmakingBot.joined = true;
        var nextMatchmakingBot = game.matchmakingBotSchedule.find(function (event) { return !event.joined && !event.cancelled; });
        if (nextMatchmakingBot && nextMatchmakingBot.joinAt <= now) nextMatchmakingBot.joinAt = now + randomDelay(game.matchmakingBotMinimum || 60000, game.matchmakingBotMaximum || 180000);
        if (game.players.length >= matchmakingTarget) {
          game.status = 'playing';
          game.matchmakingBotSchedule.forEach(function (event) { if (!event.joined) event.cancelled = true; });
          if (game.gameType === 'millionaire_team') this.beginTeamTurn(game, 'A');
          else {
            game.turn = game.players[0].id;
            this.beginSoloTurn(game);
          }
        }
        await this.updateRegistry(game.status === 'waiting' ? 'waiting' : 'playing', game);
        this.broadcast({ type: 'bot_joined', replacedUserId: null, botId: matchmakingBot.id });
        this.broadcast(this.view(game));
      } else if (game.players.length >= matchmakingTarget) {
        game.matchmakingBotSchedule.forEach(function (event) { if (!event.joined) event.cancelled = true; });
      }
    }
    if (game.status === 'waiting' && !Array.isArray(game.matchmakingBotSchedule) && game.botJoinAt && now >= game.botJoinAt && (game.gameType === 'millionaire_team' || game.gameType === 'gibha_sah' || game.players.length === 1) && this.connected(game.players[0].id)) {
      if (game.gameType === 'millionaire_team') {
        while (game.players.length < 4) {
          var teamASeats = this.teamPlayers(game, 'A').length;
          var botTeam = teamASeats < 2 ? 'A' : 'B';
          var profile = BOT_PROFILES[(game.players.length - 1) % BOT_PROFILES.length];
          game.players.push({ id: TEAM_BOT_PREFIX + botTeam + ':' + crypto.randomUUID(), team: botTeam, score: 0, streak: 0, answer: null, profile: profile });
        }
      } else if (game.gameType === 'gibha_sah') {
        while (game.players.length < 4) {
          var gibhaProfile = BOT_PROFILES[(game.players.length - 1) % BOT_PROFILES.length];
          game.players.push({ id: TEAM_BOT_PREFIX + 'gibha:' + crypto.randomUUID(), score: 0, streak: 0, answer: null, profile: gibhaProfile });
        }
      } else {
        var waitingBot = { id: BOT_ID, score: 0, answer: null };
        game.players.push(waitingBot);
        this.assignCharacter(game, waitingBot);
      }
      game.status = 'playing';
      delete game.botJoinAt;
      if (game.gameType === 'millionaire_team') this.beginTeamTurn(game, 'A');
      else this.beginSoloTurn(game);
      await this.updateRegistry('playing', game);
      this.broadcast({ type: 'bot_joined', replacedUserId: null });
      this.broadcast(this.view(game));
    }
    if (game.gameType === 'millionaire_team' && game.status === 'playing' && game.botDiscussionAt && now >= game.botDiscussionAt) {
      var discussionQuestion = game.questions[game.questionIndex];
      var discussionCaptain = game.players.find(function (player) { return player.id === game.turn; });
      var discussionMate = this.teamPlayers(game, game.activeTeam).find(function (player) { return this.isBot(player) && player.id !== game.turn; }, this);
      if (discussionMate && discussionQuestion) {
        var recommendation = this.chooseBotAnswer(game);
        game.recommendations[discussionMate.id] = recommendation;
        this.sendToTeam(game, game.activeTeam, { type: 'team_recommendation', from: discussionMate.id, option: recommendation, team: game.activeTeam, bot: true });
      }
      delete game.botDiscussionAt;
      // The complete visible thinking time is 10–30 seconds: 3–7 seconds
      // of team discussion followed by 7–23 seconds before the captain answers.
      if (discussionCaptain && this.isBot(discussionCaptain)) game.botAnswerAt = now + randomDelay(7000, 23000);
      else game.questionDeadline = now + 60000;
      this.broadcast(this.view(game));
    }
    if (game.gameType === 'millionaire_team' && game.status === 'playing' && game.questionDeadline && now >= game.questionDeadline) {
      await this.finishTeamRound(game, -1, game.turn, true);
      if (game.status === 'finished') await this.updateRegistry('ended', game);
      this.broadcast(this.view(game));
    }
    if ((game.gameType === 'true_false' || game.gameType === 'gibha_sah' || game.gameType === 'millionaire') && game.status === 'playing' && game.questionDeadline && now >= game.questionDeadline) {
      var timedOutPlayer = game.players.find(function (player) { return player.id === game.turn; });
      var timedOutIndex = Number.isInteger(game.questionIndex) ? game.questionIndex : game.round;
      var timedOutQuestion = game.questions[timedOutIndex];
      if (timedOutPlayer && timedOutQuestion && !this.isBot(timedOutPlayer)) {
        var timedOutId = timedOutPlayer.id;
        game.round = game.gameType === 'gibha_sah' ? this.advanceGibhaQuestion(game, timedOutIndex, false) : timedOutIndex + 1;
        game.questionIndex = game.round;
        game.turn = game.gameType === 'gibha_sah' ? game.players[(game.players.findIndex(function (player) { return player.id === timedOutId; }) + 1) % game.players.length]?.id || null : game.players.find(function (player) { return player.id !== timedOutId; })?.id || null;
        if (game.gameType === 'gibha_sah') timedOutPlayer.streak = 0;
        game.players.forEach(function (player) { player.answer = null; });
        if (game.questionIndex >= game.questions.length) {
          game.status = 'finished';
          delete game.questionDeadline;
        } else this.beginSoloTurn(game);
        this.broadcast({ type: 'round_result', question: { question: timedOutQuestion.question, options: game.gameType === 'gibha_sah' ? game.gibhaBoardOptions.slice() : timedOutQuestion.options }, selected: -1, correct: false, timedOut: true, scores: game.players.map(function (player) { return { id: player.id, score: player.score }; }), answeredBy: timedOutId, ...(game.gameType === 'true_false' ? { answer: timedOutQuestion.correctAnswer } : {}) });
        this.broadcast(this.view(game));
        if (game.status === 'finished') await this.updateRegistry('ended', game);
      }
    }
    if (game.disconnectUserId && game.disconnectDeadline && now >= game.disconnectDeadline) {
      var disconnectedId = game.disconnectUserId;
      if (this.connected(disconnectedId)) {
        delete game.disconnectUserId;
        delete game.disconnectDeadline;
      } else if (game.status === 'playing') {
        await this.replacePlayerWithBot(game, disconnectedId);
        return;
      } else {
        game.status = 'closed';
        game.endedReason = 'host_disconnected';
        delete game.disconnectUserId;
        delete game.disconnectDeadline;
        await this.updateRegistry('ended', game);
      }
    }
    if (game.gameType === 'millionaire_team' && game.status === 'playing' && game.botAnswerAt && now >= game.botAnswerAt) {
      var teamBot = game.players.find(function (player) { return player.id === game.turn && this.isBot(player); }, this);
      if (teamBot) {
        var teamBotSelected = this.chooseBotAnswer(game);
        await this.finishTeamRound(game, teamBotSelected, teamBot.id, false);
        if (game.status === 'finished') await this.updateRegistry('ended', game);
        this.broadcast(this.view(game));
      }
      delete game.botAnswerAt;
    }
    if (game.gameType !== 'millionaire_team' && game.status === 'playing' && game.botAnswerAt && now >= game.botAnswerAt) {
      var bot = game.players.find(function (player) { return player.id === game.turn && this.isBot(player); }, this);
      if (bot && bot.answer === null) {
        var botQuestion = game.questions[Number.isInteger(game.questionIndex) ? game.questionIndex : game.round];
        if (game.gameType === 'gibha_sah') this.prepareGibhaBoard(game);
        bot.answer = this.chooseBotAnswer(game);
        var botSelected = bot.answer;
        game.lastSelections = game.lastSelections || {};
        game.lastSelections[bot.id] = botSelected;
        var botCorrectText = game.gameType === 'gibha_sah' ? botQuestion.options[botQuestion.correctAnswer] : null;
        var botCorrectTextKey = this.answerKey(botCorrectText);
        var botCorrect = game.gameType === 'gibha_sah' ? game.gibhaBoardOptions.findIndex(function (option) { return this.answerKey(option) === botCorrectTextKey; }, this) : botQuestion.correctAnswer;
        var botWasCorrect = game.gameType === 'gibha_sah' ? this.answerKey(game.gibhaBoardOptions[botSelected]) === botCorrectTextKey : bot.answer === botCorrect;
        var botResultOptions = game.gameType === 'gibha_sah' ? game.gibhaBoardOptions.slice() : botQuestion.options;
        if (botWasCorrect) {
          if (game.gameType === 'gibha_sah') {
            bot.streak = (bot.streak || 0) + 1;
            bot.score += bot.streak >= 3 ? 2 : 1;
          } else bot.score += 1;
        } else if (game.gameType === 'gibha_sah') bot.streak = 0;
        var botCurrentIndex = Number.isInteger(game.questionIndex) ? game.questionIndex : game.round;
        var botNextQuestionIndex = botCurrentIndex + 1;
        if (game.gameType === 'gibha_sah') {
          game.gibhaRefillSlots = [];
          if (botWasCorrect) {
            game.gibhaBoardSlots[botSelected] = null;
            game.gibhaBoardOptions[botSelected] = '';
            var botRemainingCards = game.gibhaBoardSlots.filter(Boolean).length;
            if (botRemainingCards <= 3) this.refillGibhaBoard(game);
          }
          botNextQuestionIndex = this.advanceGibhaQuestion(game, botCurrentIndex, botWasCorrect);
        }
        game.round = botNextQuestionIndex;
        game.questionIndex = botNextQuestionIndex;
        if (game.gameType === 'gibha_sah') {
          var botIndex = game.players.findIndex(function (item) { return item.id === bot.id; });
          game.turn = game.players[(botIndex + 1) % game.players.length]?.id || null;
        } else game.turn = game.players.find(function (item) { return item.id !== bot.id; })?.id || null;
        game.players.forEach(function (item) { item.answer = null; });
        game.reactionTurn = Number(game.reactionTurn || 0) + 1;
        if (game.questionIndex >= game.questions.length) game.status = 'finished';
        else this.beginSoloTurn(game, this.resultDuration(game, bot, botWasCorrect));
        var botRoundPayload = { type: 'round_result', question: { question: botQuestion.question, options: botResultOptions }, selected: botSelected, correct: botWasCorrect, scores: game.players.map(function (item) { return { id: item.id, score: item.score }; }), answeredBy: bot.id };
        if (game.gameType === 'true_false') botRoundPayload.resultDurationMs = this.resultDuration(game, bot, botWasCorrect);
        if (game.gameType !== 'gibha_sah' || botWasCorrect) botRoundPayload.answer = botCorrect;
        this.broadcast(botRoundPayload);
      }
      if (game.botAnswerAt && game.botAnswerAt <= now) delete game.botAnswerAt;
      if (game.status === 'finished') await this.updateRegistry('ended', game);
      this.broadcast(this.view(game));
      await this.scheduleBotAnswer(game);
    }
    await this.ctx.storage.put('game', game);
    await this.scheduleNextAlarm(game);
  }
  webSocketClose(socket) { this.ctx.waitUntil(this.handleDisconnect(socket)); }
  webSocketError(socket) { this.ctx.waitUntil(this.handleDisconnect(socket)); }
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
      var code = typeof body.code === 'string' && /^\d{4}$/.test(body.code) ? body.code : null;
      if (code && rooms[code]) return json({ error: 'room_code_taken' }, 409, '');
      if (!code) {
        for (var attempt = 0; attempt < 12; attempt += 1) {
          var candidate = String(Math.floor(1000 + Math.random() * 9000));
          if (!rooms[candidate]) { code = candidate; break; }
        }
      }
      if (!code) return json({ error: 'no_room_code' }, 503, '');
      rooms[code] = { code: code, roomId: body.roomId, subject: body.subject, chapter: body.chapter, lesson: body.lesson, lessonTitle: body.lessonTitle, gameType: body.gameType, gameTitle: body.gameTitle, capacity: body.gameType === 'live_classroom' ? classroomCapacity(body.capacity) : undefined, contentMode: body.gameType === 'live_classroom' ? (body.contentMode === 'booklet' ? 'booklet' : 'board') : undefined, players: 1, status: body.gameType === 'live_classroom' ? 'playing' : 'waiting', createdAt: Date.now() };
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
    if (url.pathname === '/internal/update' && request.method === 'POST') {
      var updateBody = await request.json().catch(function () { return null; });
      var roomKey = updateBody && (updateBody.roomCode || Object.keys(rooms).find(function (key) { return rooms[key].roomId === updateBody.roomId; }));
      if (!roomKey || !rooms[roomKey] || !['waiting', 'playing', 'reconnecting', 'ended'].includes(updateBody.status)) return json({ error: 'room_not_found' }, 404, '');
      rooms[roomKey].status = updateBody.status;
      rooms[roomKey].players = Number.isInteger(updateBody.players) ? updateBody.players : rooms[roomKey].players;
      if (updateBody.status === 'ended') rooms[roomKey].endedAt = Date.now();
      await this.ctx.storage.put('rooms', rooms);
      return json({ ok: true }, 200, '');
    }
    if (url.pathname === '/internal/list' && request.method === 'GET') {
      var now = Date.now();
      Object.keys(rooms).forEach(function (key) {
        var room = rooms[key];
        if (now - room.createdAt >= 2 * 60 * 60 * 1000 || (room.status === 'ended' && now - (room.endedAt || now) >= 15000)) delete rooms[key];
      });
      await this.ctx.storage.put('rooms', rooms);
      var list = Object.values(rooms);
      return json({ rooms: list }, 200, '');
    }
    return json({ error: 'not_found' }, 404, '');
  }
}

// A fresh registry generation avoids carrying forward an oversized or corrupted
// single-value room index. Rooms are ephemeral, so rotating the registry is safe.
export class ChallengeRegistryV2 extends ChallengeRegistry {}
