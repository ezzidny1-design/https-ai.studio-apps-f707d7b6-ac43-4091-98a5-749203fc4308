import React from 'react';
import type { VerticalMath } from '../shared/types';

interface VerticalMathViewProps {
  vertical: VerticalMath;
}

export const VerticalMathView: React.FC<VerticalMathViewProps> = ({ vertical }) => {
  const operatorSymbol = vertical.operator === '-' ? '−' : vertical.operator;

  return (
    <div
      className="mx-auto my-2 inline-flex flex-col items-end rounded-xl bg-slate-50 border border-slate-200 px-6 py-3 font-mono-num text-2xl sm:text-3xl font-bold text-slate-900 leading-snug select-none"
      aria-label={`${vertical.top} ${operatorSymbol} ${vertical.bottom}`}
    >
      <div className="tracking-wider">{vertical.top}</div>
      <div className="flex items-center gap-4 tracking-wider">
        <span className="text-blue-700">{operatorSymbol}</span>
        <span>{vertical.bottom}</span>
      </div>
      <div className="mt-1 w-full border-t-2 border-slate-800 pt-1 text-right text-slate-400">
        ...
      </div>
    </div>
  );
};
