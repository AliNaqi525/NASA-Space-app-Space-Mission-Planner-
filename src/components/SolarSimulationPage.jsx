import React, { useState, useEffect, useRef } from 'react';
import { TRAJECTORY_PATHS } from '../data/missionCatalog.js';
import {
  Rocket,
  Compass,
  AlertTriangle,
  Sparkles,
  LogOut,
  Wrench,
  Utensils,
  Award,
  ArrowLeft,
  Lock,
} from 'lucide-react';

export default function SolarSimulationPage({
  evaluation,
  launchAngleDeg,
  trajectoryId,
  onChangeAngle,
  onChangeTrajectory,
  onGoToPage,
  onMissionComplete,
  onExitGame,
  room,
  myAssignedRoles = ['commander', 'propulsion', 'payload', 'lifesupport'],
  onTriggerRoomLaunch,
  walkthroughStep = 0,
  onWalkthroughStepComplete,
  autoLaunchSignal = 0,
}) {
  const [simState, setSimState] = useState('prelaunch'); // 'prelaunch' | 'flying' | 'crashed' | 'success'
  const [progress, setProgress] = useState(0); // 0 to 1
  const [forceTestCrashMode, setForceTestCrashMode] = useState(false);
  const [mobileCamView, setMobileCamView] = useState('both'); // 'sfs' | 'solar' | 'both' (for phones <1024px)
  const recordedRef = useRef(false);
  const lastLaunchTsRef = useRef(room?.launchTimestamp || null);
  const prevAutoSignalRef = useRef(autoLaunchSignal);

  const {
    mission,
    nose,
    tank,
    coating,
    fins,
    engine,
    trajectoryAccuracyPct,
    isTrajectoryAcceptable,
    optimalTrajectoryObj,
    prepSteps,
    prepProgressPct,
    isPrepFull,
    primaryFailure,
    totalMissionScore,
    experimentsScore,
    foodMoraleScore,
    budgetEfficiencyBonus,
    totalSpent,
  } = evaluation;

  const canEditCommander =
    !room || !room.strictRoleLock || myAssignedRoles.includes('commander');

  const commanderOwner = room
    ? room.players.find((p) => (p.assignedRoles || []).includes('commander'))
        ?.username || 'Commander'
    : 'You';

  // Auto-start flight ONLY if a teammate in the Room just clicked Launch within the last 3 seconds!
  useEffect(() => {
    if (
      room?.launchTimestamp &&
      room.launchTimestamp !== lastLaunchTsRef.current &&
      Date.now() - room.launchTimestamp < 3000 &&
      simState === 'prelaunch'
    ) {
      lastLaunchTsRef.current = room.launchTimestamp;
      recordedRef.current = false;
      setProgress(0);
      setSimState('flying');
    }
  }, [room?.launchTimestamp, simState]);

  // Run SFS Flight Animation Loop when in 'flying' state
  useEffect(() => {
    if (simState !== 'flying') return;

    const targetStop = primaryFailure ? primaryFailure.progressStop : 1.0;
    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + 0.012;
        if (next >= targetStop) {
          clearInterval(interval);
          if (primaryFailure) {
            setSimState('crashed');
            if (!recordedRef.current) {
              recordedRef.current = true;
              onMissionComplete({
                missionId: mission.id,
                missionName: mission.name,
                success: false,
                score: 0,
                budgetSpent: totalSpent,
                failureReason: primaryFailure.title,
              });
            }
          } else {
            setSimState('success');
            if (!recordedRef.current) {
              recordedRef.current = true;
              onMissionComplete({
                missionId: mission.id,
                missionName: mission.name,
                success: true,
                score: totalMissionScore,
                budgetSpent: totalSpent,
              });
            }
          }
          return targetStop;
        }
        return next;
      });
    }, 55);

    return () => clearInterval(interval);
  }, [simState, primaryFailure, mission, totalMissionScore, totalSpent, onMissionComplete]);

  // Rocket can only be launched when Mission Prep Progress Bar is 100% FULL (unless user explicitly toggles test-crash override)
  const canLaunchRocket = isPrepFull || forceTestCrashMode;

  const handleStartFlight = () => {
    if (!canLaunchRocket) return;
    if (walkthroughStep >= 7 && onWalkthroughStepComplete) {
      onWalkthroughStepComplete(8);
    }
    recordedRef.current = false;
    setProgress(0);
    setSimState('flying');
    if (onTriggerRoomLaunch) {
      onTriggerRoomLaunch();
    }
  };

  useEffect(() => {
    if (
      autoLaunchSignal > prevAutoSignalRef.current &&
      simState === 'prelaunch' &&
      canLaunchRocket
    ) {
      prevAutoSignalRef.current = autoLaunchSignal;
      recordedRef.current = false;
      setProgress(0);
      setSimState('flying');
    }
  }, [autoLaunchSignal, simState, canLaunchRocket]);

  const handleApplySuggestedTrajectory = () => {
    onChangeAngle(mission.optimalAngleDeg);
    onChangeTrajectory(mission.optimalTrajectoryId);
    if (walkthroughStep === 7 && onWalkthroughStepComplete) {
      onWalkthroughStepComplete(7);
    }
  };

  const altitudeKm =
    progress < 0.35
      ? ((progress / 0.35) * 185).toFixed(1)
      : (185 + (progress - 0.35) * 45000).toFixed(0);
  const velocityMs =
    progress < 0.35
      ? Math.round((progress / 0.35) * 7800)
      : Math.round(7800 + (progress - 0.35) * 18500);
  const fuelRemainingPct = Math.max(
    0,
    Math.round(
      100 -
        progress *
          (primaryFailure?.code === 'OUT_OF_FUEL' ? 175 : 82)
    )
  );

  const earthPos = { x: 210, y: 250 };
  const targetPlanetPos =
    mission.id === 'moon'
      ? { x: 350, y: 175 }
      : mission.id === 'mars'
      ? { x: 560, y: 210 }
      : { x: 810, y: 185 };

  const angleOffset = (launchAngleDeg - mission.optimalAngleDeg) * 2.4;
  const curveCtrl =
    trajectoryId === 'direct'
      ? {
          x: (earthPos.x + targetPlanetPos.x) / 2,
          y: Math.min(earthPos.y, targetPlanetPos.y) - 40 - angleOffset,
        }
      : trajectoryId === 'hohmann'
      ? {
          x: (earthPos.x + targetPlanetPos.x) / 2,
          y: Math.min(earthPos.y, targetPlanetPos.y) - 125 - angleOffset,
        }
      : {
          x: (earthPos.x + targetPlanetPos.x) / 2 + 40,
          y: Math.max(earthPos.y, targetPlanetPos.y) + 135 - angleOffset,
        };

  const orbitT = Math.max(0, Math.min(1, (progress - 0.32) / 0.68));
  const shipOrbitX =
    (1 - orbitT) * (1 - orbitT) * earthPos.x +
    2 * (1 - orbitT) * orbitT * curveCtrl.x +
    orbitT * orbitT * targetPlanetPos.x;
  const shipOrbitY =
    (1 - orbitT) * (1 - orbitT) * earthPos.y +
    2 * (1 - orbitT) * orbitT * curveCtrl.y +
    orbitT * orbitT * targetPlanetPos.y;

  const incompleteSteps = prepSteps.filter((s) => !s.done);

  return (
    <div className="min-h-screen w-full bg-[#091428] text-white flex flex-col justify-between select-none">
      {/* SPACE FLIGHT SIMULATOR (SFS) TOP TELEMETRY HUD BAR */}
      <header className="bg-[#112240] border-b-4 border-[#3b82f6] px-5 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-xl">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onGoToPage('food')}
            className="px-4 py-1.5 rounded-full bg-white text-[#1e3a8a] font-black text-xs flex items-center gap-1.5 border-2 border-[#60a5fa] hover:bg-blue-50 transition"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Food
          </button>
          <div className="px-4 py-1.5 rounded-full bg-[#1e3a8a] border-2 border-[#60a5fa] font-black text-sm text-white">
            🪐 SFS Flight Computer — Target: {mission.name}
          </div>
        </div>

        {/* SFS Style Digital Readout Boxes */}
        <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
          <div className="bg-[#0a192f] border-2 border-[#3b82f6] rounded-xl px-3 py-1">
            <span className="text-slate-400 block text-[10px]">ALTITUDE</span>
            <span className="font-bold text-cyan-300 text-sm">
              {Number(altitudeKm).toLocaleString()} km
            </span>
          </div>
          <div className="bg-[#0a192f] border-2 border-[#3b82f6] rounded-xl px-3 py-1">
            <span className="text-slate-400 block text-[10px]">VELOCITY</span>
            <span className="font-bold text-emerald-400 text-sm">
              {velocityMs.toLocaleString()} m/s
            </span>
          </div>
          <div className="bg-[#0a192f] border-2 border-[#3b82f6] rounded-xl px-3 py-1 min-w-[125px]">
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>LIQUID FUEL</span>
              <span className="text-amber-300 font-bold">{fuelRemainingPct}%</span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mt-1">
              <div
                className="h-full bg-amber-400 transition-all duration-150"
                style={{ width: `${fuelRemainingPct}%` }}
              />
            </div>
          </div>
          <div className="bg-[#0a192f] border-2 border-[#3b82f6] rounded-xl px-3 py-1">
            <span className="text-slate-400 block text-[10px]">TRAJECTORY ACC.</span>
            <span
              className={`font-black text-sm ${
                isTrajectoryAcceptable ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {trajectoryAccuracyPct}% {isTrajectoryAcceptable ? '(≥40% OK)' : '(<40% WARN)'}
            </span>
          </div>
        </div>

        <button
          onClick={onExitGame}
          className="px-4 py-1.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-black text-xs border-2 border-rose-300 flex items-center gap-1.5"
        >
          <LogOut className="w-4 h-4" /> Exit Game
        </button>
      </header>

      {/* MOBILE-ONLY CAMERA VIEW SWITCHER (<1024px) */}
      <div className="lg:hidden max-w-[1550px] w-full mx-auto px-4 pt-3">
        <div className="grid grid-cols-3 gap-1.5 bg-[#112240] p-1.5 rounded-2xl border-2 border-[#3b82f6]">
          <button
            type="button"
            onClick={() => setMobileCamView('both')}
            className={`py-1.5 rounded-xl font-black text-xs transition ${
              mobileCamView === 'both'
                ? 'bg-[#2563eb] text-white'
                : 'text-blue-200'
            }`}
          >
            📺 Split View
          </button>
          <button
            type="button"
            onClick={() => setMobileCamView('sfs')}
            className={`py-1.5 rounded-xl font-black text-xs transition ${
              mobileCamView === 'sfs'
                ? 'bg-[#2563eb] text-white'
                : 'text-blue-200'
            }`}
          >
            🚀 SFS Cam
          </button>
          <button
            type="button"
            onClick={() => setMobileCamView('solar')}
            className={`py-1.5 rounded-xl font-black text-xs transition ${
              mobileCamView === 'solar'
                ? 'bg-[#2563eb] text-white'
                : 'text-blue-200'
            }`}
          >
            🌌 Solar Map
          </button>
        </div>
      </div>

      {/* MAIN SFS SPLIT VIEWPORT */}
      <div className="flex-1 max-w-[1550px] w-full mx-auto p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* LEFT COLUMN (4 cols): SPACE FLIGHT SIMULATOR 2D VERTICAL ASCENT VIEW */}
        <div
          className={`${
            mobileCamView === 'solar' ? 'hidden lg:flex' : 'flex'
          } lg:col-span-4 rounded-3xl border-4 border-[#60a5fa] overflow-hidden relative shadow-2xl flex-col justify-between bg-gradient-to-b from-[#060d1f] via-[#133b7a] to-[#3b82f6] max-h-[300px] sm:max-h-none`}
        >
          <div className="p-3 bg-slate-950/60 backdrop-blur border-b border-blue-400/30 flex items-center justify-between text-xs font-black">
            <span className="text-cyan-300">
              🚀 SFS STAGE CAM //{' '}
              {progress === 0
                ? 'PAD STANDBY'
                : progress < 0.35
                ? 'ATMOSPHERIC LIFTOFF'
                : 'DEEP SPACE CRUISE'}
            </span>
            <span className="px-2 py-0.5 rounded bg-blue-500/30 text-blue-200 font-mono">
              Pitch: {launchAngleDeg}°
            </span>
          </div>

          <svg viewBox="0 0 360 440" className="w-full flex-1">
            {[
              [40, 40],
              [120, 28],
              [260, 52],
              [310, 30],
              [80, 95],
              [210, 88],
              [320, 120],
              [55, 160],
              [285, 175],
            ].map(([sx, sy], i) => (
              <circle
                key={i}
                cx={sx}
                cy={(sy + progress * 180) % 280}
                r={i % 2 === 0 ? 2 : 1.3}
                fill="#ffffff"
                opacity="0.85"
              />
            ))}

            {/* Launchpad Ground */}
            <g transform={`translate(0, ${Math.min(260, progress * 650)})`}>
              <rect x="0" y="370" width="360" height="90" fill="#eab308" />
              <rect x="70" y="362" width="220" height="14" rx="4" fill="#475569" />
              <rect
                x="95"
                y="215"
                width="18"
                height="148"
                fill="none"
                stroke="#64748b"
                strokeWidth="3"
              />
              <line x1="95" y1="245" x2="113" y2="245" stroke="#64748b" strokeWidth="2" />
              <line x1="95" y1="285" x2="113" y2="285" stroke="#64748b" strokeWidth="2" />
              <line x1="95" y1="325" x2="113" y2="325" stroke="#64748b" strokeWidth="2" />
            </g>

            {/* The 2D SFS Rocket */}
            <g
              transform={`translate(180, ${
                progress === 0 ? 295 : 230
              }) rotate(${
                progress > 0.05 ? (90 - launchAngleDeg) * 0.65 : 0
              })`}
            >
              {simState === 'flying' && (
                <g>
                  <polygon
                    points="-18,38 18,38 0,115"
                    fill="#f97316"
                    opacity="0.95"
                  />
                  <polygon points="-10,38 10,38 0,85" fill="#fef08a" />
                </g>
              )}

              {simState === 'crashed' && (
                <g>
                  <circle cx="0" cy="0" r="56" fill="#ef4444" opacity="0.85" />
                  <circle cx="0" cy="0" r="36" fill="#f59e0b" />
                  <circle cx="0" cy="0" r="18" fill="#fef08a" />
                </g>
              )}

              <polygon points="-22,-15 -48,25 -22,12" fill={fins.color} />
              <polygon points="22,-15 48,25 22,12" fill={fins.color} />
              <polygon points="-16,12 16,12 22,38 -22,38" fill={engine.color} />
              <rect
                x="-22"
                y="-78"
                width="44"
                height="90"
                rx="4"
                fill="#f8fafc"
                stroke={coating.color}
                strokeWidth="4"
              />
              <rect x="-22" y="-66" width="44" height="8" fill={tank.color} />
              <circle cx="0" cy="-34" r="11" fill="#38bdf8" stroke="#1d4ed8" strokeWidth="3" />
              <path
                d="M 0 -132 Q 22 -98 22 -78 L -22 -78 Q -22 -98 0 -132 Z"
                fill={nose.color}
              />
            </g>
          </svg>

          <div className="p-3 bg-slate-950/80 border-t border-blue-400/30 flex items-center justify-between text-xs font-mono">
            <span className="text-slate-300">
              ENGINE: <strong className="text-amber-300">{engine.name} ({engine.thrustKn} kN)</strong>
            </span>
            <span className="text-cyan-300">
              COAT: <strong>{coating.name}</strong>
            </span>
          </div>
        </div>

        {/* RIGHT COLUMN (8 cols): SOLAR SYSTEM TRAJECTORY MAP & LAUNCH ANGLE SETUP */}
        <div className="lg:col-span-8 flex flex-col justify-between space-y-4">
          {/* 1. Interactive Solar System Orbital Map */}
          <div
            className={`${
              mobileCamView === 'sfs' ? 'hidden lg:block' : 'block'
            } relative rounded-3xl border-4 border-[#60a5fa] bg-[#070f22] overflow-hidden shadow-2xl h-[240px] sm:h-[330px]`}
          >
            <div className="absolute top-3 left-4 right-4 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
              <span className="px-3 py-1 rounded-full bg-white/95 text-[#1e3a8a] font-black text-xs shadow">
                🌌 Solar System Trajectory Map (Earth → {mission.name})
              </span>
              <span className="px-3 py-1 rounded-full bg-[#1e3a8a]/90 border border-[#60a5fa] text-cyan-200 font-bold text-xs">
                Distance: {mission.distanceKm} • Temp: {mission.avgTemp}
              </span>
            </div>

            <svg viewBox="0 0 920 350" className="w-full h-full">
              {[
                [70, 50],
                [190, 40],
                [310, 75],
                [460, 45],
                [640, 60],
                [770, 40],
                [860, 90],
                [150, 310],
                [420, 300],
                [690, 315],
                [840, 295],
              ].map(([x, y], idx) => (
                <circle key={idx} cx={x} cy={y} r="1.6" fill="#e2e8f0" opacity="0.6" />
              ))}

              {/* Sun */}
              <circle cx="55" cy="250" r="46" fill="#f59e0b" />
              <circle cx="55" cy="250" r="58" fill="#fbbf24" opacity="0.25" />
              <text x="55" y="322" textAnchor="middle" fill="#fde047" fontSize="12" fontWeight="800">
                SUN
              </text>

              {/* Orbital Rings */}
              <ellipse
                cx="55"
                cy="250"
                rx="155"
                ry="110"
                fill="none"
                stroke="#1e3a8a"
                strokeWidth="2"
                strokeDasharray="6 6"
              />
              <ellipse
                cx="55"
                cy="250"
                rx="505"
                ry="190"
                fill="none"
                stroke="#1e3a8a"
                strokeWidth="2"
                strokeDasharray="6 6"
              />
              <ellipse
                cx="55"
                cy="250"
                rx="755"
                ry="235"
                fill="none"
                stroke="#1e3a8a"
                strokeWidth="2"
                strokeDasharray="6 6"
              />

              {/* Optimal Reference Corridor */}
              <path
                d={`M ${earthPos.x} ${earthPos.y} Q ${
                  (earthPos.x + targetPlanetPos.x) / 2
                } ${
                  mission.optimalTrajectoryId === 'direct'
                    ? Math.min(earthPos.y, targetPlanetPos.y) - 40
                    : mission.optimalTrajectoryId === 'hohmann'
                    ? Math.min(earthPos.y, targetPlanetPos.y) - 125
                    : Math.max(earthPos.y, targetPlanetPos.y) + 135
                } ${targetPlanetPos.x} ${targetPlanetPos.y}`}
                fill="none"
                stroke="#10b981"
                strokeWidth="8"
                opacity="0.18"
              />

              {/* Player's Selected Trajectory Curve */}
              <path
                d={`M ${earthPos.x} ${earthPos.y} Q ${curveCtrl.x} ${curveCtrl.y} ${targetPlanetPos.x} ${targetPlanetPos.y}`}
                fill="none"
                stroke={isTrajectoryAcceptable ? '#38bdf8' : '#f43f5e'}
                strokeWidth="3.5"
                strokeDasharray="10 6"
              />

              {/* Earth */}
              <g transform={`translate(${earthPos.x}, ${earthPos.y})`}>
                <circle r="20" fill="#2563eb" stroke="#93c5fd" strokeWidth="3" />
                <circle cx="-5" cy="-4" r="6" fill="#22c55e" />
                <circle cx="6" cy="5" r="5" fill="#22c55e" />
                <line
                  x1="0"
                  y1="0"
                  x2={Math.cos((launchAngleDeg * Math.PI) / 180) * 42}
                  y2={-Math.sin((launchAngleDeg * Math.PI) / 180) * 42}
                  stroke="#facc15"
                  strokeWidth="3"
                />
                <text y="36" textAnchor="middle" fill="#93c5fd" fontSize="12" fontWeight="900">
                  EARTH ({launchAngleDeg}°)
                </text>
              </g>

              {/* Moon */}
              <g transform="translate(350, 175)">
                <circle
                  r={mission.id === 'moon' ? 16 : 10}
                  fill="#cbd5e1"
                  stroke={mission.id === 'moon' ? '#facc15' : 'none'}
                  strokeWidth="3"
                />
                <text y="30" textAnchor="middle" fill="#cbd5e1" fontSize="11" fontWeight="800">
                  1) MOON
                </text>
              </g>

              {/* Mars */}
              <g transform="translate(560, 210)">
                <circle
                  r={mission.id === 'mars' ? 20 : 14}
                  fill="#ea580c"
                  stroke={mission.id === 'mars' ? '#facc15' : 'none'}
                  strokeWidth="3"
                />
                <text y="34" textAnchor="middle" fill="#fdba74" fontSize="11" fontWeight="800">
                  2) MARS
                </text>
              </g>

              {/* Jupiter */}
              <g transform="translate(675, 290)">
                <circle r="18" fill="#d97706" opacity="0.85" />
                <text y="30" textAnchor="middle" fill="#fcd34d" fontSize="10" fontWeight="700">
                  JUPITER (ASSIST)
                </text>
              </g>

              {/* Neptune */}
              <g transform="translate(810, 185)">
                <circle
                  r={mission.id === 'neptune' ? 24 : 17}
                  fill="#3b82f6"
                  stroke={mission.id === 'neptune' ? '#facc15' : 'none'}
                  strokeWidth="3"
                />
                <text y="38" textAnchor="middle" fill="#93c5fd" fontSize="11" fontWeight="800">
                  3) NEPTUNE
                </text>
              </g>

              {/* Animated Spacecraft Icon */}
              {progress > 0.3 && (
                <g transform={`translate(${shipOrbitX}, ${shipOrbitY})`}>
                  <circle
                    r="12"
                    fill={simState === 'crashed' ? '#ef4444' : '#f59e0b'}
                    opacity="0.35"
                  />
                  <circle
                    r="6"
                    fill={simState === 'crashed' ? '#ef4444' : '#fef08a'}
                  />
                  <text y="-14" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="900">
                    {simState === 'crashed' ? '💥 CRASH' : '🚀 ROCKET'}
                  </text>
                </g>
              )}
            </svg>
          </div>

          {/* 2. Pre-Flight Launch Angle & Trajectory Selector Card */}
          <div className="bg-white/95 border-4 border-[#93c5fd] rounded-3xl p-5 shadow-2xl text-[#1e3a8a] space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black text-[#1e3a8a] flex items-center gap-2">
                    <Compass className="w-5 h-5 text-[#2563eb]" /> Pre-Flight Launch Angle & Trajectory Setup
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-900 font-black text-xs">
                    🎖️ Commander Role ({commanderOwner})
                  </span>
                </div>
                <p className="text-xs font-bold text-slate-500">
                  Set launch angle & path (≥40% accuracy required). The rocket can only launch when the Top Mission Prep Bar reaches 100%!
                </p>
              </div>
              <div
                className={`px-4 py-1.5 rounded-full font-black text-xs border-2 ${
                  isTrajectoryAcceptable
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-400'
                    : 'bg-rose-100 text-rose-800 border-rose-400'
                }`}
              >
                Accuracy: {trajectoryAccuracyPct}%{' '}
                {isTrajectoryAcceptable ? '✓ (≥40% Passes!)' : '⚠️ (<40% Off-Course)'}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              {/* Launch Angle Slider */}
              <div className="md:col-span-5 bg-[#eff6ff] p-4 rounded-2xl border-2 border-[#bfdbfe]">
                <div className="flex items-center justify-between text-xs font-black mb-2">
                  <span>LAUNCH PITCH ANGLE (0°–90°)</span>
                  <span className="text-base text-[#2563eb]">{launchAngleDeg}°</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="90"
                  value={launchAngleDeg}
                  disabled={simState === 'flying' || !canEditCommander}
                  onChange={(e) => onChangeAngle(Number(e.target.value))}
                  className="w-full h-3 accent-[#2563eb] cursor-pointer touch-pan-x"
                />
                <div className="flex justify-between text-[10px] font-bold text-slate-500 mt-1">
                  <span>Flat (10°)</span>
                  <span>Optimal: {mission.optimalAngleDeg}°</span>
                  <span>Vertical (90°)</span>
                </div>
              </div>

              {/* 3 Trajectory Path Options */}
              <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {TRAJECTORY_PATHS.map((path) => {
                  const selected = trajectoryId === path.id;
                  const isWalkthroughTarget =
                    walkthroughStep === 7 && path.id === mission.optimalTrajectoryId;
                  return (
                    <button
                      key={path.id}
                      type="button"
                      disabled={simState === 'flying' || !canEditCommander}
                      onClick={() => {
                        onChangeTrajectory(path.id);
                        if (isWalkthroughTarget && onWalkthroughStepComplete) {
                          onWalkthroughStepComplete(7);
                        }
                      }}
                      className={`p-3 rounded-2xl border-2 text-left transition ${
                        isWalkthroughTarget
                          ? 'bg-[#fef08a] border-[#eab308] ring-4 ring-[#facc15] shadow-[0_0_25px_rgba(250,204,21,0.9)]'
                          : selected
                          ? 'bg-[#fef9c3] border-[#f59e0b] shadow-md'
                          : 'bg-[#f8fafc] border-[#e2e8f0] hover:border-[#93c5fd]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-lg">{path.icon}</span>
                        {isWalkthroughTarget && (
                          <span className="px-2 py-0.5 rounded-full bg-[#1e3a8a] text-[#fef08a] font-black text-[9px] uppercase">
                            👆 STEP 7
                          </span>
                        )}
                      </div>
                      <div className="text-xs font-black text-[#1e3a8a] mt-1">
                        {path.name}
                      </div>
                      <div className="text-[10px] font-semibold text-slate-500 mt-0.5 leading-snug">
                        {path.shortDesc}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Educational Trajectory Suggestion Box */}
            {!isTrajectoryAcceptable ? (
              <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-400 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-xs font-black text-amber-900 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>
                      TRAJECTORY SUGGESTION (Accuracy {trajectoryAccuracyPct}% is below 40% threshold!):
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleApplySuggestedTrajectory}
                    className="px-3.5 py-1 rounded-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-black text-xs flex items-center gap-1 shadow"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Auto-Fix to {mission.optimalAngleDeg}° &{' '}
                    {optimalTrajectoryObj.name}
                  </button>
                </div>
                <p className="text-xs font-bold text-amber-900">
                  👉 Suggested Change: Set Launch Angle near{' '}
                  <strong>{mission.optimalAngleDeg}°</strong> and choose{' '}
                  <strong>{optimalTrajectoryObj.name}</strong>.
                </p>
                <ul className="list-disc list-inside text-[11px] font-semibold text-slate-700 space-y-0.5">
                  {mission.scientificFacts.map((fact, i) => (
                    <li key={i}>{fact}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="p-3 rounded-2xl bg-emerald-50 border-2 border-emerald-300 flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-emerald-900">
                <span>
                  ✅ Trajectory Accuracy ({trajectoryAccuracyPct}%) is above the 40% safety threshold! Fact:{' '}
                  {mission.scientificFacts[0]}
                </span>
              </div>
            )}

            {/* Mission Prep Lock Notice & Launch Button */}
            <div className="pt-2 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                {!isPrepFull ? (
                  <div className="space-y-1">
                    <div className="text-xs font-black text-rose-600 flex items-center gap-1.5">
                      <Lock className="w-4 h-4" />
                      <span>
                        LAUNCH LOCKED — MISSION PREP BAR IS AT {prepProgressPct}% (MUST BE 100% FULL):
                      </span>
                    </div>
                    <div className="text-[11px] font-bold text-slate-600">
                      Missing:{' '}
                      {incompleteSteps.map((s) => `${s.label} (${s.hint})`).join(' • ')}
                    </div>
                    <label className="inline-flex items-center gap-1.5 text-[11px] font-extrabold text-amber-800 cursor-pointer pt-0.5">
                      <input
                        type="checkbox"
                        checked={forceTestCrashMode}
                        onChange={(e) => setForceTestCrashMode(e.target.checked)}
                      />
                      <span>Override Lock to Test Crash Simulation Anyway</span>
                    </label>
                  </div>
                ) : (
                  <div className="text-xs font-black text-emerald-700">
                    🌟 MISSION PREP 100% FULL! All 4 Role Stations Ready for Liftoff!
                  </div>
                )}
              </div>

              <button
                type="button"
                disabled={simState === 'flying' || !canLaunchRocket}
                onClick={handleStartFlight}
                className={`relative px-8 py-4 rounded-full font-black text-base border-2 shadow-xl flex items-center justify-center gap-2 transition transform active:scale-95 ${
                  walkthroughStep === 8 && canLaunchRocket
                    ? 'bg-[#fef08a] hover:bg-[#eab308] text-[#1e3a8a] border-[#d97706] ring-4 ring-[#facc15] shadow-[0_0_30px_rgba(250,204,21,0.95)]'
                    : canLaunchRocket
                    ? 'bg-[#f59e0b] hover:bg-[#eab308] text-[#1e3a8a] border-[#d97706]'
                    : 'bg-slate-200 text-slate-400 border-slate-300 cursor-not-allowed'
                }`}
              >
                {canLaunchRocket ? <Rocket className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                <span>
                  {simState === 'flying'
                    ? '🚀 Rocket in Flight...'
                    : canLaunchRocket
                    ? `🔥 Ignite Engines & Launch (${prepProgressPct}%)!`
                    : `Locked: Prep ${prepProgressPct}% / 100%`}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CRASH / MISSION FAILED MODAL */}
      {simState === 'crashed' && primaryFailure && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white border-4 border-rose-500 rounded-3xl max-w-xl w-full p-6 shadow-2xl text-[#1e3a8a] space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-rose-100 border-2 border-rose-400 flex items-center justify-center text-3xl shrink-0">
                💥
              </div>
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-rose-600 text-white font-black text-[10px] uppercase">
                  MISSION FAILED // CRASH REPORT
                </span>
                <h3 className="text-xl font-black text-rose-700 mt-1">
                  {primaryFailure.title}
                </h3>
              </div>
            </div>

            <div className="bg-rose-50 border-2 border-rose-200 rounded-2xl p-4 space-y-2">
              <div className="text-xs font-black uppercase text-rose-800">
                Why Your Spacecraft Crashed / Failed:
              </div>
              <p className="text-sm font-bold text-slate-800 leading-relaxed">
                {primaryFailure.explanation}
              </p>
              <div className="pt-2 border-t border-rose-200 text-xs font-extrabold text-[#1d4ed8]">
                💡 How to Fix It: {primaryFailure.fixHint}
              </div>
            </div>

            <div className="space-y-2.5 pt-2">
              {primaryFailure.redirectTo === 'food' && (
                <button
                  onClick={() => onGoToPage('food')}
                  className="w-full py-3.5 rounded-full bg-[#f59e0b] hover:bg-[#eab308] text-[#1e3a8a] font-black text-sm border-2 border-[#d97706] shadow-lg flex items-center justify-center gap-2"
                >
                  <Utensils className="w-4 h-4" /> Take Me Back to Astronaut Food Page to Fix
                </button>
              )}

              {primaryFailure.redirectTo === 'rocket' && (
                <button
                  onClick={() => onGoToPage('rocket')}
                  className="w-full py-3.5 rounded-full bg-[#f59e0b] hover:bg-[#eab308] text-[#1e3a8a] font-black text-sm border-2 border-[#d97706] shadow-lg flex items-center justify-center gap-2"
                >
                  <Wrench className="w-4 h-4" /> Take Me Back to Rocket Builder Page to Fix
                </button>
              )}

              {primaryFailure.redirectTo === 'trajectory' && (
                <button
                  onClick={() => {
                    handleApplySuggestedTrajectory();
                    setSimState('prelaunch');
                    setProgress(0);
                  }}
                  className="w-full py-3.5 rounded-full bg-[#f59e0b] hover:bg-[#eab308] text-[#1e3a8a] font-black text-sm border-2 border-[#d97706] shadow-lg flex items-center justify-center gap-2"
                >
                  <Compass className="w-4 h-4" /> Fix Launch Angle & Trajectory Now
                </button>
              )}

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => onGoToPage('hub')}
                  className="py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-[#1e3a8a] font-extrabold text-xs"
                >
                  Return to Mission Hub
                </button>
                <button
                  onClick={onExitGame}
                  className="py-2.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs flex items-center justify-center gap-1"
                >
                  <LogOut className="w-3.5 h-3.5" /> Save & Exit Game
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MISSION SUCCESS MODAL */}
      {simState === 'success' && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white border-4 border-emerald-400 rounded-3xl max-w-xl w-full p-6 shadow-2xl text-[#1e3a8a] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-emerald-100 border-2 border-emerald-400 flex items-center justify-center text-3xl">
                  🏆
                </div>
                <div>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white font-black text-[10px] uppercase">
                    MISSION ACCOMPLISHED!
                  </span>
                  <h3 className="text-2xl font-black text-[#1e3a8a] mt-0.5">
                    {mission.name} Touchdown!
                  </h3>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-black uppercase text-slate-400">
                  SCORE EARNED
                </div>
                <div className="text-3xl font-black text-[#d97706]">
                  +{totalMissionScore}
                </div>
              </div>
            </div>

            <div className="bg-[#eff6ff] border-2 border-[#bfdbfe] rounded-2xl p-4 space-y-2 text-xs font-bold">
              <div className="flex justify-between">
                <span className="text-slate-600">Science Experiments Score:</span>
                <span className="font-black text-emerald-700">+{experimentsScore} pts</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Astronaut Food & Morale Bonus:</span>
                <span className="font-black text-emerald-700">+{foodMoraleScore} pts</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Shared Budget Efficiency Bonus:</span>
                <span className="font-black text-emerald-700">+{budgetEfficiencyBonus} pts</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">
                  Trajectory Accuracy ({trajectoryAccuracyPct}%):
                </span>
                <span className="font-black text-[#2563eb]">
                  +{Math.round(trajectoryAccuracyPct * 3)} pts
                </span>
              </div>
              <div className="pt-2 border-t border-blue-200 flex justify-between text-sm font-black text-[#1e3a8a]">
                <span>Total Added to Profile:</span>
                <span className="text-emerald-600">+{totalMissionScore} pts (Saved!)</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => onGoToPage('hub')}
                className="py-3.5 rounded-full bg-[#f59e0b] hover:bg-[#eab308] text-[#1e3a8a] font-black text-sm border-2 border-[#d97706] shadow-lg flex items-center justify-center gap-1.5"
              >
                <Award className="w-4 h-4" /> Choose Next Mission
              </button>
              <button
                onClick={onExitGame}
                className="py-3.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-black text-sm border-2 border-rose-300 shadow-lg flex items-center justify-center gap-1.5"
              >
                <LogOut className="w-4 h-4" /> Save & Exit Game
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
