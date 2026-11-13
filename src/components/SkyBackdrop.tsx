import React from 'react';

export const SkyBackdrop: React.FC = () => {
  return (
    <div
      className="pointer-events-none fixed inset-0 overflow-hidden select-none"
      aria-hidden="true"
    >
      {/* Sunlit Sky Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#BAE6FD] via-[#E0F2FE] to-[#ECFDF5]" />

      {/* Warm Glowing Sun */}
      <div className="absolute -top-14 right-8 sm:right-24 w-48 h-48 rounded-full bg-amber-300/50 blur-2xl" />
      <div className="absolute top-6 right-10 sm:right-28 w-20 h-20 rounded-full bg-gradient-to-br from-amber-200 via-amber-300 to-amber-400 border-4 border-amber-100/90 shadow-md" />

      {/* Drifting Clouds */}
      <div className="animate-cloud-a absolute top-12 left-[6%] opacity-90">
        <div className="relative w-36 h-11 rounded-full bg-white shadow-sm">
          <div className="absolute -top-5 left-5 w-14 h-14 rounded-full bg-white" />
          <div className="absolute -top-7 left-14 w-16 h-16 rounded-full bg-white" />
        </div>
      </div>

      <div className="animate-cloud-b absolute top-24 right-[15%] opacity-85 hidden sm:block">
        <div className="relative w-44 h-12 rounded-full bg-white shadow-sm">
          <div className="absolute -top-6 left-7 w-16 h-16 rounded-full bg-white" />
          <div className="absolute -top-8 left-16 w-20 h-20 rounded-full bg-white" />
        </div>
      </div>

      <div className="animate-cloud-a absolute top-36 left-[34%] opacity-70 hidden md:block">
        <div className="relative w-28 h-8 rounded-full bg-white/90">
          <div className="absolute -top-4 left-4 w-10 h-10 rounded-full bg-white/90" />
          <div className="absolute -top-5 left-11 w-12 h-12 rounded-full bg-white/90" />
        </div>
      </div>

      {/* Festival Pennant Bunting across top */}
      <svg
        viewBox="0 0 1440 70"
        preserveAspectRatio="none"
        className="absolute top-0 left-0 w-full h-14 opacity-70"
      >
        <path
          d="M0,10 Q360,48 720,16 Q1080,-12 1440,22"
          fill="none"
          stroke="#64748B"
          strokeWidth="1.8"
        />
        {[
          { x: 90, y: 20, c: '#EF4444' },
          { x: 180, y: 27, c: '#F59E0B' },
          { x: 270, y: 31, c: '#3B82F6' },
          { x: 360, y: 31, c: '#10B981' },
          { x: 450, y: 28, c: '#EC4899' },
          { x: 540, y: 24, c: '#F59E0B' },
          { x: 630, y: 20, c: '#3B82F6' },
          { x: 810, y: 12, c: '#EF4444' },
          { x: 900, y: 9, c: '#10B981' },
          { x: 990, y: 8, c: '#F59E0B' },
          { x: 1080, y: 9, c: '#3B82F6' },
          { x: 1170, y: 12, c: '#EC4899' },
          { x: 1260, y: 16, c: '#EF4444' },
          { x: 1350, y: 20, c: '#F59E0B' },
        ].map((flag, i) => (
          <polygon
            key={i}
            points={`${flag.x - 12},${flag.y} ${flag.x + 12},${flag.y} ${flag.x},${flag.y + 22}`}
            fill={flag.c}
          />
        ))}
      </svg>

      {/* Distant Rolling Hills, School Building Silhouette, Grandstand & Lush Trees */}
      <svg
        viewBox="0 0 1440 300"
        preserveAspectRatio="xMidYMax slice"
        className="absolute bottom-0 left-0 w-full h-56 sm:h-72"
      >
        {/* Distant Mountain / Hill Silhouettes */}
        <path
          d="M0,190 C220,115 440,210 720,155 C1000,100 1240,190 1440,140 L1440,300 L0,300 Z"
          fill="#BBF7D0"
          opacity="0.75"
        />

        {/* Siluet Bangunan Sekolah SDN Lendang Telaga (Left-Center Horizon) */}
        <g transform="translate(170, 118)" opacity="0.82">
          {/* Main School Wing */}
          <rect x="0" y="38" width="220" height="58" rx="3" fill="#CBD5E1" />
          <polygon points="-10,40 110,8 230,40" fill="#94A3B8" />
          {/* Center Clock Gable */}
          <rect x="86" y="18" width="48" height="78" fill="#E2E8F0" />
          <polygon points="80,20 110,-2 140,20" fill="#64748B" />
          <circle cx="110" cy="30" r="8" fill="#FFFFFF" stroke="#64748B" strokeWidth="2" />
          {/* School Windows */}
          {[18, 42, 66, 146, 170, 194].map((wx) => (
            <rect key={wx} x={wx} y="52" width="14" height="20" rx="2" fill="#93C5FD" />
          ))}
          {/* Main Entrance Door */}
          <rect x="100" y="62" width="20" height="34" rx="2" fill="#64748B" />
          {/* Flagpole & Bendera Merah Putih */}
          <line x1="252" y1="8" x2="252" y2="96" stroke="#475569" strokeWidth="3" />
          <rect x="253" y="10" width="28" height="9" fill="#EF4444" />
          <rect x="253" y="19" width="28" height="9" fill="#FFFFFF" />
        </g>

        {/* Siluet Tribun / Bangunan Kota & Stadion (Right Horizon) */}
        <g transform="translate(970, 130)" opacity="0.72">
          {/* City / Village Building Silhouettes */}
          <rect x="0" y="32" width="44" height="56" rx="2" fill="#CBD5E1" />
          <rect x="8" y="42" width="8" height="10" fill="#94A3B8" />
          <rect x="26" y="42" width="8" height="10" fill="#94A3B8" />
          <rect x="52" y="18" width="54" height="70" rx="2" fill="#94A3B8" />
          <rect x="62" y="28" width="10" height="12" fill="#CBD5E1" />
          <rect x="82" y="28" width="10" height="12" fill="#CBD5E1" />
          <rect x="62" y="48" width="10" height="12" fill="#CBD5E1" />
          <rect x="82" y="48" width="10" height="12" fill="#CBD5E1" />
          {/* Stadium Light Tower */}
          <line x1="145" y1="0" x2="145" y2="88" stroke="#64748B" strokeWidth="3" />
          <rect x="132" y="0" width="26" height="10" rx="2" fill="#475569" />
          <circle cx="139" cy="5" r="2.2" fill="#FEF08A" />
          <circle cx="145" cy="5" r="2.2" fill="#FEF08A" />
          <circle cx="151" cy="5" r="2.2" fill="#FEF08A" />
          {/* Grandstand Roof */}
          <polygon points="168,88 180,44 290,44 302,88" fill="#CBD5E1" />
          <polygon points="172,44 235,28 298,44" fill="#64748B" />
        </g>

        {/* Foreground Meadow Lawn */}
        <path
          d="M0,210 C320,185 680,230 1040,195 C1240,175 1360,205 1440,195 L1440,300 L0,300 Z"
          fill="#86EFAC"
        />
        <path
          d="M0,242 C380,224 760,256 1440,228 L1440,300 L0,300 Z"
          fill="#4ADE80"
          opacity="0.55"
        />

        {/* Ornamen Pohon Rindang Kiri */}
        <g transform="translate(36, 128)">
          <rect x="28" y="64" width="14" height="58" rx="4" fill="#78350F" />
          <circle cx="35" cy="52" r="32" fill="#16A34A" />
          <circle cx="16" cy="60" r="22" fill="#22C55E" />
          <circle cx="56" cy="60" r="24" fill="#15803D" />
          <circle cx="36" cy="36" r="22" fill="#4ADE80" opacity="0.65" />
        </g>

        <g transform="translate(115, 160) scale(0.75)">
          <rect x="28" y="64" width="12" height="52" rx="4" fill="#78350F" />
          <circle cx="34" cy="50" r="28" fill="#15803D" />
          <circle cx="16" cy="58" r="20" fill="#22C55E" />
          <circle cx="52" cy="58" r="20" fill="#16A34A" />
        </g>

        {/* Ornamen Pohon Rindang Kanan */}
        <g transform="translate(1285, 122)">
          <rect x="34" y="64" width="15" height="62" rx="4" fill="#78350F" />
          <circle cx="42" cy="50" r="34" fill="#15803D" />
          <circle cx="20" cy="60" r="24" fill="#22C55E" />
          <circle cx="64" cy="60" r="24" fill="#16A34A" />
          <circle cx="42" cy="34" r="22" fill="#4ADE80" opacity="0.65" />
        </g>

        <g transform="translate(1205, 158) scale(0.78)">
          <rect x="28" y="64" width="12" height="54" rx="4" fill="#78350F" />
          <circle cx="34" cy="50" r="28" fill="#16A34A" />
          <circle cx="16" cy="58" r="20" fill="#4ADE80" opacity="0.8" />
          <circle cx="52" cy="58" r="20" fill="#15803D" />
        </g>

        {/* Decorative Bushes along Foreground */}
        <g fill="#16A34A" opacity="0.85">
          <circle cx="12" cy="285" r="24" />
          <circle cx="44" cy="292" r="18" />
          <circle cx="1390" cy="286" r="26" />
          <circle cx="1425" cy="290" r="20" />
        </g>
      </svg>
    </div>
  );
};
