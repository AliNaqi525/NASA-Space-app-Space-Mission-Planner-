import React, { useState, useEffect } from 'react';
import SpaceportScene from './SpaceportScene.jsx';
import {
  MISSIONS,
  ROCKET_PARTS,
  SCIENCE_EXPERIMENTS,
} from '../data/missionCatalog.js';
import { Home, Check, Grid, Sun, Lock } from 'lucide-react';

export default function RocketBuilderPage({
  evaluation,
  build,
  onUpdateBuild,
  onResetBuild,
  onConfirmBuild,
  onBackToHub,
  onSelectMission,
  room,
  myAssignedRoles = ['commander', 'propulsion', 'payload', 'lifesupport'],
  walkthroughStep = 0,
  onWalkthroughStepComplete,
}) {
  const [blueprintGridMode, setBlueprintGridMode] = useState(false);
  // Mobile-only tab state ('parts' | 'rocket' | 'stats'); Desktop shows all 3 columns simultaneously
  const [mobileTab, setMobileTab] = useState('parts');

  useEffect(() => {
    if (walkthroughStep >= 2 && walkthroughStep <= 4) {
      setMobileTab('parts');
    }
  }, [walkthroughStep]);

  const {
    mission,
    nose,
    tank,
    coating,
    fins,
    engine,
    selectedExperiments,
    rocketCost,
    remainingBudget,
    totalWeightTons,
    thrustKn,
    stabilityPct,
    experimentsScore,
  } = evaluation;

  const budgetSpentPct = Math.min(
    100,
    Math.round((evaluation.totalSpent / mission.budget) * 100)
  );

  const canEditRole = (roleId) => {
    if (!room || !room.strictRoleLock) return true;
    return myAssignedRoles.includes(roleId);
  };

  const getRoleOwnerName = (roleId) => {
    if (!room) return 'You';
    const owner = room.players.find((p) =>
      (p.assignedRoles || []).includes(roleId)
    );
    return owner ? owner.username : 'Teammate';
  };

  const toggleExperiment = (expId) => {
    if (!canEditRole('payload')) return;
    const current = build.experimentIds || [];
    const exists = current.includes(expId);
    const next = exists
      ? current.filter((id) => id !== expId)
      : [...current, expId];
    const expObj = SCIENCE_EXPERIMENTS.find((e) => e.id === expId);
    onUpdateBuild(
      { experimentIds: next },
      `${exists ? 'Removed' : 'Installed'} ${expObj?.name || 'Experiment'}`
    );
  };

  const tankBodyHeight =
    tank.id === 'tank_small' ? 125 : tank.id === 'tank_medium' ? 155 : 185;

  return (
    <SpaceportScene showCharacter={false} showTowers={true}>
      {/* Optional 2D Blueprint Grid Overlay when toggled */}
      {blueprintGridMode && (
        <div
          className="pointer-events-none absolute inset-0 z-10 opacity-45"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(255,255,255,0.35) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.35) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
            backgroundColor: 'rgba(15, 45, 110, 0.35)',
          }}
        />
      )}

      {/* TOP BAR (Exact match to PDF Page 1) */}
      <div className="relative z-20 w-full max-w-[1550px] mx-auto px-5 pt-3 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Circular Navy Home Button & Mission Switcher */}
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToHub}
            title="Back to Spaceport Hub"
            className="w-12 h-12 p-3 rounded-full bg-[#1e3a8a] hover:bg-[#1d4ed8] border-4 border-[#60a5fa] shadow-lg text-white flex items-center justify-center transition transform hover:scale-105"
          >
            <Home className="w-6 h-6" />
          </button>

          {/* Quick Mission Tabs */}
          <div className="hidden sm:flex bg-white/95 border-4 border-[#93c5fd] rounded-full p-1 shadow-md">
            {MISSIONS.map((m) => (
              <button
                key={m.id}
                onClick={() => canEditRole('commander') && onSelectMission(m.id)}
                className={`px-3.5 py-1 rounded-full text-xs font-black transition ${
                  m.id === mission.id
                    ? 'bg-[#2563eb] text-white shadow'
                    : 'text-[#1e3a8a] hover:bg-blue-50'
                }`}
              >
                {m.id === 'moon' ? '🌕 Moon' : m.id === 'mars' ? '🔴 Mars' : '🔵 Neptune'}
              </button>
            ))}
          </div>
        </div>

        {/* Center: "Rocket Builder" Pill */}
        <div className="bg-white/95 border-4 border-[#93c5fd] rounded-full px-8 py-2 shadow-xl flex items-center gap-2.5">
          <span className="text-[#2563eb] text-lg">🚀</span>
          <span className="font-black text-lg text-[#1e3a8a] tracking-tight">
            Rocket Builder — {mission.name}
          </span>
        </div>

        {/* Right: Remaining Shared Budget Pill & Blueprint Toggle Button */}
        <div className="flex items-center gap-3">
          <div className="bg-white/95 border-4 border-[#93c5fd] rounded-full px-5 py-1.5 shadow-xl flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#f59e0b] border-2 border-[#fde047] flex items-center justify-center text-white font-black text-base shadow-inner">
              $
            </div>
            <div>
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 leading-none">
                REMAINING
              </div>
              <div
                className={`text-base font-black leading-tight ${
                  remainingBudget < 0 ? 'text-rose-600' : 'text-[#1e3a8a]'
                }`}
              >
                ${remainingBudget.toLocaleString()}
              </div>
            </div>
          </div>

          <button
            onClick={() => setBlueprintGridMode((b) => !b)}
            title="Toggle 2D Blueprint Grid Overlay"
            className="w-12 h-12 p-3 rounded-full bg-[#1e3a8a] hover:bg-[#1d4ed8] border-4 border-[#60a5fa] shadow-lg text-white flex items-center justify-center transition transform hover:scale-105"
          >
            {blueprintGridMode ? <Sun className="w-5 h-5 text-amber-300" /> : <Grid className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* MOBILE-ONLY SEGMENTED TAB SWITCHER & LIVE QUICK-CONFIRM BAR (<1024px) */}
      <div className="lg:hidden relative z-20 w-full max-w-[1550px] mx-auto px-4 pt-2 space-y-2">
        <div className="grid grid-cols-3 gap-1.5 bg-white/95 p-1.5 rounded-2xl border-2 border-[#60a5fa] shadow-lg">
          <button
            type="button"
            onClick={() => setMobileTab('parts')}
            className={`py-2 rounded-xl font-black text-xs transition ${
              mobileTab === 'parts'
                ? 'bg-[#2563eb] text-white shadow'
                : 'text-[#1e3a8a]'
            }`}
          >
            🛠️ 1. Parts
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('rocket')}
            className={`py-2 rounded-xl font-black text-xs transition ${
              mobileTab === 'rocket'
                ? 'bg-[#2563eb] text-white shadow'
                : 'text-[#1e3a8a]'
            }`}
          >
            🚀 2. 2D Rocket
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('stats')}
            className={`py-2 rounded-xl font-black text-xs transition ${
              mobileTab === 'stats'
                ? 'bg-[#2563eb] text-white shadow'
                : 'text-[#1e3a8a]'
            }`}
          >
            📊 3. Stats
          </button>
        </div>

        {/* Compact Mobile Live Stats + One-Tap Confirm Button */}
        <div className="bg-[#1e3a8a]/95 text-white border-2 border-[#60a5fa] rounded-2xl px-3 py-2 flex items-center justify-between gap-2 text-[11px] font-bold shadow">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span>⚡ {thrustKn}kN</span>
            <span>⚖️ {totalWeightTons}t</span>
            <span>🎯 {stabilityPct}%</span>
          </div>
          <button
            type="button"
            onClick={() => {
              if (walkthroughStep === 4 && onWalkthroughStepComplete) {
                onWalkthroughStepComplete(4);
              } else {
                onConfirmBuild();
              }
            }}
            className="px-3.5 py-1.5 rounded-full bg-[#f59e0b] text-[#1e3a8a] font-black text-xs border border-white shrink-0 shadow"
          >
            Confirm → Food
          </button>
        </div>
      </div>

      {/* MAIN 3-COLUMN BUILDER WORKSPACE (Matches PDF Layout on Desktop, Tabbed on Phone) */}
      <div className="relative z-20 flex-1 max-w-[1550px] w-full mx-auto px-4 sm:px-5 py-3 grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch lg:items-center">
        {/* ====================================================
            LEFT PANEL: PART & SCIENCE EXPERIMENT SELECTOR CARD
           ==================================================== */}
        <div
          className={`${
            mobileTab === 'parts' ? 'flex' : 'hidden lg:flex'
          } lg:col-span-4 lg:mt-14 bg-white/95 backdrop-blur-md border-4 border-[#93c5fd] rounded-3xl p-4 sm:p-5 shadow-2xl flex-col justify-between lg:max-h-[68vh] overflow-y-auto space-y-4`}
        >
          {/* 1. NOSE CONE (Payload & Aero Role) */}
          <div className={!canEditRole('payload') ? 'opacity-60' : ''}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#1e3a8a]">
                NOSE CONE
              </h3>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                🔬 Aero Role ({getRoleOwnerName('payload')})
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              {ROCKET_PARTS.nose.map((item) => {
                const selected = build.noseId === item.id;
                const isHighlight =
                  walkthroughStep === 3 && item.id === 'nose_aero';
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (!canEditRole('payload')) return;
                      onUpdateBuild(
                        { noseId: item.id },
                        `Selected Nose: ${item.name} ($${item.cost.toLocaleString()})`
                      );
                      if (isHighlight && onWalkthroughStepComplete) {
                        onWalkthroughStepComplete(3);
                      }
                    }}
                    className={`relative cursor-pointer rounded-2xl p-2.5 border-2 text-center transition flex flex-col items-center justify-between ${
                      isHighlight
                        ? 'bg-[#fef08a] border-[#eab308] ring-4 ring-[#facc15] shadow-[0_0_25px_rgba(250,204,21,0.9)]'
                        : selected
                        ? 'bg-[#fef9c3] border-[#f59e0b] shadow-md'
                        : 'bg-[#f8fafc] border-[#e2e8f0] hover:border-[#93c5fd]'
                    }`}
                  >
                    {isHighlight && (
                      <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 z-10 px-2 py-0.2 rounded-full bg-[#1e3a8a] text-[#fef08a] font-black text-[8px] uppercase whitespace-nowrap shadow">
                        👆 STEP 3
                      </span>
                    )}
                    {selected && (
                      <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </span>
                    )}
                    <svg className="w-9 h-10 my-1" viewBox="0 0 40 48">
                      <path
                        d="M 20 4 Q 34 24 34 44 L 6 44 Q 6 24 20 4 Z"
                        fill={item.color}
                      />
                    </svg>
                    <div className="text-xs font-extrabold text-[#1e3a8a] leading-tight">
                      {item.name}
                    </div>
                    <div className="text-xs font-black text-[#1e3a8a]">
                      ${item.cost.toLocaleString()}
                    </div>
                    <div className="text-[10px] font-bold text-slate-500">
                      {item.statLabel}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. FUEL TANK (Propulsion Role) */}
          <div className={!canEditRole('propulsion') ? 'opacity-60' : ''}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#1e3a8a]">
                FUEL TANK
              </h3>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">
                🚀 Propulsion Role ({getRoleOwnerName('propulsion')})
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              {ROCKET_PARTS.tank.map((item) => {
                const selected = build.tankId === item.id;
                const isHighlight =
                  walkthroughStep === 2 && item.id === 'tank_medium';
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (!canEditRole('propulsion')) return;
                      onUpdateBuild(
                        { tankId: item.id },
                        `Selected Fuel Tank: ${item.name} ($${item.cost.toLocaleString()})`
                      );
                      if (isHighlight && onWalkthroughStepComplete) {
                        onWalkthroughStepComplete(2);
                      }
                    }}
                    className={`relative cursor-pointer rounded-2xl p-2.5 border-2 text-center transition flex flex-col items-center justify-between ${
                      isHighlight
                        ? 'bg-[#fef08a] border-[#eab308] ring-4 ring-[#facc15] shadow-[0_0_25px_rgba(250,204,21,0.9)]'
                        : selected
                        ? 'bg-[#fef9c3] border-[#f59e0b] shadow-md'
                        : 'bg-[#f8fafc] border-[#e2e8f0] hover:border-[#93c5fd]'
                    }`}
                  >
                    {isHighlight && (
                      <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 z-10 px-2 py-0.2 rounded-full bg-[#1e3a8a] text-[#fef08a] font-black text-[8px] uppercase whitespace-nowrap shadow animate-bounce">
                        👆 STEP 2: CLICK
                      </span>
                    )}
                    {selected && (
                      <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </span>
                    )}
                    <svg className="w-9 h-10 my-1" viewBox="0 0 40 48">
                      <rect
                        x="9"
                        y={item.tankLevel === 1 ? 14 : item.tankLevel === 2 ? 9 : 4}
                        width="22"
                        height={item.tankLevel === 1 ? 26 : item.tankLevel === 2 ? 32 : 38}
                        rx="4"
                        fill={item.color}
                      />
                      <rect
                        x="12"
                        y={item.tankLevel === 1 ? 18 : item.tankLevel === 2 ? 13 : 8}
                        width="16"
                        height={item.tankLevel === 1 ? 18 : item.tankLevel === 2 ? 24 : 30}
                        rx="2"
                        fill="#dbeafe"
                      />
                    </svg>
                    <div className="text-xs font-extrabold text-[#1e3a8a] leading-tight">
                      {item.name}
                    </div>
                    <div className="text-xs font-black text-[#1e3a8a]">
                      ${item.cost.toLocaleString()}
                    </div>
                    <div className="text-[10px] font-bold text-slate-500">
                      {item.statLabel}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. TANK THERMAL COATING (Propulsion Role) */}
          <div className={!canEditRole('propulsion') ? 'opacity-60' : ''}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#1e3a8a]">
                TANK THERMAL COATING
              </h3>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                Target: {mission.avgTemp}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              {ROCKET_PARTS.coating.map((item) => {
                const selected = build.coatingId === item.id;
                const isHighlight =
                  walkthroughStep === 2 && item.id === 'coat_light';
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (!canEditRole('propulsion')) return;
                      onUpdateBuild(
                        { coatingId: item.id },
                        `Selected Coating: ${item.name} ($${item.cost.toLocaleString()})`
                      );
                      if (isHighlight && onWalkthroughStepComplete) {
                        onWalkthroughStepComplete(2);
                      }
                    }}
                    className={`relative cursor-pointer rounded-2xl p-2.5 border-2 text-center transition flex flex-col items-center justify-between ${
                      isHighlight
                        ? 'bg-[#fef08a] border-[#eab308] ring-4 ring-[#facc15] shadow-[0_0_25px_rgba(250,204,21,0.9)]'
                        : selected
                        ? 'bg-[#fef9c3] border-[#f59e0b] shadow-md'
                        : 'bg-[#f8fafc] border-[#e2e8f0] hover:border-[#93c5fd]'
                    }`}
                  >
                    {isHighlight && (
                      <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 z-10 px-2 py-0.2 rounded-full bg-[#1e3a8a] text-[#fef08a] font-black text-[8px] uppercase whitespace-nowrap shadow">
                        👆 STEP 2: COAT
                      </span>
                    )}
                    {selected && (
                      <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </span>
                    )}
                    <div
                      className="w-8 h-8 rounded-xl my-1 flex items-center justify-center text-white font-black text-xs shadow-inner"
                      style={{ backgroundColor: item.color }}
                    >
                      {item.coatingLevel === 1 ? '☀️' : item.coatingLevel === 2 ? '❄️' : '🧊'}
                    </div>
                    <div className="text-xs font-extrabold text-[#1e3a8a] leading-tight">
                      {item.name}
                    </div>
                    <div className="text-xs font-black text-[#1e3a8a]">
                      ${item.cost.toLocaleString()}
                    </div>
                    <div className="text-[10px] font-bold text-slate-500">
                      {item.statLabel} • {(item.weightKg / 1000).toFixed(1)}t
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 4. FINS (Payload & Aero Role) */}
          <div className={!canEditRole('payload') ? 'opacity-60' : ''}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#1e3a8a]">
                FINS
              </h3>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                🔬 Aero Role ({getRoleOwnerName('payload')})
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              {ROCKET_PARTS.fins.map((item) => {
                const selected = build.finsId === item.id;
                const isHighlight =
                  walkthroughStep === 3 && item.id === 'fins_stabilizer';
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (!canEditRole('payload')) return;
                      onUpdateBuild(
                        { finsId: item.id },
                        `Selected Fins: ${item.name} ($${item.cost.toLocaleString()})`
                      );
                      if (isHighlight && onWalkthroughStepComplete) {
                        onWalkthroughStepComplete(3);
                      }
                    }}
                    className={`relative cursor-pointer rounded-2xl p-2.5 border-2 text-center transition flex flex-col items-center justify-between ${
                      isHighlight
                        ? 'bg-[#fef08a] border-[#eab308] ring-4 ring-[#facc15] shadow-[0_0_25px_rgba(250,204,21,0.9)]'
                        : selected
                        ? 'bg-[#fef9c3] border-[#f59e0b] shadow-md'
                        : 'bg-[#f8fafc] border-[#e2e8f0] hover:border-[#93c5fd]'
                    }`}
                  >
                    {isHighlight && (
                      <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 z-10 px-2 py-0.2 rounded-full bg-[#1e3a8a] text-[#fef08a] font-black text-[8px] uppercase whitespace-nowrap shadow">
                        👆 STEP 3
                      </span>
                    )}
                    {selected && (
                      <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </span>
                    )}
                    <svg className="w-9 h-9 my-1" viewBox="0 0 44 40">
                      <polygon points="15,6 4,36 16,32" fill={item.color} />
                      <polygon points="29,6 40,36 28,32" fill={item.color} />
                    </svg>
                    <div className="text-xs font-extrabold text-[#1e3a8a] leading-tight">
                      {item.name}
                    </div>
                    <div className="text-xs font-black text-[#1e3a8a]">
                      ${item.cost.toLocaleString()}
                    </div>
                    <div className="text-[10px] font-bold text-slate-500">
                      {item.statLabel}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 5. ENGINE (Propulsion Role) */}
          <div className={!canEditRole('propulsion') ? 'opacity-60' : ''}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#1e3a8a]">
                ENGINE (THRUST)
              </h3>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">
                🚀 Propulsion Role ({getRoleOwnerName('propulsion')})
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              {ROCKET_PARTS.engine.map((item) => {
                const selected = build.engineId === item.id;
                const isHighlight =
                  walkthroughStep === 3 && item.id === 'eng_thruster_x';
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (!canEditRole('propulsion')) return;
                      onUpdateBuild(
                        { engineId: item.id },
                        `Selected Engine: ${item.name} ($${item.cost.toLocaleString()})`
                      );
                      if (isHighlight && onWalkthroughStepComplete) {
                        onWalkthroughStepComplete(3);
                      }
                    }}
                    className={`relative cursor-pointer rounded-2xl p-2.5 border-2 text-center transition flex flex-col items-center justify-between ${
                      isHighlight
                        ? 'bg-[#fef08a] border-[#eab308] ring-4 ring-[#facc15] shadow-[0_0_25px_rgba(250,204,21,0.9)]'
                        : selected
                        ? 'bg-[#fef9c3] border-[#f59e0b] shadow-md'
                        : 'bg-[#f8fafc] border-[#e2e8f0] hover:border-[#93c5fd]'
                    }`}
                  >
                    {isHighlight && (
                      <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 z-10 px-2 py-0.2 rounded-full bg-[#1e3a8a] text-[#fef08a] font-black text-[8px] uppercase whitespace-nowrap shadow animate-bounce">
                        👆 STEP 3: ENGINE
                      </span>
                    )}
                    {selected && (
                      <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </span>
                    )}
                    <svg className="w-9 h-9 my-1" viewBox="0 0 44 40">
                      <polygon points="14,6 30,6 36,34 8,34" fill={item.color} />
                    </svg>
                    <div className="text-xs font-extrabold text-[#1e3a8a] leading-tight">
                      {item.name}
                    </div>
                    <div className="text-xs font-black text-[#1e3a8a]">
                      ${item.cost.toLocaleString()}
                    </div>
                    <div className="text-[10px] font-bold text-slate-500">
                      {item.statLabel}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 6. SCIENCE EXPERIMENTS (Payload & Aero Role) */}
          <div className={!canEditRole('payload') ? 'opacity-60' : ''}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#1e3a8a]">
                SCIENCE EXPERIMENTS
              </h3>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                🔬 Science Role ({getRoleOwnerName('payload')})
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {SCIENCE_EXPERIMENTS.map((exp) => {
                const selected = (build.experimentIds || []).includes(exp.id);
                const isMandatory = exp.requiredFor === mission.id;
                const isHighlight = walkthroughStep === 4 && isMandatory;
                return (
                  <div
                    key={exp.id}
                    onClick={() => {
                      toggleExperiment(exp.id);
                      if (isHighlight && onWalkthroughStepComplete) {
                        onWalkthroughStepComplete(4);
                      }
                    }}
                    className={`relative cursor-pointer rounded-2xl p-2.5 border-2 text-left transition ${
                      isHighlight
                        ? 'bg-[#fef08a] border-[#eab308] ring-4 ring-[#facc15] shadow-[0_0_25px_rgba(250,204,21,0.95)]'
                        : selected
                        ? 'bg-[#fef9c3] border-[#f59e0b] shadow-md'
                        : isMandatory
                        ? 'bg-rose-50/90 border-rose-400'
                        : 'bg-[#f8fafc] border-[#e2e8f0] hover:border-[#93c5fd]'
                    }`}
                  >
                    {isHighlight && (
                      <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 z-10 px-2 py-0.5 rounded-full bg-[#1e3a8a] text-[#fef08a] font-black text-[8px] uppercase whitespace-nowrap shadow animate-bounce">
                        👆 STEP 4: CLICK REQUIRED SCIENCE
                      </span>
                    )}
                    {selected && (
                      <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </span>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-base">{exp.icon}</span>
                      <span
                        className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full ${
                          isMandatory
                            ? 'bg-rose-500 text-white'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {isMandatory ? 'REQUIRED!' : `+${exp.score} PTS`}
                      </span>
                    </div>
                    <div className="text-xs font-extrabold text-[#1e3a8a] mt-1 leading-tight">
                      {exp.name}
                    </div>
                    <div className="text-[11px] font-black text-[#1d4ed8] mt-0.5">
                      ${exp.cost.toLocaleString()} • {exp.weightKg} kg
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ====================================================
            CENTER PANEL: 2D CARTOON ROCKET & CALLOUT PILLS
           ==================================================== */}
        <div
          className={`${
            mobileTab === 'rocket' ? 'flex' : 'hidden lg:flex'
          } lg:col-span-4 relative items-center justify-center min-h-[380px] sm:min-h-[450px]`}
        >
          <svg
            viewBox="0 0 500 560"
            className="w-full max-w-[470px] h-auto drop-shadow-2xl overflow-visible"
          >
            <g transform="translate(250, 440)">
              {/* Left & Right Fins */}
              <polygon
                points="-42,-65 -98,10 -42,-12"
                fill={fins.color}
                stroke="#1e3a8a"
                strokeWidth="3"
              />
              <polygon
                points="42,-65 98,10 42,-12"
                fill={fins.color}
                stroke="#1e3a8a"
                strokeWidth="3"
              />

              {/* Engine Nozzle at Base */}
              <polygon
                points="-32,-12 32,-12 44,38 -44,38"
                fill={engine.color}
                stroke="#1e293b"
                strokeWidth="3"
              />
              <rect x="-36" y="-18" width="72" height="10" rx="3" fill="#334155" />

              {/* Main Coated Fuel Tank Body */}
              <rect
                x="-44"
                y={-18 - tankBodyHeight}
                width="88"
                height={tankBodyHeight}
                rx="6"
                fill="#f8fafc"
                stroke={coating.color}
                strokeWidth={coating.coatingLevel === 3 ? '9' : coating.coatingLevel === 2 ? '6' : '3'}
              />

              {/* Blue Accent Stripes on Rocket Body */}
              <rect
                x="-44"
                y={-18 - tankBodyHeight + 18}
                width="88"
                height="14"
                fill={tank.color}
              />
              <rect
                x="-44"
                y="-44"
                width="88"
                height="16"
                fill={tank.color}
              />

              {/* Circular Blue Porthole Window */}
              <circle
                cx="0"
                cy={-18 - tankBodyHeight / 2}
                r="24"
                fill="#3b82f6"
                stroke="#1d4ed8"
                strokeWidth="5"
              />
              <circle
                cx="0"
                cy={-18 - tankBodyHeight / 2}
                r="17"
                fill="#93c5fd"
              />

              {/* Nose Cone on Top */}
              <path
                d={`M 0 ${-18 - tankBodyHeight - 115} Q 45 ${
                  -18 - tankBodyHeight - 45
                } 44 ${-18 - tankBodyHeight} L -44 ${-18 - tankBodyHeight} Q -45 ${
                  -18 - tankBodyHeight - 45
                } 0 ${-18 - tankBodyHeight - 115} Z`}
                fill={nose.color}
              />

              {/* Callout 1: NOSE CONE */}
              <g transform={`translate(0, ${-18 - tankBodyHeight - 60})`}>
                <line
                  x1="-18"
                  y1="0"
                  x2="-95"
                  y2="-15"
                  stroke="#1e3a8a"
                  strokeWidth="2.5"
                />
                <circle cx="-18" cy="0" r="5" fill="#1e3a8a" />
                <g transform="translate(-235, -42)">
                  <rect
                    x="0"
                    y="0"
                    width="142"
                    height="48"
                    rx="24"
                    fill="#ffffff"
                    stroke="#60a5fa"
                    strokeWidth="3"
                  />
                  <text
                    x="71"
                    y="19"
                    textAnchor="middle"
                    fill="#64748b"
                    fontSize="10"
                    fontWeight="800"
                  >
                    NOSE
                  </text>
                  <text
                    x="71"
                    y="36"
                    textAnchor="middle"
                    fill="#1e3a8a"
                    fontSize="14"
                    fontWeight="900"
                  >
                    {nose.name}
                  </text>
                </g>
              </g>

              {/* Callout 2: FUEL TANK & COATING */}
              <g transform={`translate(0, ${-18 - tankBodyHeight * 0.65})`}>
                <line
                  x1="-32"
                  y1="0"
                  x2="-95"
                  y2="0"
                  stroke="#1e3a8a"
                  strokeWidth="2.5"
                />
                <circle cx="-32" cy="0" r="5" fill="#1e3a8a" />
                <g transform="translate(-245, -26)">
                  <rect
                    x="0"
                    y="0"
                    width="152"
                    height="52"
                    rx="26"
                    fill="#ffffff"
                    stroke="#60a5fa"
                    strokeWidth="3"
                  />
                  <text
                    x="76"
                    y="19"
                    textAnchor="middle"
                    fill="#64748b"
                    fontSize="10"
                    fontWeight="800"
                  >
                    {coating.name.toUpperCase()}
                  </text>
                  <text
                    x="76"
                    y="37"
                    textAnchor="middle"
                    fill="#1e3a8a"
                    fontSize="14"
                    fontWeight="900"
                  >
                    {tank.name}
                  </text>
                </g>
              </g>

              {/* Callout 3: FINS */}
              <g transform="translate(0, -35)">
                <line
                  x1="68"
                  y1="0"
                  x2="110"
                  y2="-22"
                  stroke="#1e3a8a"
                  strokeWidth="2.5"
                />
                <circle cx="68" cy="0" r="5" fill="#1e3a8a" />
                <g transform="translate(105, -48)">
                  <rect
                    x="0"
                    y="0"
                    width="138"
                    height="48"
                    rx="24"
                    fill="#ffffff"
                    stroke="#60a5fa"
                    strokeWidth="3"
                  />
                  <text
                    x="69"
                    y="19"
                    textAnchor="middle"
                    fill="#64748b"
                    fontSize="10"
                    fontWeight="800"
                  >
                    FINS
                  </text>
                  <text
                    x="69"
                    y="36"
                    textAnchor="middle"
                    fill="#1e3a8a"
                    fontSize="14"
                    fontWeight="900"
                  >
                    {fins.name}
                  </text>
                </g>
              </g>

              {/* Callout 4: ENGINE */}
              <g transform="translate(0, 22)">
                <line
                  x1="34"
                  y1="0"
                  x2="95"
                  y2="24"
                  stroke="#1e3a8a"
                  strokeWidth="2.5"
                />
                <circle cx="34" cy="0" r="5" fill="#1e3a8a" />
                <g transform="translate(92, 0)">
                  <rect
                    x="0"
                    y="0"
                    width="145"
                    height="48"
                    rx="24"
                    fill="#ffffff"
                    stroke="#60a5fa"
                    strokeWidth="3"
                  />
                  <text
                    x="72"
                    y="19"
                    textAnchor="middle"
                    fill="#64748b"
                    fontSize="10"
                    fontWeight="800"
                  >
                    ENGINE
                  </text>
                  <text
                    x="72"
                    y="36"
                    textAnchor="middle"
                    fill="#1e3a8a"
                    fontSize="13"
                    fontWeight="900"
                  >
                    {engine.name}
                  </text>
                </g>
              </g>
            </g>
          </svg>
        </div>

        {/* ====================================================
            RIGHT PANEL: SHARED BUDGET, YOUR BUILD, & ROCKET STATS
           ==================================================== */}
        <div
          className={`${
            mobileTab === 'stats' ? 'flex' : 'hidden lg:flex'
          } lg:col-span-4 bg-white/95 backdrop-blur-md border-4 border-[#93c5fd] rounded-3xl p-5 sm:p-6 shadow-2xl flex-col justify-between text-[#1e3a8a]`}
        >
          <div className="space-y-4">
            {/* TOTAL SHARED BUDGET */}
            <div>
              <div className="text-xs font-black uppercase tracking-wider text-[#1e3a8a]">
                SHARED TEAM BUDGET ({mission.name.toUpperCase()})
              </div>
              <div className="text-4xl font-black text-[#1e3a8a] mt-0.5">
                ${mission.budget.toLocaleString()}
              </div>

              <div className="w-full h-4 bg-slate-200 rounded-full overflow-hidden mt-2.5">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    remainingBudget < 0 ? 'bg-rose-500' : 'bg-[#2563eb]'
                  }`}
                  style={{ width: `${budgetSpentPct}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs font-extrabold mt-1.5">
                <span className="text-[#1e3a8a]">
                  Total Spent ${evaluation.totalSpent.toLocaleString()}
                </span>
                <span
                  className={
                    remainingBudget < 0 ? 'text-rose-600' : 'text-emerald-600'
                  }
                >
                  Left ${remainingBudget.toLocaleString()}
                </span>
              </div>

              {/* Integrated Mission Prep Progress Bar inside Right Panel */}
              <div className="mt-3 p-2.5 rounded-2xl bg-[#eff6ff] border-2 border-[#bfdbfe]">
                <div className="flex items-center justify-between text-[11px] font-black mb-1">
                  <span className="text-[#1e3a8a]">
                    MISSION PREP PROGRESS
                  </span>
                  <span
                    className={
                      evaluation.isPrepFull
                        ? 'text-emerald-600'
                        : 'text-amber-600'
                    }
                  >
                    {evaluation.prepProgressPct}% {evaluation.isPrepFull ? 'READY!' : 'IN PREP'}
                  </span>
                </div>
                <div className="w-full h-2.5 bg-white rounded-full overflow-hidden border border-blue-200">
                  <div
                    className={`h-full transition-all duration-500 ${
                      evaluation.isPrepFull ? 'bg-emerald-500' : 'bg-[#f59e0b]'
                    }`}
                    style={{ width: `${evaluation.prepProgressPct}%` }}
                  />
                </div>
              </div>
            </div>

            <hr className="border-slate-200" />

            {/* YOUR BUILD RECEIPT */}
            <div>
              <div className="text-xs font-black uppercase tracking-wider text-[#1e3a8a] mb-2">
                YOUR TEAM BUILD
              </div>
              <div className="space-y-1.5 text-sm">
                <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                  <span className="text-slate-500 font-semibold">Nose</span>
                  <span className="font-bold text-[#1e3a8a]">{nose.name}</span>
                  <span className="font-black">${nose.cost.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                  <span className="text-slate-500 font-semibold">Tank</span>
                  <span className="font-bold text-[#1e3a8a]">{tank.name}</span>
                  <span className="font-black">${tank.cost.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                  <span className="text-slate-500 font-semibold">Coating</span>
                  <span className="font-bold text-[#1e3a8a]">{coating.name}</span>
                  <span className="font-black">${coating.cost.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                  <span className="text-slate-500 font-semibold">Fins</span>
                  <span className="font-bold text-[#1e3a8a]">{fins.name}</span>
                  <span className="font-black">${fins.cost.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                  <span className="text-slate-500 font-semibold">Engine</span>
                  <span className="font-bold text-[#1e3a8a]">{engine.name}</span>
                  <span className="font-black">${engine.cost.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                  <span className="text-slate-500 font-semibold">
                    Experiments ({selectedExperiments.length})
                  </span>
                  <span className="font-bold text-emerald-600">
                    +{experimentsScore} Score
                  </span>
                  <span className="font-black">
                    ${evaluation.experimentsCost.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                  <span className="text-slate-500 font-semibold">
                    Astro Food ({evaluation.totalFoodDays}d)
                  </span>
                  <span className="font-bold text-purple-600">
                    {evaluation.foodWeightKg} kg
                  </span>
                  <span className="font-black">
                    ${evaluation.totalFoodCost.toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1 text-base font-black text-[#1e3a8a]">
                  <span>Rocket Subtotal</span>
                  <span>${rocketCost.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <hr className="border-slate-200" />

            {/* ROCKET STATS */}
            <div className="space-y-2.5">
              <div className="text-xs font-black uppercase tracking-wider text-[#1e3a8a]">
                ROCKET STATS
              </div>

              {/* Thrust */}
              <div>
                <div className="flex items-center justify-between text-xs font-extrabold mb-1">
                  <span>Thrust (Min {mission.minThrustKn} kN)</span>
                  <span>{thrustKn} kN</span>
                </div>
                <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#ea580c] rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, (thrustKn / 200) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Weight */}
              <div>
                <div className="flex items-center justify-between text-xs font-extrabold mb-1">
                  <span>Weight (Max Lift {engine.maxWeightTons} t)</span>
                  <span>{totalWeightTons} t</span>
                </div>
                <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      totalWeightTons > engine.maxWeightTons
                        ? 'bg-rose-500'
                        : 'bg-[#3b82f6]'
                    }`}
                    style={{
                      width: `${Math.min(
                        100,
                        (totalWeightTons / engine.maxWeightTons) * 100
                      )}%`,
                    }}
                  />
                </div>
              </div>

              {/* Stability */}
              <div>
                <div className="flex items-center justify-between text-xs font-extrabold mb-1">
                  <span>Stability</span>
                  <span>{stabilityPct}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#16a34a] rounded-full transition-all duration-300"
                    style={{ width: `${stabilityPct}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Reset & Confirm Build Buttons */}
          <div className="pt-4 mt-4 border-t border-slate-100 flex items-center gap-3">
            <button
              onClick={onResetBuild}
              className="w-1/3 py-3.5 rounded-full bg-white hover:bg-slate-50 text-[#1e3a8a] font-black text-sm border-2 border-[#3b82f6] shadow transition"
            >
              Reset
            </button>
            <button
              onClick={() => {
                if (walkthroughStep === 4 && onWalkthroughStepComplete) {
                  onWalkthroughStepComplete(4);
                } else {
                  onConfirmBuild();
                }
              }}
              className={`w-2/3 py-3.5 rounded-full bg-[#f59e0b] hover:bg-[#eab308] text-[#1e3a8a] font-black text-base border-2 border-[#d97706] shadow-lg transition transform active:scale-95 ${
                walkthroughStep === 4
                  ? 'ring-4 ring-[#facc15] shadow-[0_0_25px_rgba(250,204,21,0.9)]'
                  : ''
              }`}
            >
              Confirm Build → Food
            </button>
          </div>
        </div>
      </div>
    </SpaceportScene>
  );
}
