import React from 'react';

// Bright Cartoonish Launchpad & Spaceport Illustration matching the user's reference art
export default function SpaceportScene({
  showCharacter = true,
  showTowers = true,
  children,
}) {
  return (
    <div className="relative flex-1 min-h-[calc(100vh-42px)] w-full overflow-hidden select-none flex flex-col justify-between bg-gradient-to-b from-[#256eff] via-[#5ca7ff] to-[#9cd0ff]">
      {/* Cartoon Sun & Diagonal Sky Streaks */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-10 left-1/4 w-96 h-12 bg-white/15 -rotate-12 rounded-full blur-sm" />
        <div className="absolute top-16 right-1/4 w-72 h-6 bg-white/20 -rotate-12 rounded-full" />

        {/* Left Fluffy Cartoon Clouds */}
        <svg
          className="absolute top-14 -left-10 w-96 h-44 text-white/90"
          viewBox="0 0 400 180"
          fill="currentColor"
        >
          <path d="M 30 140 Q 10 140 10 120 Q 10 95 35 90 Q 45 55 80 55 Q 115 55 130 85 Q 150 75 170 85 Q 195 70 220 85 Q 245 60 280 75 Q 315 75 320 110 Q 350 110 350 140 Z" />
        </svg>

        {/* Right Fluffy Cartoon Clouds */}
        <svg
          className="absolute top-20 -right-12 w-96 h-44 text-white/90"
          viewBox="0 0 400 180"
          fill="currentColor"
        >
          <path d="M 60 140 Q 40 140 40 118 Q 45 92 75 90 Q 95 55 140 60 Q 175 40 215 65 Q 250 55 275 85 Q 310 80 330 105 Q 365 105 365 140 Z" />
        </svg>

        {/* Distant Blue Mountain Range */}
        <svg
          className="absolute bottom-[30%] left-0 w-full h-48"
          viewBox="0 0 1440 220"
          preserveAspectRatio="none"
        >
          <polygon
            points="0,220 0,130 140,55 290,145 450,70 620,160 790,95 980,35 1170,135 1320,65 1440,120 1440,220"
            fill="#4f8df7"
          />
          <polygon
            points="0,220 90,150 240,85 410,165 570,110 760,175 940,80 1120,155 1290,95 1440,160 1440,220"
            fill="#3b7be8"
            opacity="0.7"
          />
        </svg>

        {/* Green Cartoon Tree Line on Horizon */}
        <div className="absolute bottom-[30%] left-0 right-0 h-8 flex items-end justify-between px-6 opacity-90">
          <div className="flex items-end -space-x-3">
            <div className="w-16 h-8 bg-[#3b8a5a] rounded-t-full" />
            <div className="w-24 h-11 bg-[#2f7a4d] rounded-t-full" />
            <div className="w-16 h-7 bg-[#469866] rounded-t-full" />
            <div className="w-20 h-9 bg-[#3b8a5a] rounded-t-full" />
          </div>
          <div className="flex items-end -space-x-3">
            <div className="w-20 h-9 bg-[#3b8a5a] rounded-t-full" />
            <div className="w-28 h-12 bg-[#2f7a4d] rounded-t-full" />
            <div className="w-16 h-8 bg-[#469866] rounded-t-full" />
          </div>
        </div>

        {/* Golden Sandy Desert Ground */}
        <div className="absolute bottom-0 left-0 right-0 h-[31%] bg-gradient-to-b from-[#f8c86c] to-[#f2b749] border-t-4 border-[#e5a93c]" />

        {/* Perspective Concrete Road & Circular Launchpad */}
        <svg
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[900px] max-w-full h-[46%]"
          viewBox="0 0 900 360"
          preserveAspectRatio="xMidYMax meet"
        >
          {/* Concrete Runway Path */}
          <polygon
            points="330,245 570,245 680,360 220,360"
            fill="#94a3b8"
            stroke="#64748b"
            strokeWidth="3"
          />
          {/* Launchpad Outer Base */}
          <ellipse
            cx="450"
            cy="240"
            rx="245"
            ry="36"
            fill="#475569"
            stroke="#334155"
            strokeWidth="4"
          />
          {/* Yellow Caution Stripe Ring */}
          <ellipse
            cx="450"
            cy="236"
            rx="222"
            ry="30"
            fill="#64748b"
            stroke="#facc15"
            strokeWidth="5"
            strokeDasharray="28 14"
          />
          {/* Inner Blast Pad */}
          <ellipse cx="450" cy="235" rx="165" ry="22" fill="#475569" />

          {/* Raised Concrete Pedestal & Stairs */}
          <polygon
            points="310,222 590,222 570,185 330,185"
            fill="#64748b"
            stroke="#475569"
            strokeWidth="2"
          />
          {/* Center Stairs */}
          <rect x="415" y="185" width="70" height="37" fill="#475569" />
          <line x1="415" y1="194" x2="485" y2="194" stroke="#94a3b8" strokeWidth="2" />
          <line x1="415" y1="203" x2="485" y2="203" stroke="#94a3b8" strokeWidth="2" />
          <line x1="415" y1="212" x2="485" y2="212" stroke="#94a3b8" strokeWidth="2" />

          {/* Left & Right Lattice Launch Towers */}
          {showTowers && (
            <g>
              {/* Left Tower */}
              <g transform="translate(335, 38)">
                <rect x="0" y="0" width="26" height="148" fill="none" stroke="#475569" strokeWidth="4" />
                <line x1="0" y1="30" x2="26" y2="30" stroke="#475569" strokeWidth="3" />
                <line x1="0" y1="60" x2="26" y2="60" stroke="#475569" strokeWidth="3" />
                <line x1="0" y1="90" x2="26" y2="90" stroke="#475569" strokeWidth="3" />
                <line x1="0" y1="120" x2="26" y2="120" stroke="#475569" strokeWidth="3" />
                <line x1="0" y1="0" x2="26" y2="30" stroke="#64748b" strokeWidth="2.5" />
                <line x1="26" y1="30" x2="0" y2="60" stroke="#64748b" strokeWidth="2.5" />
                <line x1="0" y1="60" x2="26" y2="90" stroke="#64748b" strokeWidth="2.5" />
                <line x1="26" y1="90" x2="0" y2="120" stroke="#64748b" strokeWidth="2.5" />
                <line x1="0" y1="120" x2="26" y2="148" stroke="#64748b" strokeWidth="2.5" />
                <rect x="-4" y="-6" width="38" height="10" rx="2" fill="#475569" />
              </g>

              {/* Right Tower */}
              <g transform="translate(539, 38)">
                <rect x="0" y="0" width="26" height="148" fill="none" stroke="#475569" strokeWidth="4" />
                <line x1="0" y1="30" x2="26" y2="30" stroke="#475569" strokeWidth="3" />
                <line x1="0" y1="60" x2="26" y2="60" stroke="#475569" strokeWidth="3" />
                <line x1="0" y1="90" x2="26" y2="90" stroke="#475569" strokeWidth="3" />
                <line x1="0" y1="120" x2="26" y2="120" stroke="#475569" strokeWidth="3" />
                <line x1="0" y1="0" x2="26" y2="30" stroke="#64748b" strokeWidth="2.5" />
                <line x1="26" y1="30" x2="0" y2="60" stroke="#64748b" strokeWidth="2.5" />
                <line x1="0" y1="60" x2="26" y2="90" stroke="#64748b" strokeWidth="2.5" />
                <line x1="26" y1="90" x2="0" y2="120" stroke="#64748b" strokeWidth="2.5" />
                <line x1="0" y1="120" x2="26" y2="148" stroke="#64748b" strokeWidth="2.5" />
                <rect x="-8" y="-6" width="38" height="10" rx="2" fill="#475569" />
              </g>
            </g>
          )}

          {/* Cargo Crates & Fuel Drums around Pad */}
          <rect x="120" y="215" width="38" height="32" rx="3" fill="#d97706" stroke="#92400e" strokeWidth="2" />
          <rect x="164" y="222" width="26" height="25" rx="3" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="2" />
          <rect x="690" y="210" width="34" height="34" rx="3" fill="#d97706" stroke="#92400e" strokeWidth="2" />
        </svg>

        {/* Cartoon Young Mission Architect Character on Right (matching attached image 2!) */}
        {showCharacter && (
          <div className="hidden lg:block absolute bottom-0 right-10 xl:right-20 w-64 h-[410px] pointer-events-none z-10">
            <svg viewBox="0 0 240 380" className="w-full h-full drop-shadow-xl">
              {/* Cargo Pants */}
              <path d="M 78 265 L 162 265 L 170 380 L 126 380 L 120 310 L 114 380 L 70 380 Z" fill="#27272a" />
              <rect x="66" y="305" width="16" height="38" rx="4" fill="#18181b" />
              <rect x="158" y="305" width="16" height="38" rx="4" fill="#18181b" />

              {/* Dark Waist Hem */}
              <rect x="76" y="242" width="88" height="26" rx="4" fill="#18181b" />

              {/* White Techwear Space Jacket (Back View) */}
              <path
                d="M 62 128 Q 120 115 178 128 L 196 235 L 168 242 L 160 175 L 160 245 L 80 245 L 80 175 L 72 242 L 44 235 Z"
                fill="#f8fafc"
                stroke="#cbd5e1"
                strokeWidth="3"
              />
              {/* Jacket Shoulder Patches */}
              <rect x="52" y="162" width="14" height="32" rx="3" transform="rotate(8 52 162)" fill="#1e293b" />
              <rect x="172" y="162" width="14" height="32" rx="3" transform="rotate(-8 172 162)" fill="#1e293b" />

              {/* Dark Hoodie Hood */}
              <path
                d="M 74 128 Q 120 156 166 128 Q 160 102 120 102 Q 80 102 74 128 Z"
                fill="#27272a"
              />

              {/* Neck & Ears */}
              <rect x="107" y="84" width="26" height="24" rx="6" fill="#fed7aa" />
              <circle cx="88" cy="68" r="8" fill="#fed7aa" />
              <circle cx="152" cy="68" r="8" fill="#fed7aa" />

              {/* Spiky Anime Dark Brown Hair */}
              <path
                d="M 85 78 Q 72 55 88 35 Q 100 18 122 20 Q 148 18 158 38 Q 172 56 155 78 Q 145 92 120 92 Q 95 92 85 78 Z"
                fill="#3b2314"
              />
              <path
                d="M 80 48 L 68 56 L 84 64 Z M 160 48 L 172 58 L 156 65 Z M 105 22 L 115 10 L 128 22 Z"
                fill="#3b2314"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Foreground Interactive UI Content */}
      <div className="relative z-20 flex-1 flex flex-col">{children}</div>
    </div>
  );
}
