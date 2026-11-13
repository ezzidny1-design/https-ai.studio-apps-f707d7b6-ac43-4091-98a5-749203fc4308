import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Mascot } from '../components/Mascot';
import { RaceTrack } from '../components/RaceTrack';
import { SkyBackdrop } from '../components/SkyBackdrop';
import { VerticalMathView } from '../components/VerticalMathView';
import { useRaceSocket } from '../hooks/useRaceSocket';
import type {
  ClientQuestion,
  MatchPublicState,
  Phase,
  ServerMessage,
} from '../shared/types';
import { soundEngine } from '../utils/audio';

interface StudentViewProps {
  onNavigate: (route: 'home' | 'guru' | 'siswa') => void;
}

type StudentStep = 'PHASE' | 'NAME' | 'WAITING' | 'RACING' | 'RESULT';

interface FeedbackState {
  correct: boolean;
  message: string;
  detail: string;
}

export const StudentView: React.FC<StudentViewProps> = ({ onNavigate }) => {
  const [step, setStep] = useState<StudentStep>('PHASE');
  const [phase, setPhase] = useState<Phase>('B');
  const [name, setName] = useState<string>('');
  const [nameError, setNameError] = useState<string>('');
  const [soundOn, setSoundOn] = useState<boolean>(true);
  const [showBotButton, setShowBotButton] = useState<boolean>(false);

  const [match, setMatch] = useState<MatchPublicState | null>(null);
  const [myPlayerId, setMyPlayerId] = useState<string>('');
  const [question, setQuestion] = useState<ClientQuestion | null>(null);
  const [questionNum, setQuestionNum] = useState<number>(1);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [finishReason, setFinishReason] = useState<'goal' | 'time_up' | 'opponent_left'>('goal');
  const [toast, setToast] = useState<string | null>(null);

  const lockAnswerRef = useRef<boolean>(false);
  const pendingNextQuestionRef = useRef<ClientQuestion | null>(null);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevMatchClockRef = useRef<{
    matchId: string;
    status: string;
    countdownSec: number;
    timeLeftSec: number;
  } | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  const handleMessage = useCallback(
    (msg: ServerMessage) => {
      if (msg.type === 'error') {
        setNameError(msg.message);
        showToast(msg.message);
        return;
      }

      if (msg.type === 'student:waiting') {
        setStep('WAITING');
        setShowBotButton(false);
        return;
      }

      if (msg.type === 'student:cancelled') {
        setStep('PHASE');
        return;
      }

      if (msg.type === 'match:started') {
        lockAnswerRef.current = false;
        setFeedback(null);
        setMatch(msg.match);
        setMyPlayerId(msg.playerId);
        setQuestion(msg.question);
        setQuestionNum(1);
        setStep('RACING');
        prevMatchClockRef.current = {
          matchId: msg.match.id,
          status: msg.match.status,
          countdownSec: msg.match.countdownSec,
          timeLeftSec: msg.match.timeLeftSec,
        };
        if (msg.match.status === 'countdown') {
          soundEngine.playCountdownBeep(false);
        } else {
          soundEngine.playStart();
        }
        return;
      }

      if (msg.type === 'match:update') {
        const prev = prevMatchClockRef.current;
        if (prev && prev.matchId === msg.match.id) {
          if (
            msg.match.status === 'countdown' &&
            msg.match.countdownSec !== prev.countdownSec &&
            msg.match.countdownSec > 0
          ) {
            soundEngine.playCountdownBeep(false);
          } else if (prev.status === 'countdown' && msg.match.status === 'active') {
            soundEngine.playCountdownBeep(true);
          } else if (
            msg.match.status === 'active' &&
            msg.match.timeLeftSec !== prev.timeLeftSec &&
            msg.match.timeLeftSec <= 5 &&
            msg.match.timeLeftSec > 0
          ) {
            soundEngine.playUrgentTick();
          }
        }
        prevMatchClockRef.current = {
          matchId: msg.match.id,
          status: msg.match.status,
          countdownSec: msg.match.countdownSec,
          timeLeftSec: msg.match.timeLeftSec,
        };
        setMatch(msg.match);
        return;
      }

      if (msg.type === 'match:answer_result') {
        pendingNextQuestionRef.current = msg.nextQuestion;
        if (msg.correct) {
          soundEngine.playCorrect();
          setFeedback({
            correct: true,
            message: 'Hebat!',
            detail: '+10 poin · Karaktermu maju 1 langkah!',
          });
        } else {
          soundEngine.playWrong();
          setFeedback({
            correct: false,
            message: 'Kurang tepat!',
            detail: `Jawaban benar adalah ${msg.correctAnswer}`,
          });
        }

        if (feedbackTimerRef.current) {
          clearTimeout(feedbackTimerRef.current);
        }

        feedbackTimerRef.current = setTimeout(() => {
          setFeedback(null);
          if (pendingNextQuestionRef.current) {
            setQuestion(pendingNextQuestionRef.current);
            setQuestionNum((prev) => prev + 1);
            pendingNextQuestionRef.current = null;
          }
          lockAnswerRef.current = false;
        }, 700);
        return;
      }

      if (msg.type === 'match:finished') {
        if (feedbackTimerRef.current) {
          clearTimeout(feedbackTimerRef.current);
        }
        lockAnswerRef.current = false;
        setFeedback(null);
        setMatch(msg.match);
        setFinishReason(msg.reason);
        setStep('RESULT');
        const won =
          msg.match.winnerId === myPlayerId ||
          msg.match.winnerId === msg.match.players.find((p) => p.name === name.trim())?.id;
        if (msg.reason === 'goal' || won || (msg.reason === 'time_up' && msg.match.winnerId === null)) {
          soundEngine.playFinishCheer();
        } else {
          soundEngine.playDefeat();
        }
      }
    },
    [myPlayerId, name, showToast]
  );

  const { send } = useRaceSocket(handleMessage);

  // Reveal "Main dengan Robo Kura" after 1.5s in waiting room so students can practice anytime
  useEffect(() => {
    if (step !== 'WAITING') {
      setShowBotButton(false);
      return;
    }
    const timer = setTimeout(() => setShowBotButton(true), 1200);
    return () => clearTimeout(timer);
  }, [step]);

  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current) {
        clearTimeout(feedbackTimerRef.current);
      }
    };
  }, []);

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    soundEngine.setEnabled(next);
    if (next) {
      soundEngine.unlock();
      soundEngine.playTap();
    }
  };

  const handleSelectPhase = (selected: Phase) => {
    soundEngine.unlock();
    soundEngine.playTap();
    setPhase(selected);
    setNameError('');
    setStep('NAME');
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.unlock();
    const cleaned = name.trim();
    if (!cleaned) {
      setNameError('Silakan tulis namamu terlebih dahulu.');
      return;
    }
    if (cleaned.length < 2) {
      setNameError('Nama minimal 2 huruf.');
      return;
    }
    setNameError('');
    soundEngine.playTap();
    send({ type: 'student:join', name: cleaned, phase });
  };

  const handleAnswer = useCallback(
    (optionValue: number) => {
      if (
        !match ||
        match.status !== 'active' ||
        !question ||
        lockAnswerRef.current ||
        step !== 'RACING'
      ) {
        return;
      }
      const me = match.players.find((p) => p.id === myPlayerId);
      if (!me) return;

      lockAnswerRef.current = true;
      send({
        type: 'match:answer',
        matchId: match.id,
        questionIndex: me.questionIndex,
        selectedOption: optionValue,
      });
    },
    [match, myPlayerId, question, send, step]
  );

  // Keyboard shortcuts 1-4 during active race
  useEffect(() => {
    if (step !== 'RACING' || !question) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '1' && e.key <= '4') {
        const idx = Number(e.key) - 1;
        if (question.options[idx] !== undefined) {
          handleAnswer(question.options[idx]);
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [step, question, handleAnswer]);

  const handlePlayAgain = () => {
    soundEngine.playTap();
    send({ type: 'student:join', name: name.trim(), phase });
  };

  const handleBackToMenu = () => {
    soundEngine.playTap();
    if (match && match.status !== 'finished') {
      send({ type: 'match:leave', matchId: match.id });
    }
    if (step === 'WAITING') {
      send({ type: 'student:cancel' });
    }
    onNavigate('home');
  };

  const me = match?.players.find((p) => p.id === myPlayerId);
  const opponent = match?.players.find((p) => p.id !== myPlayerId);
  const iWon = Boolean(match && match.winnerId && match.winnerId === myPlayerId);

  return (
    <div className="relative min-h-screen flex flex-col">
      <SkyBackdrop />

      {/* Top Bar */}
      <header className="relative z-10 bg-white/95 border-b border-slate-200 px-4 sm:px-6 py-3">
        <div className="mx-auto max-w-4xl flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={handleBackToMenu}
            className="flex items-center gap-2 font-display font-bold text-base sm:text-lg text-slate-900 hover:text-blue-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <span aria-hidden="true">🏁</span>
            <span>Lomba Lari Numerasi</span>
          </button>

          <button
            type="button"
            onClick={toggleSound}
            aria-label="Hidupkan atau matikan suara"
            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-sm font-semibold text-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {soundOn ? '🔊 Suara' : '🔇 Senyap'}
          </button>
        </div>
      </header>

      <main className="relative z-10 flex-1 mx-auto w-full max-w-4xl px-4 sm:px-6 py-6 sm:py-8 flex flex-col justify-center">
        {/* STEP 1: PILIH FASE */}
        {step === 'PHASE' && (
          <section className="animate-pop-in">
            <div className="text-center mb-6">
              <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-slate-900">
                Pilih Fasemu
              </h1>
              <p className="mt-2 text-slate-600 text-base">
                Kamu akan bertanding dengan teman di fase yang sama.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <button
                type="button"
                onClick={() => handleSelectPhase('B')}
                className="group text-left rounded-2xl bg-white border-2 border-blue-200 hover:border-blue-600 p-6 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between gap-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-blue-700">
                      Fase B · Kelas 3 &amp; 4
                    </div>
                    <h2 className="mt-1 font-display text-2xl font-extrabold text-slate-900">
                      Pelari Muda
                    </h2>
                    <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                      Tambah, kurang, kali, dan bagi angka sederhana serta soal cerita ringan.
                    </p>
                  </div>
                  <Mascot variant="a" size="md" className="shrink-0" />
                </div>
                <span className="font-bold text-sm text-blue-700 group-hover:translate-x-1 transition-transform">
                  Pilih Fase B →
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectPhase('C')}
                className="group text-left rounded-2xl bg-white border-2 border-rose-200 hover:border-rose-600 p-6 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between gap-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-rose-700">
                      Fase C · Kelas 5 &amp; 6
                    </div>
                    <h2 className="mt-1 font-display text-2xl font-extrabold text-slate-900">
                      Pelari Juara
                    </h2>
                    <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                      Perkalian dua angka, operasi hitung campuran, dan soal cerita sehari-hari.
                    </p>
                  </div>
                  <Mascot variant="b" size="md" className="shrink-0" />
                </div>
                <span className="font-bold text-sm text-rose-700 group-hover:translate-x-1 transition-transform">
                  Pilih Fase C →
                </span>
              </button>
            </div>
          </section>
        )}

        {/* STEP 2: TULIS NAMA */}
        {step === 'NAME' && (
          <section className="animate-pop-in mx-auto w-full max-w-md">
            <button
              type="button"
              onClick={() => setStep('PHASE')}
              className="mb-4 text-sm font-semibold text-blue-800 hover:underline cursor-pointer"
            >
              ← Pilih fase lain
            </button>

            <div className="rounded-2xl bg-white border border-slate-200 p-6 sm:p-8 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-blue-700">
                Fase {phase} · {phase === 'B' ? 'Kelas 3–4' : 'Kelas 5–6'}
              </p>
              <h1 className="mt-1 font-display text-2xl sm:text-3xl font-extrabold text-slate-900">
                Siapa namamu?
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Tulis namamu, lalu tekan tombol mulai.
              </p>

              <form onSubmit={handleJoinSubmit} noValidate className="mt-5 flex flex-col gap-4">
                <div>
                  <label
                    htmlFor="inputNama"
                    className="block text-sm font-semibold text-slate-800 mb-1.5"
                  >
                    Nama siswa
                  </label>
                  <input
                    id="inputNama"
                    type="text"
                    maxLength={18}
                    autoComplete="off"
                    autoFocus
                    placeholder="Contoh: Siti"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (nameError) setNameError('');
                    }}
                    className="w-full rounded-xl border-2 border-slate-300 bg-white px-4 py-3 text-base font-semibold text-slate-900 focus:border-blue-600 focus:outline-none"
                  />
                  {nameError && (
                    <p className="mt-2 text-sm font-semibold text-rose-600" role="alert">
                      {nameError}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full rounded-xl bg-amber-400 hover:bg-amber-300 border-2 border-slate-900 py-3.5 px-6 font-display text-lg font-extrabold text-slate-950 shadow-sm transition-colors cursor-pointer"
                >
                  Mulai Berlari 🏃
                </button>
              </form>
            </div>
          </section>
        )}

        {/* STEP 3: MENUNGGU LAWAN */}
        {step === 'WAITING' && (
          <section className="animate-pop-in mx-auto w-full max-w-lg">
            <div className="rounded-2xl bg-white border border-slate-200 p-6 sm:p-8 shadow-sm text-center flex flex-col items-center">
              <div className="flex items-center gap-6 mb-4" aria-hidden="true">
                <Mascot variant="a" size="lg" />
                <Mascot variant="b" isBot size="lg" />
              </div>

              <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900">
                Menunggu lawan...
              </h1>
              <p className="mt-2 text-sm sm:text-base text-slate-600 leading-relaxed">
                Halo <strong className="text-slate-900">{name.trim()}</strong>! Kamu masuk di{' '}
                <strong className="text-blue-700">Fase {phase}</strong>.
                <br />
                Minta temanmu memilih fase yang sama agar bisa bertanding.
              </p>

              {/* Waiting dots */}
              <div className="my-5 flex items-center gap-2" aria-hidden="true">
                <span className="w-3 h-3 rounded-full bg-blue-600 animate-wait-dot" />
                <span
                  className="w-3 h-3 rounded-full bg-rose-500 animate-wait-dot"
                  style={{ animationDelay: '0.2s' }}
                />
                <span
                  className="w-3 h-3 rounded-full bg-amber-500 animate-wait-dot"
                  style={{ animationDelay: '0.4s' }}
                />
              </div>

              {showBotButton && (
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playTap();
                    send({ type: 'student:play_bot' });
                  }}
                  className="animate-pop-in w-full sm:w-auto rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-display font-bold text-base px-6 py-3 shadow-sm transition-colors cursor-pointer"
                >
                  Main dengan Robo Kura 🤖
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  soundEngine.playTap();
                  send({ type: 'student:cancel' });
                  setStep('PHASE');
                }}
                className="mt-4 text-sm font-semibold text-slate-500 hover:text-slate-800 underline cursor-pointer"
              >
                Batalkan dan kembali ke menu
              </button>
            </div>
          </section>
        )}

        {/* STEP 4: BALAPAN AKTIF */}
        {step === 'RACING' && match && me && question && (
          <section className="flex flex-col gap-4">
            {/* Race HUD line (unboxed metadata) */}
            <div className="flex items-center justify-between text-sm font-semibold text-slate-700 px-1">
              <span>
                Fase {match.phase} · {match.isBotMatch ? 'Melawan Robo Kura' : 'Duel Teman'}
              </span>
              <div className="flex items-center gap-3 font-mono-num">
                <span
                  className={`font-extrabold ${
                    match.timeLeftSec <= 10 ? 'text-rose-600' : 'text-slate-900'
                  }`}
                >
                  ⏱️ {String(Math.floor(match.timeLeftSec / 60)).padStart(2, '0')}:
                  {String(match.timeLeftSec % 60).padStart(2, '0')}
                </span>
                <span className="text-slate-400" aria-hidden="true">
                  ·
                </span>
                <span className="text-slate-900">
                  Benar <strong>{me.correctCount}</strong> / {match.targetSteps}
                </span>
              </div>
            </div>

            {/* 2-Lane Race Track */}
            <RaceTrack
              players={match.players}
              targetSteps={match.targetSteps}
              myPlayerId={myPlayerId}
              isActive={match.status === 'active'}
            />

            {/* Question Card */}
            <div className="relative rounded-2xl bg-white border border-slate-200 p-5 sm:p-7 shadow-sm">
              <div className="flex items-center justify-between text-xs sm:text-sm text-slate-500 font-semibold">
                <span className="font-mono-num text-blue-700">Soal ke-{questionNum}</span>
                <span className="font-mono-num">
                  Benar {me.correctCount} dari {match.targetSteps}
                </span>
              </div>

              <div className="mt-4 text-center">
                <p className="font-display text-xl sm:text-2xl font-bold text-slate-900 leading-snug text-balance">
                  {question.prompt}
                </p>
                {question.vertical && <VerticalMathView vertical={question.vertical} />}
              </div>

              {/* 4 Answer Options */}
              <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4">
                {question.options.map((opt, idx) => (
                  <button
                    key={`${question.id}-${idx}`}
                    type="button"
                    disabled={Boolean(feedback) || match.status !== 'active'}
                    onClick={() => handleAnswer(opt)}
                    className="group relative min-h-[56px] rounded-xl border-2 border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-600 active:scale-[0.98] px-4 py-3.5 font-mono-num text-xl sm:text-2xl font-bold text-slate-900 transition-all duration-150 cursor-pointer disabled:opacity-60 disabled:cursor-default flex items-center justify-center"
                  >
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 group-hover:text-blue-600">
                      {idx + 1}
                    </span>
                    <span>{opt}</span>
                  </button>
                ))}
              </div>

              {/* 3-2-1 Start Countdown Overlay over Question Card */}
              {match.status === 'countdown' && (
                <div
                  className="absolute inset-0 rounded-2xl bg-slate-900/85 flex flex-col items-center justify-center p-6 text-center text-white"
                  role="status"
                  aria-live="assertive"
                >
                  <div className="text-xs sm:text-sm font-bold uppercase tracking-widest text-amber-300">
                    Bersiap di Garis Start
                  </div>
                  <div
                    key={match.countdownSec}
                    className="animate-pop-in font-display text-6xl sm:text-7xl font-extrabold text-amber-400 mt-1 font-mono-num"
                  >
                    {match.countdownSec}
                  </div>
                  <p className="mt-2 text-xs sm:text-sm text-slate-200">
                    Soal terbuka otomatis saat hitungan selesai!
                  </p>
                </div>
              )}

              {/* Immediate Answer Feedback Overlay */}
              {feedback && (
                <div
                  className={`animate-pop-in absolute inset-0 rounded-2xl flex flex-col items-center justify-center p-6 text-center ${
                    feedback.correct
                      ? 'bg-emerald-50/95 border-2 border-emerald-500'
                      : 'bg-rose-50/95 border-2 border-rose-400'
                  }`}
                  role="status"
                >
                  <div className="text-4xl mb-2" aria-hidden="true">
                    {feedback.correct ? '🎉' : '😅'}
                  </div>
                  <div className="font-display text-2xl font-extrabold text-slate-900">
                    {feedback.message}
                  </div>
                  <div className="mt-1 text-sm sm:text-base font-semibold text-slate-700">
                    {feedback.detail}
                  </div>
                </div>
              )}
            </div>

            <p className="text-center text-xs text-slate-500">
              Tekan tombol <strong>1</strong> – <strong>4</strong> di keyboard untuk menjawab cepat.
            </p>
          </section>
        )}
      </main>

      {/* STEP 5: HASIL LOMBA MODAL */}
      {step === 'RESULT' && match && me && opponent && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="judulHasil"
        >
          <div className="animate-pop-in w-full max-w-md rounded-2xl bg-white border border-slate-200 p-6 sm:p-8 shadow-xl text-center">
            <div className="text-5xl mb-2" aria-hidden="true">
              {match.winnerId === null ? '🤝' : iWon ? '🏆' : '🥈'}
            </div>
            <h2
              id="judulHasil"
              className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900"
            >
              {match.winnerId === null
                ? 'Hasil Seri!'
                : iWon
                  ? 'Kamu Juara!'
                  : 'Bagus! Tetap Semangat!'}
            </h2>
            <p className="mt-1.5 text-sm text-slate-600">
              {finishReason === 'opponent_left'
                ? 'Lawan meninggalkan lintasan lebih awal.'
                : finishReason === 'time_up'
                  ? match.winnerId === null
                    ? 'Waktu habis dengan skor sama kuat! Tepuk tangan untuk kalian! 👏'
                    : iWon
                      ? 'Waktu habis! Skormu paling tinggi, kamu juaranya! 👏📣'
                      : `Waktu habis! ${opponent.name} unggul di papan skor. Tepuk tangan untukmu! 👏`
                  : iWon
                    ? 'Horeee! Kamu mencapai garis finis lebih dulu! 👏📣'
                    : `${opponent.name} mencapai garis finis lebih dulu. Tepuk tangan untukmu! 👏`}
            </p>

            {/* Score Comparison */}
            <div className="mt-6 grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-xl bg-slate-50 border border-slate-200 p-4">
              <div>
                <div className="text-xs font-bold uppercase text-blue-700 truncate">
                  {me.name}
                </div>
                <div className="mt-1 font-mono-num text-3xl font-extrabold text-slate-900">
                  {me.score}
                </div>
                <div className="text-xs text-slate-500">poin</div>
              </div>

              <div className="font-display font-extrabold text-slate-400 text-sm">VS</div>

              <div>
                <div className="text-xs font-bold uppercase text-rose-700 truncate">
                  {opponent.name}
                </div>
                <div className="mt-1 font-mono-num text-3xl font-extrabold text-slate-900">
                  {opponent.score}
                </div>
                <div className="text-xs text-slate-500">poin</div>
              </div>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={handlePlayAgain}
                className="flex-1 rounded-xl bg-amber-400 hover:bg-amber-300 border-2 border-slate-900 py-3 px-4 font-display font-bold text-slate-950 transition-colors cursor-pointer"
              >
                Main Lagi 🔁
              </button>
              <button
                type="button"
                onClick={handleBackToMenu}
                className="flex-1 rounded-xl bg-white hover:bg-slate-100 border-2 border-slate-300 py-3 px-4 font-display font-bold text-slate-800 transition-colors cursor-pointer"
              >
                Menu Utama 🏠
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 rounded-xl bg-slate-900 text-white px-4 py-2.5 text-sm font-semibold shadow-lg"
          role="alert"
        >
          {toast}
        </div>
      )}
    </div>
  );
};
