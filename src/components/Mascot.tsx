import React from 'react';
import type { MascotId } from '../shared/types';

interface MascotProps {
  variant: MascotId;
  isBot?: boolean;
  isRunning?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Mascot: React.FC<MascotProps> = ({
  variant,
  isBot = false,
  isRunning = false,
  size = 'md',
  className = '',
}) => {
  const sizeClass =
    size === 'sm'
      ? 'w-14 h-14'
      : size === 'lg'
        ? 'w-24 h-24 sm:w-28 sm:h-28'
        : 'w-16 h-16 sm:w-20 sm:h-20';

  // Color palette faithfully modeled after the attached runner illustration
  const palette = isBot
    ? {
        shirt: '#0D9488',
        shirtShade: '#0F766E',
        cuff: '#134E4A',
        shorts: '#1E293B',
        shortsShade: '#0F172A',
        stripe: '#38BDF8',
        shoe: '#0284C7',
        shoeAccent: '#BAE6FD',
        hair: '#0F172A',
      }
    : variant === 'a'
      ? {
          shirt: '#F97316',
          shirtShade: '#EA580C',
          cuff: '#7C2D12',
          shorts: '#0F766E',
          shortsShade: '#115E59',
          stripe: '#FACC15',
          shoe: '#881337',
          shoeAccent: '#5EEAD4',
          hair: '#24120E',
        }
      : {
          shirt: '#2563EB',
          shirtShade: '#1D4ED8',
          cuff: '#1E3A8A',
          shorts: '#1E293B',
          shortsShade: '#0F172A',
          stripe: '#FACC15',
          shoe: '#DC2626',
          shoeAccent: '#E2E8F0',
          hair: '#24120E',
        };

  return (
    <svg
      viewBox="0 0 110 110"
      className={`${sizeClass} ${isRunning ? 'is-sprinting' : 'animate-mascot-idle'} overflow-visible ${className}`}
      aria-hidden="true"
    >
      {/* Ground Shadow */}
      <ellipse
        cx="54"
        cy="101"
        rx="26"
        ry="4.5"
        fill="rgba(15, 23, 42, 0.22)"
        className="runner-shadow"
      />

      {/* Articulated Hip / Pelvis Pivot Group */}
      <g className="runner-hip">
        {/* BACK ARM (Swings opposite to front arm) */}
        <g className="runner-arm-back">
          {/* Upper sleeve */}
          <path
            d="M57 42 L68 48 L74 39"
            fill="none"
            stroke={palette.shirtShade}
            strokeWidth="8.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Forearm & Fist */}
          <path
            d="M68 48 L75 38"
            fill="none"
            stroke="#F3A868"
            strokeWidth="6.5"
            strokeLinecap="round"
          />
          <circle cx="76" cy="36" r="4.3" fill="#F3A868" />
        </g>

        {/* BACK LEG (Thigh + Knee + Shin + Maroon Sneaker) */}
        <g className="runner-leg-back">
          {/* Shorts back leg */}
          <path
            d="M49 64 L36 74"
            stroke={palette.shortsShade}
            strokeWidth="12"
            strokeLinecap="round"
          />
          {/* Bare lower thigh & calf */}
          <path
            d="M36 74 L22 76"
            fill="none"
            stroke="#E59556"
            strokeWidth="7.5"
            strokeLinecap="round"
          />
          <circle cx="35" cy="74" r="4" fill="#E59556" />
          {/* Sneaker */}
          <g transform="translate(15, 73) rotate(55)">
            <path
              d="M-3 0 C-3 -4, 9 -5, 13 -1 L13 4 L-3 4 Z"
              fill={palette.shoe}
            />
            <rect x="-3" y="3.5" width="16.5" height="2.6" rx="1.2" fill="#F8FAFC" />
            <line x1="3" y1="-1" x2="6" y2="2" stroke={palette.shoeAccent} strokeWidth="1.5" />
          </g>
        </g>

        {/* FRONT LEG (Thigh + Knee + Shin + Maroon Sneaker) */}
        <g className="runner-leg-front">
          {/* Shorts front leg */}
          <path
            d="M55 64 L69 72"
            stroke={palette.shorts}
            strokeWidth="12.5"
            strokeLinecap="round"
          />
          {/* Yellow Side Stripe on Shorts */}
          <path
            d="M52 60 L67 70"
            stroke={palette.stripe}
            strokeWidth="2.8"
            strokeLinecap="round"
          />
          {/* Knee & Shin */}
          <circle cx="70" cy="72" r="4.4" fill="#F7B87E" />
          <path
            d="M70 72 L76 90"
            fill="none"
            stroke="#F3A868"
            strokeWidth="7.5"
            strokeLinecap="round"
          />
          {/* Maroon Running Sneaker */}
          <g transform="translate(72, 89) rotate(-18)">
            <path
              d="M-4 0 C-4 -4, 11 -5, 16 0 L16 5 L-4 5 Z"
              fill={palette.shoe}
            />
            <rect x="-4.5" y="4.2" width="21" height="2.8" rx="1.2" fill="#F8FAFC" />
            <line x1="3" y1="-1" x2="7" y2="2.5" stroke={palette.shoeAccent} strokeWidth="1.6" />
          </g>
        </g>

        {/* PELVIS / HIPS BASE */}
        <path
          d="M44 58 Q53 56 62 59 L60 68 Q52 70 43 66 Z"
          fill={palette.shorts}
        />
        <path d="M46 58 L54 65" stroke={palette.stripe} strokeWidth="2.8" strokeLinecap="round" />

        {/* TORSO & HEAD (Leans dynamically forward during sprint) */}
        <g className="runner-torso">
          {/* Jersey Shirt */}
          <path
            d="M44 37 Q54 35 61 38 L61 60 Q52 62 43 59 Z"
            fill={palette.shirt}
          />
          {/* Shirt side shading */}
          <path
            d="M44 38 Q48 48 45 59 L43 59 Q43 47 44 38 Z"
            fill={palette.shirtShade}
          />
          {/* Neck */}
          <rect x="50" y="30" width="7" height="8" rx="3" fill="#E59556" />

          {/* HEAD */}
          <g transform="translate(0, 0)">
            {/* Head Base */}
            <ellipse cx="55" cy="21" rx="12" ry="13" fill="#F3A868" />
            {/* Ear */}
            <circle cx="43.5" cy="22.5" r="3.4" fill="#E59556" />
            <circle cx="43.5" cy="22.5" r="1.6" fill="#D97F43" />

            {/* Hair (Neatly parted dark hair like reference image) */}
            <path
              d="M42 20 C41 10, 50 5, 60 7 C66 8, 68 13, 66 17 C63 13, 56 12, 50 15 C46 17, 45 21, 42 20 Z"
              fill={palette.hair}
            />
            <path
              d="M42 19 C41 22, 42 25, 44 25 L45 19 Z"
              fill={palette.hair}
            />

            {/* Bot Visor / Antenna (only if Robo Kura) */}
            {isBot && (
              <g>
                <line x1="54" y1="7" x2="54" y2="2" stroke="#0F766E" strokeWidth="2.2" />
                <circle cx="54" cy="2" r="2.5" fill="#FACC15" />
                <rect x="52" y="14" width="14" height="6" rx="3" fill="#0F172A" opacity="0.88" />
                <circle cx="61" cy="17" r="1.5" fill="#38BDF8" />
              </g>
            )}

            {/* Facial Features (only full eyes/smile if not wearing bot visor) */}
            {!isBot && (
              <>
                {/* Eyebrows */}
                <path
                  d="M52 15 Q55 13.5 57.5 14.8"
                  fill="none"
                  stroke={palette.hair}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <path
                  d="M60.5 15 Q63 13.8 64.5 15"
                  fill="none"
                  stroke={palette.hair}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                {/* Eyes */}
                <circle cx="55.5" cy="18.2" r="1.7" fill="#1E1B18" />
                <circle cx="62.5" cy="18.2" r="1.6" fill="#1E1B18" />
                <circle cx="56" cy="17.7" r="0.55" fill="#FFFFFF" />
                <circle cx="63" cy="17.7" r="0.55" fill="#FFFFFF" />
              </>
            )}

            {/* Nose & Rosy Cheek */}
            <path
              d="M60 19.5 L62.5 21.8 L60 22.8"
              fill="none"
              stroke="#D97F43"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <ellipse cx="52.5" cy="23.5" rx="2.6" ry="1.6" fill="#E87E62" opacity="0.6" />

            {/* Big Happy Smile */}
            <path
              d="M54 25.5 Q59 29.5 64 25 Q61 25 54 25.5 Z"
              fill="#FFFFFF"
            />
            <path
              d="M54.5 25.6 Q59 30.2 63.8 25.2"
              fill="none"
              stroke="#991B1B"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          </g>

          {/* FRONT ARM (Bent elbow pumping energetically) */}
          <g className="runner-arm-front">
            {/* Upper arm sleeve */}
            <path
              d="M46 40 L37 48"
              fill="none"
              stroke={palette.shirt}
              strokeWidth="9.5"
              strokeLinecap="round"
            />
            {/* Cuff line */}
            <line x1="35" y1="45" x2="39" y2="50" stroke={palette.cuff} strokeWidth="2" />
            {/* Forearm & Fist */}
            <path
              d="M37 48 L43 57"
              fill="none"
              stroke="#F3A868"
              strokeWidth="6.5"
              strokeLinecap="round"
            />
            <circle cx="44" cy="58" r="4.4" fill="#F3A868" />
          </g>
        </g>
      </g>
    </svg>
  );
};
