import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import { generateQuestion, generateQuestionSet, toClientQuestion } from './src/shared/questions.ts';
import type {
  ClientMessage,
  MatchPublicState,
  NumeracyQuestion,
  Phase,
  PlayerState,
  ServerMessage,
  TeacherBoardState,
  WaitingStudentPublic,
} from './src/shared/types.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TARGET_STEPS = 10;
const COUNTDOWN_SECONDS = 3;
const RACE_DURATION_SECONDS = 90;

interface ConnectedClient {
  id: string;
  ws: WebSocket;
  role: 'unknown' | 'teacher' | 'student';
  activeMatchId: string | null;
}

interface WaitingEntry {
  id: string;
  clientId: string;
  name: string;
  phase: Phase;
  mascot: 'a' | 'b';
  joinedAt: number;
}

interface InternalMatch {
  id: string;
  phase: Phase;
  targetSteps: number;
  status: 'countdown' | 'active' | 'finished';
  countdownSec: number;
  timeLeftSec: number;
  isBotMatch: boolean;
  players: [PlayerState, PlayerState];
  clientMap: Record<string, string>; // playerId -> clientId
  questions: NumeracyQuestion[];
  winnerId: string | null;
  createdAt: number;
  finishedAt: number | null;
  botTimers: ReturnType<typeof setTimeout>[];
  raceInterval: ReturnType<typeof setInterval> | null;
}

