import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RaceTrack } from '../components/RaceTrack';
import { SkyBackdrop } from '../components/SkyBackdrop';
import { useRaceSocket } from '../hooks/useRaceSocket';
import type { Phase, ServerMessage, TeacherBoardState } from '../shared/types';
import { soundEngine } from '../utils/audio';

interface TeacherViewProps {
  onNavigate: (route: 'home' | 'guru' | 'siswa') => void;
}

interface CheerState {
  winnerName: string;
  phase: Phase;
}

interface ScoreboardRow {
  id: string;
  name: string;
  phase: Phase;
  correctCount: number;
  targetSteps: number;
  score: number;
  isWinner: boolean;
  matchStatus: 'active' | 'finished';
}

const EMPTY_BOARD: TeacherBoardState = {
  waiting: [],
  matches: [],
  stats: {
    waitingCount: 0,
    activeCount: 0,
    finishedCount: 0,
  },
};

export const TeacherView: React.FC<TeacherViewProps> = ({ onNavigate }) => {
  const [board, setBoard] = useState<TeacherBoardState>(EMPTY_BOARD);
  const [activePhase, setActivePhase] = useState<Phase>('B');
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [showScoreboard, setShowScoreboard] = useState<boolean>(false);
  const [clock, setClock] = useState<string>('--:--');
  const [musicOn, setMusicOn] = useState<boolean>(false);
  const [copiedUrl, setCopiedUrl] = useState<boolean>(false);
  const [cheer, setCheer] = useState<CheerState | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const seenMatchIdsRef = useRef<Set<string>>(new Set());
  const prevTrackStateRef = useRef<{
    matchId: string;
    status: string;
    countdownSec: number;
    timeLeftSec: number;
  } | null>(null);

  const studentUrl =
    typeof window !== 'undefined' ? `${window.location.origin}/siswa` : '';

  const handleMessage = useCallback((msg: ServerMessage) => {
    if (msg.type === 'teacher:state') {
      setBoard(msg.board);

      // Focus automatically on newly started active/countdown race
      const newestActive = msg.board.matches.find(
        (m) => m.status !== 'finished' && !seenMatchIdsRef.current.has(m.id)
      );
      for (const m of msg.board.matches) {
        seenMatchIdsRef.current.add(m.id);
      }
      if (newestActive) {
        setActivePhase(newestActive.phase);
        setSelectedMatchId(newestActive.id);
      }
    } else if (msg.type === 'teacher:cheer') {
      setCheer({ winnerName: msg.winnerName, phase: msg.phase });
      soundEngine.playFinishCheer();
    }
  }, []);

  const { status, send } = useRaceSocket(handleMessage);

  useEffect(() => {
    if (status === 'open') {
      send({ type: 'teacher:subscribe' });
    }
  }, [status, send]);

  // Unlock Web Audio on first click anywhere
  useEffect(() => {
    const unlockOnGesture = () => {
      soundEngine.unlock();
    };
    window.addEventListener('pointerdown', unlockOnGesture, { once: true });
    return () => window.removeEventListener('pointerdown', unlockOnGesture);
  }, []);

  // Live clock
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      setClock(`${hh}:${mm}`);
    };
    updateClock();
    const id = setInterval(updateClock, 10000);
    return () => clearInterval(id);
  }, []);

  // Auto-dismiss cheer banner
  useEffect(() => {
    if (!cheer) return;
    const timer = setTimeout(() => setCheer(null), 5500);
    return () => clearTimeout(timer);
  }, [cheer]);

  // Cleanup music on unmount
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      soundEngine.stopMusic();
    };
  }, []);

  const toggleMusic = () => {
    soundEngine.unlock();
    if (musicOn) {
      soundEngine.stopMusic();
      setMusicOn(false);
    } else {
      soundEngine.setEnabled(true);
      soundEngine.startMusic();
      setMusicOn(true);
    }
  };

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      // Ignore fullscreen restriction inside iframe
    }
  };

  const copyStudentUrl = async () => {
    try {
      await navigator.clipboard.writeText(studentUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch {
      // Ignore clipboard failure
    }
  };

  const phaseMatches = useMemo(
    () => board.matches.filter((m) => m.phase === activePhase),
    [board.matches, activePhase]
  );

  // Pick ONLY the single focused match currently racing (or most recent in this phase)
  const focusedMatch = useMemo(() => {
    if (phaseMatches.length === 0) return null;
    if (selectedMatchId) {
      const explicit = phaseMatches.find((m) => m.id === selectedMatchId);
      if (explicit) return explicit;
    }
    return phaseMatches.find((m) => m.status !== 'finished') ?? phaseMatches[0];
  }, [phaseMatches, selectedMatchId]);

  const activeMatchesInPhase = useMemo(
    () => phaseMatches.filter((m) => m.status !== 'finished'),
    [phaseMatches]
  );

  // Trigger countdown & final-5-second sound effects for the focused match
  useEffect(() => {
    if (!focusedMatch) {
      prevTrackStateRef.current = null;
      return;
    }
    const prev = prevTrackStateRef.current;
    if (!prev || prev.matchId !== focusedMatch.id) {
      if (focusedMatch.status === 'countdown') {
        soundEngine.playCountdownBeep(false);
      }
    } else {
      if (
        focusedMatch.status === 'countdown' &&
        focusedMatch.countdownSec !== prev.countdownSec &&
        focusedMatch.countdownSec > 0
      ) {
        soundEngine.playCountdownBeep(false);
      } else if (prev.status === 'countdown' && focusedMatch.status === 'active') {
        soundEngine.playCountdownBeep(true);
      } else if (
        focusedMatch.status === 'active' &&
        focusedMatch.timeLeftSec !== prev.timeLeftSec &&
        focusedMatch.timeLeftSec <= 5 &&
        focusedMatch.timeLeftSec > 0
      ) {
        soundEngine.playUrgentTick();
      }
    }

    prevTrackStateRef.current = {
      matchId: focusedMatch.id,
      status: focusedMatch.status,
      countdownSec: focusedMatch.countdownSec,
      timeLeftSec: focusedMatch.timeLeftSec,
    };
  }, [focusedMatch]);

  const visibleWaiting = useMemo(
    () => board.waiting.filter((w) => w.phase === activePhase),
    [board.waiting, activePhase]
  );

  const scoreboardRows = useMemo<ScoreboardRow[]>(() => {
    const rows: ScoreboardRow[] = [];
    for (const m of phaseMatches) {
      for (const p of m.players) {
        rows.push({
          id: p.id,
          name: p.name,
          phase: m.phase,
          correctCount: p.correctCount,
          targetSteps: m.targetSteps,
          score: p.score,
          isWinner: m.winnerId === p.id,
          matchStatus: m.status === 'finished' ? 'finished' : 'active',
        });
      }
    }
    return rows.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.correctCount !== a.correctCount) return b.correctCount - a.correctCount;
      if (a.isWinner !== b.isWinner) return a.isWinner ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  }, [phaseMatches]);

  const activeCountB = board.matches.filter((m) => m.phase === 'B' && m.status !== 'finished').length;
  const activeCountC = board.matches.filter((m) => m.phase === 'C' && m.status !== 'finished').length;

  const handleStartRace = () => {
    soundEngine.unlock();
    soundEngine.playTap();
    send({ type: 'teacher:start_demo', phase: activePhase });
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="relative min-h-screen text-slate-900 flex flex-col">
      <SkyBackdrop />

      {/* Compact Top Bar */}
      <header className="relative z-10 bg-blue-900/95 text-white px-4 sm:px-6 py-3 border-b border-blue-950">
        <div className="mx-auto max-w-6xl flex flex-wrap items-center justify-between gap-3">
          {/* Zone 1: Brand & Phase Switcher */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => onNavigate('home')}
              className="text-sm font-medium text-blue-200 hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              ← Beranda
            </button>
            <span className="text-blue-400" aria-hidden="true">
              |
            </span>
            <h1 className="font-display font-bold text-base sm:text-lg whitespace-nowrap shrink-0">
              🏁 Papan Lomba
            </h1>
            <span className="hidden md:inline text-xs text-blue-200 font-mono-num whitespace-nowrap">
              · {clock}
            </span>
          </div>

          {/* Zone 2: Separated Phase Arena Tabs */}
          <div className="flex items-center gap-1 p-1 bg-blue-950/70 rounded-lg border border-blue-800">
            <button
              type="button"
              onClick={() => {
                setActivePhase('B');
                setSelectedMatchId(null);
              }}
              className={`px-3 py-1 rounded-md text-xs sm:text-sm font-display font-bold transition-colors cursor-pointer whitespace-nowrap ${
                activePhase === 'B'
                  ? 'bg-orange-500 text-white'
                  : 'text-blue-200 hover:text-white'
              }`}
            >
              Fase B{activeCountB > 0 ? ` (${activeCountB})` : ''}
            </button>
            <button
              type="button"
              onClick={() => {
                setActivePhase('C');
                setSelectedMatchId(null);
              }}
              className={`px-3 py-1 rounded-md text-xs sm:text-sm font-display font-bold transition-colors cursor-pointer whitespace-nowrap ${
                activePhase === 'C'
                  ? 'bg-blue-500 text-white'
                  : 'text-blue-200 hover:text-white'
              }`}
            >
              Fase C{activeCountC > 0 ? ` (${activeCountC})` : ''}
            </button>
          </div>

          {/* Zone 3: Quick Actions + Primary Mulai Lomba */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleStartRace}
              className="px-3.5 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs sm:text-sm font-display font-extrabold shadow-sm whitespace-nowrap cursor-pointer transition-colors"
            >
              ▶ Mulai Lomba
            </button>

            <button
              type="button"
              onClick={copyStudentUrl}
              title="Salin tautan siswa"
              className="hidden lg:inline-flex items-center px-2.5 py-1.5 rounded-lg bg-blue-950/70 border border-blue-700 text-xs font-medium text-blue-100 hover:bg-blue-950 cursor-pointer whitespace-nowrap"
            >
              {copiedUrl ? 'Tautan Disalin!' : 'Salin Link Siswa'}
            </button>

            <button
              type="button"
              onClick={() => setShowScoreboard((v) => !v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                showScoreboard
                  ? 'bg-white text-slate-950'
                  : 'bg-blue-800 text-white hover:bg-blue-700 border border-blue-700'
              }`}
            >
              📊 Papan Skor
            </button>

            <button
              type="button"
              onClick={() => {
                soundEngine.unlock();
                soundEngine.playFinishCheer();
              }}
              className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold whitespace-nowrap cursor-pointer"
            >
              👏 Sorak
            </button>

            <button
              type="button"
              onClick={toggleMusic}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer ${
                musicOn
                  ? 'bg-emerald-400 text-slate-950'
                  : 'bg-blue-800 text-white hover:bg-blue-700 border border-blue-700'
              }`}
            >
              {musicOn ? '🔊 Musik' : '🔈 Musik'}
            </button>

            <button
              type="button"
              onClick={toggleFullscreen}
              className="px-2.5 py-1.5 rounded-lg bg-white text-slate-900 hover:bg-slate-100 text-xs font-semibold whitespace-nowrap cursor-pointer"
            >
              {isFullscreen ? '⛶ Keluar' : '⛶ Penuh'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Focused Race Stage (Matches Attached Screenshot Composition) */}
      <main className="relative z-10 flex-1 mx-auto w-full max-w-5xl px-4 sm:px-6 py-6 flex flex-col justify-center gap-4">
        {/* Waiting queue bar only if someone is waiting in this phase */}
        {visibleWaiting.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white/95 border border-amber-300 px-4 py-2.5 shadow-sm">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-bold text-amber-900">
                Menunggu lawan Fase {activePhase}:
              </span>
              {visibleWaiting.map((student) => (
                <div key={student.id} className="flex items-center gap-2">
                  <span className="font-display font-bold text-sm text-slate-900">
                    {student.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playTap();
                      send({ type: 'teacher:pair_with_bot', studentId: student.id });
                    }}
                    className="px-2.5 py-1 rounded-md bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold cursor-pointer"
                  >
                    + Lawan Bot
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Multiple active match switcher if more than 1 match is running in this phase */}
        {activeMatchesInPhase.length > 1 && (
          <div className="flex items-center gap-2">
            {activeMatchesInPhase.map((m, i) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setSelectedMatchId(m.id)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                  focusedMatch?.id === m.id
                    ? 'bg-slate-900 text-white'
                    : 'bg-white/90 text-slate-700 border border-slate-200'
                }`}
              >
                Lomba {i + 1}: {m.players[0].name} vs {m.players[1].name}
              </button>
            ))}
          </div>
        )}

        {focusedMatch ? (
          <section className="flex flex-col gap-2.5">
            {/* Clean 1-line race header directly above the green track */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-sm sm:text-base font-semibold text-slate-900">
              <span>
                Fase {focusedMatch.phase} ·{' '}
                <span className="font-bold">
                  {focusedMatch.players[0].name} vs {focusedMatch.players[1].name}
                </span>
              </span>
              <div className="flex items-center gap-3">
                {focusedMatch.status !== 'finished' && (
                  <span
                    className={`font-mono-num text-sm sm:text-base font-extrabold ${
                      focusedMatch.timeLeftSec <= 10 ? 'text-rose-600' : 'text-slate-900'
                    }`}
                  >
                    ⏱️ {formatTimer(focusedMatch.timeLeftSec)}
                  </span>
                )}
                <span className="font-mono-num text-sm text-slate-800">
                  {focusedMatch.status === 'countdown'
                    ? `Bersiap... ${focusedMatch.countdownSec}`
                    : focusedMatch.status === 'active'
                      ? '🏃 Sedang Berlomba'
                      : focusedMatch.winnerId
                        ? `🏆 Juara: ${
                            focusedMatch.players.find((p) => p.id === focusedMatch.winnerId)
                              ?.name ?? ''
                          }`
                        : '🤝 Seri'}
                </span>
                <button
                  type="button"
                  onClick={handleStartRace}
                  className="px-3.5 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 border border-slate-900 text-slate-950 text-xs font-display font-bold cursor-pointer"
                >
                  ▶ Mulai Lomba Baru
                </button>
              </div>
            </div>

            {/* Pure Focused Stadium Track + 3-2-1 Start Countdown Overlay */}
            <div className="relative">
              <RaceTrack
                players={focusedMatch.players}
                targetSteps={focusedMatch.targetSteps}
                isActive={focusedMatch.status === 'active'}
              />

              {focusedMatch.status === 'countdown' && (
                <div
                  className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-2xl bg-slate-950/35"
                  aria-live="assertive"
                >
                  <div
                    key={focusedMatch.countdownSec}
                    className="animate-pop-in rounded-2xl bg-amber-400 border-4 border-slate-950 px-9 py-4 shadow-2xl text-center"
                  >
                    <div className="text-xs font-bold uppercase tracking-widest text-slate-900">
                      Siap di Garis Start
                    </div>
                    <div className="font-display text-6xl font-extrabold text-slate-950 leading-none mt-1 font-mono-num">
                      {focusedMatch.countdownSec}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        ) : (
          <section className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-sm sm:text-base font-semibold text-slate-900">
              <span>
                Fase {activePhase} ·{' '}
                <span className="font-bold">
                  {visibleWaiting.length >= 2
                    ? `${visibleWaiting[0].name} vs ${visibleWaiting[1].name}`
                    : visibleWaiting.length === 1
                      ? `${visibleWaiting[0].name} vs Robo Kura 🤖`
                      : `Pelari ${activePhase}1 vs Pelari ${activePhase}2`}
                </span>
              </span>
              <span className="font-mono-num text-sm text-slate-700">Siap di Garis Start</span>
            </div>

            {/* Ready 2-lane Track Preview */}
            <RaceTrack
              players={[
                {
                  id: 'preview-1',
                  name:
                    visibleWaiting[0]?.name ?? `Pelari ${activePhase}1`,
                  mascot: 'a',
                  score: 0,
                  correctCount: 0,
                  questionIndex: 0,
                },
                {
                  id: 'preview-2',
                  name:
                    visibleWaiting[1]?.name ??
                    (visibleWaiting.length === 1
                      ? 'Robo Kura 🤖'
                      : `Pelari ${activePhase}2`),
                  mascot: 'b',
                  score: 0,
                  correctCount: 0,
                  questionIndex: 0,
                  isBot: visibleWaiting.length < 2,
                },
              ]}
              targetSteps={10}
              isActive={false}
            />

            <div className="flex justify-center pt-1">
              <button
                type="button"
                onClick={handleStartRace}
                className="px-7 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 border-2 border-slate-900 font-display text-base sm:text-lg font-extrabold text-slate-950 shadow-md cursor-pointer transition-transform active:scale-[0.98]"
              >
                ▶ Mulai Lomba Fase {activePhase}
              </button>
            </div>
          </section>
        )}
      </main>

      {/* Papan Skor Drawer / Modal when toggled */}
      {showScoreboard && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`Papan Skor Fase ${activePhase}`}
        >
          <div className="animate-pop-in w-full max-w-2xl rounded-2xl bg-white border border-slate-200 p-5 sm:p-6 shadow-xl">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="font-display text-xl font-extrabold text-slate-900">
                  Papan Skor Fase {activePhase}
                </h2>
                <p className="text-xs text-slate-500">
                  10 poin per jawaban benar · 10 langkah menuju garis finis
                </p>
              </div>
              <div className="flex items-center gap-2">
                {board.stats.finishedCount > 0 && (
                  <button
                    type="button"
                    onClick={() => send({ type: 'teacher:clear_finished' })}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 cursor-pointer"
                  >
                    Bersihkan Selesai
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowScoreboard(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>

            {scoreboardRows.length === 0 ? (
              <p className="text-sm text-slate-500 py-6 text-center">
                Belum ada data skor untuk Fase {activePhase}.
              </p>
            ) : (
              <div className="overflow-x-auto max-h-[60vh]">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      <th className="py-2 px-3">Peringkat</th>
                      <th className="py-2 px-3">Nama Peserta</th>
                      <th className="py-2 px-3">Langkah</th>
                      <th className="py-2 px-3 text-right">Skor</th>
                      <th className="py-2 px-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {scoreboardRows.map((row, idx) => (
                      <tr
                        key={row.id}
                        className={row.isWinner ? 'bg-amber-50/80' : 'hover:bg-slate-50'}
                      >
                        <td className="py-2.5 px-3 font-mono-num font-bold text-slate-700">
                          #{idx + 1}
                        </td>
                        <td className="py-2.5 px-3 font-display font-bold text-slate-900">
                          {row.name}
                        </td>
                        <td className="py-2.5 px-3 font-mono-num text-slate-700">
                          {row.correctCount} / {row.targetSteps}
                        </td>
                        <td className="py-2.5 px-3 font-mono-num font-extrabold text-blue-700 text-right">
                          {row.score} poin
                        </td>
                        <td className="py-2.5 px-3 text-right font-semibold text-xs">
                          {row.isWinner ? (
                            <span className="text-amber-700">🏆 Juara</span>
                          ) : row.matchStatus === 'active' ? (
                            <span className="text-emerald-700">🏃 Berlomba</span>
                          ) : (
                            <span className="text-slate-500">Finis</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cheer & Applause Banner Overlay */}
      {cheer && (
        <div
          className="fixed inset-x-0 bottom-8 z-50 flex justify-center px-4 pointer-events-none"
          role="status"
          aria-live="polite"
        >
          <div className="animate-pop-in rounded-2xl bg-amber-400 border-2 border-slate-900 px-7 py-4 shadow-xl text-center">
            <div className="font-display text-xl sm:text-2xl font-extrabold text-slate-950">
              📣 🏆 {cheer.winnerName} Mencapai Garis Finis (Fase {cheer.phase})!
            </div>
            <div className="text-sm font-bold text-slate-900 mt-1">
              Horeee! Tepuk tangan meriah untuk semua peserta! 👏🎉👏
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
