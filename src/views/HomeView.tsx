import React from 'react';
import { Mascot } from '../components/Mascot';
import { SkyBackdrop } from '../components/SkyBackdrop';

interface HomeViewProps {
  onNavigate: (route: 'home' | 'guru' | 'siswa') => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onNavigate }) => {
  return (
    <div className="relative min-h-screen flex flex-col justify-between overflow-x-hidden">
      <SkyBackdrop />

      <main className="relative z-10 mx-auto w-full max-w-5xl px-4 sm:px-6 pt-8 sm:pt-12 pb-10 flex flex-col items-center">
        {/* School Name (unboxed clean metadata) */}
        <p className="text-sm font-semibold tracking-wide text-blue-800 uppercase">
          SDN Lendang Telaga
        </p>

        {/* Hero Title */}
        <h1 className="mt-2 text-center font-display text-4xl sm:text-6xl font-extrabold tracking-tight leading-[1.08] text-balance">
          <span className="text-blue-700">Lomba</span>{' '}
          <span className="text-rose-600">Lari</span>{' '}
          <span className="text-amber-600">Numerasi</span>
        </h1>
        <p className="mt-3 text-center text-base sm:text-lg text-slate-700 max-w-xl font-medium">
          Jawab soal dengan benar, karaktermu berlari makin cepat! 🏁
        </p>

        {/* Duo Mascot Stage */}
        <div
          className="mt-7 w-full max-w-2xl rounded-2xl bg-white/90 border border-slate-200/90 shadow-sm px-5 py-5 flex items-center justify-between gap-3"
          aria-hidden="true"
        >
          <div className="hidden sm:block rounded-xl bg-blue-50 border border-blue-200 px-3.5 py-2 text-sm font-semibold text-blue-900">
            Ayo balapan!
          </div>
          <div className="mx-auto flex items-end gap-6 sm:gap-10">
            <Mascot variant="a" isRunning size="lg" />
            <div className="mb-3 font-display text-xl font-extrabold text-slate-400">VS</div>
            <Mascot variant="b" isRunning size="lg" />
          </div>
          <div className="hidden sm:block rounded-xl bg-rose-50 border border-rose-200 px-3.5 py-2 text-sm font-semibold text-rose-900">
            Siap! 3... 2... 1...
          </div>
        </div>

        {/* Role Entry Cards */}
        <div className="mt-7 grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-3xl">
          <button
            type="button"
            onClick={() => onNavigate('guru')}
            className="group text-left rounded-2xl bg-white border border-slate-200 p-6 shadow-sm hover:border-blue-400 hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between gap-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            <div>
              <div className="text-3xl mb-2" aria-hidden="true">
                📺
              </div>
              <h2 className="font-display text-xl font-bold text-slate-900">
                Masuk sebagai Guru
              </h2>
              <p className="mt-1 text-sm text-slate-600 leading-relaxed">
                Tampilkan jalannya lomba di layar proyektor kelas secara langsung.
              </p>
            </div>
            <span className="inline-flex items-center font-semibold text-sm text-blue-700 group-hover:translate-x-1 transition-transform whitespace-nowrap">
              Buka layar →
            </span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('siswa')}
            className="group text-left rounded-2xl bg-amber-400 border border-amber-500 p-6 shadow-sm hover:bg-amber-300 hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between gap-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600"
          >
            <div>
              <div className="text-3xl mb-2" aria-hidden="true">
                🎒
              </div>
              <h2 className="font-display text-xl font-bold text-slate-900">
                Masuk sebagai Siswa
              </h2>
              <p className="mt-1 text-sm text-slate-800 leading-relaxed">
                Pilih Fase B atau Fase C, lalu tulis namamu untuk mulai berlari.
              </p>
            </div>
            <span className="inline-flex items-center font-bold text-sm text-slate-950 group-hover:translate-x-1 transition-transform whitespace-nowrap">
              Mulai berlari →
            </span>
          </button>
        </div>

        {/* Cara Bermain */}
        <section className="mt-8 w-full max-w-3xl rounded-2xl bg-white border border-slate-200 p-6 shadow-sm">
          <h2 className="font-display text-lg font-bold text-slate-900">Cara bermain</h2>
          <ol className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-slate-700">
            <li className="flex items-start gap-3">
              <span className="shrink-0 w-6 h-6 rounded-md bg-blue-100 text-blue-800 font-mono-num font-bold text-xs flex items-center justify-center">
                1
              </span>
              <span>
                Pilih <strong>Fase B</strong> (kelas 3–4) atau <strong>Fase C</strong> (kelas 5–6).
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="shrink-0 w-6 h-6 rounded-md bg-blue-100 text-blue-800 font-mono-num font-bold text-xs flex items-center justify-center">
                2
              </span>
              <span>Tulis namamu. Tidak perlu token, langsung main!</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="shrink-0 w-6 h-6 rounded-md bg-blue-100 text-blue-800 font-mono-num font-bold text-xs flex items-center justify-center">
                3
              </span>
              <span>Dua siswa di fase yang sama otomatis menjadi lawan (atau lawan Robo Kura).</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="shrink-0 w-6 h-6 rounded-md bg-blue-100 text-blue-800 font-mono-num font-bold text-xs flex items-center justify-center">
                4
              </span>
              <span>Jawaban benar = 10 poin dan karaktermu maju satu langkah.</span>
            </li>
            <li className="flex items-start gap-3 sm:col-span-2">
              <span className="shrink-0 w-6 h-6 rounded-md bg-emerald-100 text-emerald-800 font-mono-num font-bold text-xs flex items-center justify-center">
                5
              </span>
              <span>Siapa yang lebih dulu mencapai garis finis (10 langkah), dialah juaranya!</span>
            </li>
          </ol>
        </section>
      </main>

      <footer className="relative z-10 py-4 px-4 text-center text-xs sm:text-sm text-slate-600">
        Dibuat oleh <strong>Tim Pengembang Literasi dan Numerasi SDN Lendang Telaga</strong>
      </footer>
    </div>
  );
};