function makeId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function sendJson(ws: WebSocket, payload: ServerMessage): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(payload));
  }
}

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: '/ws' });

  const clients = new Map<string, ConnectedClient>();
  const waitingQueue: WaitingEntry[] = [];
  const matches = new Map<string, InternalMatch>();

  function toPublicMatch(m: InternalMatch): MatchPublicState {
    return {
      id: m.id,
      phase: m.phase,
      targetSteps: m.targetSteps,
      status: m.status,
      countdownSec: m.countdownSec,
      timeLeftSec: m.timeLeftSec,
      isBotMatch: m.isBotMatch,
      players: [{ ...m.players[0] }, { ...m.players[1] }],
      winnerId: m.winnerId,
      createdAt: m.createdAt,
      finishedAt: m.finishedAt,
    };
  }

  function buildTeacherBoard(): TeacherBoardState {
    const waiting: WaitingStudentPublic[] = waitingQueue.map((w) => ({
      id: w.id,
      name: w.name,
      phase: w.phase,
      mascot: w.mascot,
      joinedAt: w.joinedAt,
    }));

    const allMatches = Array.from(matches.values())
      .sort((a, b) => {
        const aRunning = a.status !== 'finished';
        const bRunning = b.status !== 'finished';
        if (aRunning !== bRunning) return aRunning ? -1 : 1;
        return b.createdAt - a.createdAt;
      })
      .map(toPublicMatch);

    const activeCount = allMatches.filter((m) => m.status !== 'finished').length;
    const finishedCount = allMatches.filter((m) => m.status === 'finished').length;

    return {
      waiting,
      matches: allMatches,
      stats: {
        waitingCount: waiting.length,
        activeCount,
        finishedCount,
      },
    };
  }

  function broadcastTeachers(extra?: ServerMessage) {
    const stateMsg: ServerMessage = {
      type: 'teacher:state',
      board: buildTeacherBoard(),
    };
    for (const client of clients.values()) {
      if (client.role === 'teacher') {
        sendJson(client.ws, stateMsg);
        if (extra) {
          sendJson(client.ws, extra);
        }
      }
    }
  }

  function broadcastMatchUpdate(match: InternalMatch) {
    const pub = toPublicMatch(match);
    for (const player of match.players) {
      if (player.isBot) continue;
      const clientId = match.clientMap[player.id];
      const client = clientId ? clients.get(clientId) : undefined;
      if (client) {
        sendJson(client.ws, { type: 'match:update', match: pub });
      }
    }
    broadcastTeachers();
  }

  function clearMatchTimers(match: InternalMatch) {
    for (const t of match.botTimers) {
      clearTimeout(t);
    }
    match.botTimers = [];
    if (match.raceInterval) {
      clearInterval(match.raceInterval);
      match.raceInterval = null;
    }
  }

  function finishMatch(
    match: InternalMatch,
    winnerId: string | null,
    reason: 'goal' | 'time_up' | 'opponent_left'
  ) {
    if (match.status === 'finished') return;
    match.status = 'finished';
    match.winnerId = winnerId;
    match.finishedAt = Date.now();
    clearMatchTimers(match);

    const pub = toPublicMatch(match);
    const winner = winnerId ? match.players.find((p) => p.id === winnerId) : null;

    for (const player of match.players) {
      if (player.isBot) continue;
      const clientId = match.clientMap[player.id];
      const client = clientId ? clients.get(clientId) : undefined;
      if (client) {
        sendJson(client.ws, {
          type: 'match:finished',
          match: pub,
          reason,
        });
      }
    }

    broadcastTeachers(
      winner
        ? {
            type: 'teacher:cheer',
            winnerName: winner.name,
            phase: match.phase,
            matchId: match.id,
          }
        : undefined
    );
  }

  function scheduleSingleBotTurn(match: InternalMatch, botId: string) {
    if (match.status !== 'active') return;
    const delayMs = match.phase === 'B' ? 2800 + Math.random() * 2000 : 3400 + Math.random() * 2400;

    const timer = setTimeout(() => {
      if (match.status !== 'active') return;
      const bot = match.players.find((p) => p.id === botId && p.isBot);
      if (!bot) return;

      const isCorrect = Math.random() < 0.82;
      if (isCorrect) {
        bot.correctCount = Math.min(match.targetSteps, bot.correctCount + 1);
        bot.score += 10;
      }
      bot.questionIndex += 1;

      if (bot.correctCount >= match.targetSteps) {
        finishMatch(match, bot.id, 'goal');
      } else {
        broadcastMatchUpdate(match);
        scheduleSingleBotTurn(match, botId);
      }
    }, delayMs);

    match.botTimers.push(timer);
  }

  function createMatch(
    p1: { clientId: string | null; name: string; isBot?: boolean },
    p2: { clientId: string | null; name: string; isBot?: boolean },
    phase: Phase
  ) {
    const matchId = makeId('match');
    const questions = generateQuestionSet(phase, 30);

    const player1Id = makeId('p1');
    const player2Id = makeId('p2');

    const player1: PlayerState = {
      id: player1Id,
      name: p1.name,
      mascot: 'a',
      score: 0,
      correctCount: 0,
      questionIndex: 0,
      isBot: Boolean(p1.isBot),
    };

    const player2: PlayerState = {
      id: player2Id,
      name: p2.name,
      mascot: 'b',
      score: 0,
      correctCount: 0,
      questionIndex: 0,
      isBot: Boolean(p2.isBot),
    };

    const clientMap: Record<string, string> = {};
    if (p1.clientId) {
      clientMap[player1Id] = p1.clientId;
    }
    if (p2.clientId) {
      clientMap[player2Id] = p2.clientId;
    }

    const match: InternalMatch = {
      id: matchId,
      phase,
      targetSteps: TARGET_STEPS,
      status: 'countdown',
      countdownSec: COUNTDOWN_SECONDS,
      timeLeftSec: RACE_DURATION_SECONDS,
      isBotMatch: Boolean(p1.isBot || p2.isBot),
      players: [player1, player2],
      clientMap,
      questions,
      winnerId: null,
      createdAt: Date.now(),
      finishedAt: null,
      botTimers: [],
      raceInterval: null,
    };

    matches.set(matchId, match);

    if (p1.clientId) {
      const c1 = clients.get(p1.clientId);
      if (c1) {
        c1.activeMatchId = matchId;
        sendJson(c1.ws, {
          type: 'match:started',
          match: toPublicMatch(match),
          playerId: player1Id,
          question: toClientQuestion(questions[0]),
        });
      }
    }

    if (p2.clientId) {
      const c2 = clients.get(p2.clientId);
      if (c2) {
        c2.activeMatchId = matchId;
        sendJson(c2.ws, {
          type: 'match:started',
          match: toPublicMatch(match),
          playerId: player2Id,
          question: toClientQuestion(questions[0]),
        });
      }
    }

    // 1-second authoritative race clock (handles 3-2-1 start countdown + 90s race timer)
    match.raceInterval = setInterval(() => {
      if (match.status === 'finished') {
        clearMatchTimers(match);
        return;
      }

      if (match.status === 'countdown') {
        match.countdownSec -= 1;
        if (match.countdownSec <= 0) {
          match.countdownSec = 0;
          match.status = 'active';
          if (player1.isBot) {
            scheduleSingleBotTurn(match, player1.id);
          }
          if (player2.isBot) {
            scheduleSingleBotTurn(match, player2.id);
          }
        }
        broadcastMatchUpdate(match);
        return;
      }

      if (match.status === 'active') {
        match.timeLeftSec = Math.max(0, match.timeLeftSec - 1);
        if (match.timeLeftSec <= 0) {
          const [a, b] = match.players;
          let winnerId: string | null = null;
          if (a.score > b.score) winnerId = a.id;
          else if (b.score > a.score) winnerId = b.id;
          else if (a.correctCount > b.correctCount) winnerId = a.id;
          else if (b.correctCount > a.correctCount) winnerId = b.id;
          finishMatch(match, winnerId, 'time_up');
        } else {
          broadcastMatchUpdate(match);
        }
      }
    }, 1000);

    broadcastTeachers();
  }

  function createDemoMatch(phase: Phase) {
    const names: Record<Phase, [string, string]> = {
      B: ['Pelari B1 (Bot)', 'Pelari B2 (Bot)'],
      C: ['Pelari C1 (Bot)', 'Pelari C2 (Bot)'],
    };
    const [n1, n2] = names[phase];
    createMatch(
      { clientId: null, name: n1, isBot: true },
      { clientId: null, name: n2, isBot: true },
      phase
    );
  }

  function removeWaitingByClientId(clientId: string): WaitingEntry | null {
    const idx = waitingQueue.findIndex((w) => w.clientId === clientId);
    if (idx === -1) return null;
    const [removed] = waitingQueue.splice(idx, 1);
    return removed;
  }

  function handlePlayerExitMatch(client: ConnectedClient) {
    if (!client.activeMatchId) return;
    const match = matches.get(client.activeMatchId);
    client.activeMatchId = null;
    if (!match || match.status === 'finished') return;

    const leavingPlayerId = Object.keys(match.clientMap).find(
      (pid) => match.clientMap[pid] === client.id
    );
    const otherPlayer = match.players.find((p) => p.id !== leavingPlayerId);

    if (match.isBotMatch) {
      clearMatchTimers(match);
      matches.delete(match.id);
      broadcastTeachers();
      return;
    }

    if (otherPlayer) {
      finishMatch(match, otherPlayer.id, 'opponent_left');
    }
  }

  wss.on('connection', (ws) => {
    const clientId = makeId('cli');
    const client: ConnectedClient = {
      id: clientId,
      ws,
      role: 'unknown',
      activeMatchId: null,
    };
    clients.set(clientId, client);
    sendJson(ws, { type: 'connected', clientId });

    ws.on('message', (raw) => {
      let msg: ClientMessage;
      try {
        msg = JSON.parse(raw.toString()) as ClientMessage;
      } catch {
        return;
      }

      if (msg.type === 'teacher:subscribe') {
        client.role = 'teacher';
        sendJson(ws, { type: 'teacher:state', board: buildTeacherBoard() });
        return;
      }

      if (msg.type === 'teacher:clear_finished') {
        for (const [id, m] of matches.entries()) {
          if (m.status === 'finished') {
            clearMatchTimers(m);
            matches.delete(id);
          }
        }
        broadcastTeachers();
        return;
      }

      if (msg.type === 'teacher:start_demo') {
        const targetPhase: Phase = msg.phase === 'C' ? 'C' : 'B';

        // Clear finished bot-only matches in this phase to keep arena clean
        for (const [id, m] of matches.entries()) {
          if (
            m.phase === targetPhase &&
            m.status === 'finished' &&
            m.players.every((p) => p.isBot)
          ) {
            clearMatchTimers(m);
            matches.delete(id);
          }
        }

        // Check if real students are waiting in this phase first
        const phaseWaitingIndices: number[] = [];
        waitingQueue.forEach((w, i) => {
          if (w.phase === targetPhase) phaseWaitingIndices.push(i);
        });

        if (phaseWaitingIndices.length >= 2) {
          const i1 = phaseWaitingIndices[0];
          const i2 = phaseWaitingIndices[1];
          const p1 = waitingQueue[i1];
          const p2 = waitingQueue[i2];
          waitingQueue.splice(i2, 1);
          waitingQueue.splice(i1, 1);
          createMatch(
            { clientId: p1.clientId, name: p1.name },
            { clientId: p2.clientId, name: p2.name },
            targetPhase
          );
        } else if (phaseWaitingIndices.length === 1) {
          const [entry] = waitingQueue.splice(phaseWaitingIndices[0], 1);
          createMatch(
            { clientId: entry.clientId, name: entry.name },
            { clientId: null, name: 'Robo Kura 🤖', isBot: true },
            targetPhase
          );
        } else {
          createDemoMatch(targetPhase);
        }
        return;
      }

      if (msg.type === 'teacher:pair_with_bot') {
        const idx = waitingQueue.findIndex((w) => w.id === msg.studentId);
        if (idx === -1) return;
        const [entry] = waitingQueue.splice(idx, 1);
        createMatch(
          { clientId: entry.clientId, name: entry.name },
          { clientId: null, name: 'Robo Kura 🤖', isBot: true },
          entry.phase
        );
        return;
      }

      if (msg.type === 'student:join') {
        client.role = 'student';
        const cleanName = msg.name.trim().slice(0, 18);
        if (!cleanName) {
          sendJson(ws, { type: 'error', message: 'Tulis namamu terlebih dahulu.' });
          return;
        }
        const phase: Phase = msg.phase === 'C' ? 'C' : 'B';

        // Remove any previous waiting entry for this socket
        removeWaitingByClientId(clientId);
        handlePlayerExitMatch(client);

        // Find another waiting student in the same phase
        const opponentIdx = waitingQueue.findIndex(
          (w) => w.phase === phase && w.clientId !== clientId
        );

        if (opponentIdx !== -1) {
          const [opponent] = waitingQueue.splice(opponentIdx, 1);
          createMatch(
            { clientId: opponent.clientId, name: opponent.name },
            { clientId, name: cleanName },
            phase
          );
        } else {
          const entry: WaitingEntry = {
            id: makeId('wait'),
            clientId,
            name: cleanName,
            phase,
            mascot: 'a',
            joinedAt: Date.now(),
          };
          waitingQueue.push(entry);
          sendJson(ws, {
            type: 'student:waiting',
            student: {
              id: entry.id,
              name: entry.name,
              phase: entry.phase,
              mascot: entry.mascot,
              joinedAt: entry.joinedAt,
            },
          });
          broadcastTeachers();
        }
        return;
      }

      if (msg.type === 'student:cancel') {
        const removed = removeWaitingByClientId(clientId);
        if (removed) {
          broadcastTeachers();
        }
        sendJson(ws, { type: 'student:cancelled' });
        return;
      }

      if (msg.type === 'student:play_bot') {
        const entry = removeWaitingByClientId(clientId);
        if (!entry) return;
        createMatch(
          { clientId: entry.clientId, name: entry.name },
          { clientId: null, name: 'Robo Kura 🤖', isBot: true },
          entry.phase
        );
        return;
      }

      if (msg.type === 'match:answer') {
        const match = matches.get(msg.matchId);
        if (!match || match.status !== 'active') return;

        const playerId = Object.keys(match.clientMap).find(
          (pid) => match.clientMap[pid] === clientId
        );
        if (!playerId) return;

        const player = match.players.find((p) => p.id === playerId);
        if (!player) return;

        if (msg.questionIndex !== player.questionIndex) {
          return;
        }

        const q = match.questions[player.questionIndex];
        if (!q) return;

        const isCorrect = msg.selectedOption === q.answer;
        if (isCorrect) {
          player.correctCount = Math.min(match.targetSteps, player.correctCount + 1);
          player.score += 10;
        }
        player.questionIndex += 1;

        while (player.questionIndex >= match.questions.length) {
          match.questions.push(generateQuestion(match.phase, match.questions.length));
        }

        const reachedGoal = player.correctCount >= match.targetSteps;
        const nextQuestion = reachedGoal
          ? null
          : toClientQuestion(match.questions[player.questionIndex]);

        sendJson(ws, {
          type: 'match:answer_result',
          matchId: match.id,
          correct: isCorrect,
          correctAnswer: q.answer,
          nextQuestion,
        });

        if (reachedGoal) {
          finishMatch(match, player.id, 'goal');
        } else {
          broadcastMatchUpdate(match);
        }
        return;
      }

      if (msg.type === 'match:leave') {
        handlePlayerExitMatch(client);
      }
    });

    ws.on('close', () => {
      const removed = removeWaitingByClientId(clientId);
      handlePlayerExitMatch(client);
      clients.delete(clientId);
      if (removed) {
        broadcastTeachers();
      }
    });
  });

  // Periodic cleanup of finished matches older than 20 minutes
  setInterval(() => {
    const cutoff = Date.now() - 20 * 60 * 1000;
    let changed = false;
    for (const [id, m] of matches.entries()) {
      if (m.status === 'finished' && (m.finishedAt ?? m.createdAt) < cutoff) {
        matches.delete(id);
        changed = true;
      }
    }
    if (changed) broadcastTeachers();
  }, 60_000);

  // Health route
  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  const isProd = process.env.NODE_ENV === 'production' || Boolean(process.env.K_SERVICE);
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.use((_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = Number(process.env.PORT) || 3000;
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Lomba Lari Numerasi running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
