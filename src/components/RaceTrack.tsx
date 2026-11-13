import React from 'react';
import type { PlayerState } from '../shared/types';
import { Mascot } from './Mascot';

interface RaceTrackProps {
  players: [PlayerState, PlayerState];
  targetSteps: number;
  myPlayerId?: string;
  compact?: boolean;
  isActive?: boolean;
}

export const RaceTrack: React.FC<RaceTrackProps> = ({
  players,
  targetSteps,
  myPlayerId,
  compact = false,
  isActive = true,
}) => {
  const someoneFinished = players.some((p) => p.correctCount >= targetSteps);

  return (
    <div className="rounded-2xl bg-[#166534] p-2.5 sm:p-3.5 shadow-sm border-2 border-[#14532D] overflow-hidden">
      {/* Stadium Top Rail & Supporter Stand */}
      <div className="flex items-center justify-between px-2 pb-2 mb-2 border-b border-emerald-500/35 text-[11px] font-semibold text-emerald-100">
        <div className="flex items-center gap-2">
          <span className="font-mono-num uppercase tracking-wider text-emerald-200">
            Start
          </span>
          <span className="text-emerald-300/60" aria-hidden="true">
            ·
          </span>
          <span className="hidden sm:inline text-emerald-100/85">
            {someoneFinished ? 'Sorak Supporter: Horeee! 👏📣' : 'Lintasan Atletik SDN Lendang Telaga'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 font-mono-num text-amber-200">
          {someoneFinished && (
            <span className="animate-bounce" aria-hidden="true">
              🎉
            </span>
          )}
          <span>Finis ({targetSteps} Langkah)</span>
          <span aria-hidden="true">🏁</span>
        </div>
      </div>

      {/* 2 Running Lanes */}
      <div className="flex flex-col gap-2.5">
        {players.map((player, idx) => {
          const ratio = Math.min(1, Math.max(0, player.correctCount / targetSteps));
          const isMe = myPlayerId ? player.id === myPlayerId : idx === 0;
          const roleText = myPlayerId ? (isMe ? 'Kamu' : 'Lawan') : `Lintasan 0${idx + 1}`;
          const isRunning = isActive && player.correctCount < targetSteps;
          const isWinner = player.correctCount >= targetSteps;

          return (
            <div key={player.id} className="flex flex-col gap-1">
              {/* Lane Header (clean unboxed metadata) */}
              <div className="flex items-center justify-between gap-3 px-1 text-white">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`inline-block w-2.5 h-2.5 rounded-sm shrink-0 ${
                      player.mascot === 'a' ? 'bg-orange-400' : 'bg-blue-400'
                    }`}
                  />
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-emerald-100/85 shrink-0">
                    {roleText}
                  </span>
                  <span className="text-emerald-200/60" aria-hidden="true">
                    ·
                  </span>
                  <span className="font-display font-bold text-sm sm:text-base truncate">
                    {player.name}
                  </span>
                  {isWinner && (
                    <span className="text-sm shrink-0" aria-label="Juara">
                      🏆
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs sm:text-sm font-mono-num shrink-0 text-emerald-50">
                  <span>
                    {player.correctCount}/{targetSteps}
                  </span>
                  <span className="text-emerald-200/60" aria-hidden="true">
                    ·
                  </span>
                  <span className="font-bold text-amber-300">{player.score} poin</span>
                </div>
              </div>

              {/* Terracotta Athletics Lane */}
              <div
                className={`relative w-full rounded-xl bg-gradient-to-b from-[#D9532F] to-[#B93818] border-2 border-white/35 overflow-hidden shadow-inner ${
                  compact ? 'h-[76px] sm:h-20' : 'h-20 sm:h-24'
                }`}
              >
                {/* Lane Number Watermark inside start pad */}
                <div
                  className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 font-display font-extrabold text-lg text-white/25 select-none"
                  aria-hidden="true"
                >
                  {idx + 1}
                </div>

                {/* Progress Trail Bar */}
                <div
                  className={`pointer-events-none absolute inset-y-0 left-0 transition-transform duration-300 ease-out origin-left ${
                    player.mascot === 'a'
                      ? 'bg-orange-300/20'
                      : 'bg-blue-400/20'
                  }`}
                  style={{
                    width: '100%',
                    transform: `scaleX(${ratio})`,
                  }}
                />

                {/* Step Yard Lines */}
                <div className="pointer-events-none absolute inset-x-8 inset-y-0 flex justify-between items-center">
                  {Array.from({ length: targetSteps + 1 }).map((_, stepIdx) => (
                    <div
                      key={stepIdx}
                      className={`h-full border-l ${
                        stepIdx === 5
                          ? 'border-white/40'
                          : 'border-dashed border-white/20'
                      }`}
                    />
                  ))}
                </div>

                {/* Center Lane Guide Line */}
                <div className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 border-t border-white/15" />

                {/* Starting Block Post */}
                <div
                  className="pointer-events-none absolute left-6 top-1.5 bottom-1.5 w-1 rounded-full bg-white/85"
                  aria-hidden="true"
                />

                {/* Checkered Finish Line Arch */}
                <div
                  className="pointer-events-none absolute right-3 sm:right-4 top-0 bottom-0 w-4 garis-finish-bg border-x border-slate-900/40"
                  aria-hidden="true"
                />

                {/* Runner Position Track (compositor translateX on w-full wrapper) */}
                <div className="absolute left-5 right-16 sm:right-20 top-0 bottom-0 flex items-center">
                  <div
                    className="w-full transition-transform duration-300 ease-out"
                    style={{ transform: `translateX(${ratio * 100}%)` }}
                  >
                    <div className="relative inline-flex items-center">
                      {isRunning && player.correctCount > 0 && (
                        <span
                          className="animate-dust -ml-2 mr-0.5 text-xs select-none"
                          aria-hidden="true"
                        >
                          💨
                        </span>
                      )}
                      <Mascot
                        variant={player.mascot}
                        isBot={player.isBot}
                        isRunning={isRunning}
                        size={compact ? 'md' : 'md'}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
