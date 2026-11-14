import React, { useState } from 'react';
import SpaceportScene from './SpaceportScene.jsx';
import { MISSIONS, TEAM_ROLES } from '../data/missionCatalog.js';
import {
  Home,
  Settings,
  ChevronRight,
  Rocket,
  Fuel,
  Globe,
  User,
  Award,
  Thermometer,
  Shield,
  LogOut,
  CheckCircle2,
  QrCode,
  Users,
} from 'lucide-react';

export default function MissionHubPage({
  user,
  selectedMissionId,
  onSelectMission,
  onGoToPage,
  onUpdateRole,
  onLogout,
  leaderboard,
  room,
  onOpenRoomModal,
  walkthroughStep = 0,
  onWalkthroughStepComplete,
}) {
  const [showProfileModal, setShowProfileModal] = useState(false);

  return (
    <SpaceportScene showCharacter={true} showTowers={true}>
      {/* Top Bar matching Reference Image 2 */}
      <div className="w-full max-w-7xl mx-auto px-6 pt-4 flex flex-wrap items-center justify-between gap-3">
        {/* Left Circular Navy Home / Profile Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowProfileModal(true)}
            title="Astronaut Profile"
            className="w-13 h-13 p-3.5 rounded-full bg-[#1e3a8a] hover:bg-[#1d4ed8] border-4 border-[#93c5fd] shadow-lg flex items-center justify-center text-white transition transform hover:scale-105"
          >
            <Home className="w-6 h-6" />
          </button>

          {/* Logged-in Astronaut Badge */}
          <div
            onClick={() => setShowProfileModal(true)}
            className="cursor-pointer bg-white/95 border-4 border-[#93c5fd] rounded-full px-5 py-2 shadow-lg flex items-center gap-3"
          >
            <div className="w-8 h-8 rounded-full bg-[#2563eb] text-white font-black flex items-center justify-center text-sm">
              {user.username.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="text-sm font-black text-[#1e3a8a] leading-none">
                {user.username}
              </div>
              <div className="text-[11px] font-bold text-slate-500">
                {room
                  ? `In Room ${room.roomCode} (${room.players.length}/4 Players)`
                  : `Solo Mode • Click Team Room to Invite`}
              </div>
            </div>
            <div className="pl-2 border-l-2 border-slate-200 flex items-center gap-1 text-[#d97706] font-black text-sm">
              <Award className="w-4 h-4" /> {user.totalScore} pts
            </div>
          </div>
        </div>

        {/* Center Title Pill */}
        <div className="bg-white/95 border-4 border-[#93c5fd] rounded-full px-8 py-2 shadow-lg">
          <span className="font-black text-lg text-[#1e3a8a] tracking-tight">
            🌟 Select Your Space Mission
          </span>
        </div>

        {/* Right Settings / Exit Game Button */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowProfileModal(true)}
            className="w-13 h-13 p-3.5 rounded-full bg-[#1e3a8a] hover:bg-[#1d4ed8] border-4 border-[#93c5fd] shadow-lg flex items-center justify-center text-white transition transform hover:scale-105"
            title="Profile & Settings"
          >
            <Settings className="w-6 h-6" />
          </button>
          <button
            onClick={onLogout}
            className="bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs px-4 py-3 rounded-full border-4 border-rose-300 shadow-lg flex items-center gap-1.5 transition"
          >
            <LogOut className="w-4 h-4" /> Exit Game
          </button>
        </div>
      </div>

      {/* Main Content Area: Left Menu Pills (from Image 2) + 3 Mission Cards */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-6 py-5 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left Navigation Pills matching Reference Screenshot 2 */}
        <div className="lg:col-span-4 space-y-3.5">
          {/* Team Room & QR Code Pill */}
          <button
            onClick={onOpenRoomModal}
            className="w-full bg-[#fef9c3] hover:bg-[#fef08a] border-4 border-[#f59e0b] rounded-full px-6 py-3.5 shadow-xl flex items-center justify-between group transition transform hover:-translate-y-0.5"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#f59e0b] flex items-center justify-center text-white shadow">
                <QrCode className="w-7 h-7" />
              </div>
              <div className="text-left">
                <div className="text-lg font-black text-[#1e3a8a]">
                  {room ? `Room ${room.roomCode} (${room.players.length}/4)` : 'Team Room & QR'}
                </div>
                <div className="text-xs font-bold text-[#92400e]">
                  {room
                    ? 'View QR Code & Divided Roles'
                    : 'Create/Join 1–4 Player Room'}
                </div>
              </div>
            </div>
            <ChevronRight className="w-7 h-7 text-[#1e3a8a] group-hover:translate-x-1 transition" />
          </button>

          <button
            onClick={() => onGoToPage('rocket')}
            className="w-full bg-white/95 hover:bg-white border-4 border-[#60a5fa] rounded-full px-6 py-3.5 shadow-xl flex items-center justify-between group transition transform hover:-translate-y-0.5"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#dbeafe] flex items-center justify-center text-[#1e3a8a]">
                <Rocket className="w-7 h-7" />
              </div>
              <div className="text-left">
                <div className="text-lg font-black text-[#1e3a8a]">
                  Rocket Select
                </div>
                <div className="text-xs font-bold text-slate-500">
                  2D Blueprint & Parts Builder
                </div>
              </div>
            </div>
            <ChevronRight className="w-7 h-7 text-[#1e3a8a] group-hover:translate-x-1 transition" />
          </button>

          <button
            onClick={() => onGoToPage('food')}
            className="w-full bg-white/95 hover:bg-white border-4 border-[#60a5fa] rounded-full px-6 py-3.5 shadow-xl flex items-center justify-between group transition transform hover:-translate-y-0.5"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#fef3c7] flex items-center justify-center text-[#d97706]">
                <Fuel className="w-7 h-7" />
              </div>
              <div className="text-left">
                <div className="text-lg font-black text-[#1e3a8a]">
                  Fuel & Astro Food
                </div>
                <div className="text-xs font-bold text-slate-500">
                  Rations & Fuel Weight Check
                </div>
              </div>
            </div>
            <ChevronRight className="w-7 h-7 text-[#1e3a8a] group-hover:translate-x-1 transition" />
          </button>

          <button
            onClick={() => onGoToPage('solar')}
            className="w-full bg-white/95 hover:bg-white border-4 border-[#60a5fa] rounded-full px-6 py-3.5 shadow-xl flex items-center justify-between group transition transform hover:-translate-y-0.5"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#e0e7ff] flex items-center justify-center text-[#1e3a8a]">
                <Globe className="w-7 h-7" />
              </div>
              <div className="text-left">
                <div className="text-lg font-black text-[#1e3a8a]">
                  Solar System
                </div>
                <div className="text-xs font-bold text-slate-500">
                  Launch Angle & Flight Sim
                </div>
              </div>
            </div>
            <ChevronRight className="w-7 h-7 text-[#1e3a8a] group-hover:translate-x-1 transition" />
          </button>
        </div>

        {/* Center/Right: The 3 Planetary Missions (1. Moon, 2. Mars, 3. Neptune) */}
        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          {MISSIONS.map((mission) => {
            const isSelected = mission.id === selectedMissionId;
            const isDone = user.missionsCompleted?.includes(mission.id);
            const isWalkthroughTarget =
              walkthroughStep === 1 && mission.id === 'moon';

            return (
              <div
                key={mission.id}
                onClick={() => {
                  onSelectMission(mission.id);
                  if (isWalkthroughTarget && onWalkthroughStepComplete) {
                    onWalkthroughStepComplete(1);
                  }
                }}
                className={`relative cursor-pointer rounded-3xl p-5 border-4 transition transform hover:-translate-y-1 flex flex-col justify-between shadow-2xl ${
                  isWalkthroughTarget
                    ? 'bg-[#fef08a] border-[#eab308] ring-4 ring-[#facc15] shadow-[0_0_35px_rgba(250,204,21,0.95)] scale-[1.02]'
                    : isSelected
                    ? 'bg-[#fef9c3] border-[#f59e0b] ring-4 ring-white/80'
                    : 'bg-white/95 border-[#93c5fd] hover:border-[#3b82f6]'
                }`}
              >
                {isWalkthroughTarget && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20 px-3 py-1 rounded-full bg-[#1e3a8a] border-2 border-[#facc15] text-[#fef08a] font-black text-[10px] uppercase whitespace-nowrap shadow-lg animate-bounce">
                    👆 STEP 1: CLICK HERE TO START MOON MISSION
                  </div>
                )}
                <div>
                  {/* Top Badge & Planet Orb */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-3 py-1 rounded-full bg-[#1e3a8a] text-white font-black text-xs">
                      MISSION #{mission.number}
                    </span>
                    {isDone && (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500 text-white font-extrabold text-[11px] flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> CLEARED
                      </span>
                    )}
                  </div>

                  {/* Cartoon Planet Graphic */}
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-14 h-14 rounded-full border-4 border-white shadow-md flex items-center justify-center shrink-0"
                      style={{ backgroundColor: mission.planetColor }}
                    >
                      <span className="text-2xl">
                        {mission.id === 'moon'
                          ? '🌕'
                          : mission.id === 'mars'
                          ? '🔴'
                          : '🔵'}
                      </span>
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-[#1e3a8a]">
                        {mission.name}
                      </h2>
                      <div className="text-xs font-bold text-slate-500">
                        {mission.tagline}
                      </div>
                    </div>
                  </div>

                  {/* Shared Budget Pill */}
                  <div className="bg-white rounded-2xl p-2.5 border-2 border-[#bfdbfe] mb-3 flex items-center justify-between">
                    <span className="text-xs font-extrabold text-slate-500">
                      SHARED BUDGET
                    </span>
                    <span className="text-base font-black text-emerald-600">
                      ${mission.budget.toLocaleString()}
                    </span>
                  </div>

                  {/* Temperature & Tank Coating Challenge Box */}
                  <div className="space-y-1.5 text-xs bg-[#eff6ff] p-3 rounded-2xl border border-[#bfdbfe]">
                    <div className="font-extrabold text-[#1e3a8a] flex items-center gap-1">
                      <Thermometer className="w-4 h-4 text-rose-500" />
                      <span>Temp: {mission.avgTemp}</span>
                    </div>
                    <div className="font-extrabold text-[#1d4ed8] flex items-center gap-1">
                      <Shield className="w-4 h-4 text-amber-500" />
                      <span>
                        {mission.id === 'moon'
                          ? 'Uses Light Cheap Coated Tank'
                          : mission.id === 'mars'
                          ? 'Needs Mid Cryo-Foam Tank'
                          : 'Needs Heavy Thick Cryo Tank!'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 font-semibold leading-snug pt-1">
                      {mission.challengeText}
                    </p>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectMission(mission.id);
                    if (isWalkthroughTarget && onWalkthroughStepComplete) {
                      onWalkthroughStepComplete(1);
                    } else {
                      onGoToPage('rocket');
                    }
                  }}
                  className={`mt-4 w-full py-3 rounded-full font-black text-sm shadow-md border-2 transition ${
                    isSelected
                      ? 'bg-[#f59e0b] hover:bg-[#eab308] text-[#1e3a8a] border-[#d97706]'
                      : 'bg-[#2563eb] hover:bg-[#1d4ed8] text-white border-[#1e40af]'
                  }`}
                >
                  {isSelected ? '🛠️ Build Rocket Now >' : 'Select Mission'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Astronaut Profile & Team Role Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border-4 border-[#93c5fd] rounded-3xl max-w-2xl w-full p-6 shadow-2xl text-[#1e3a8a] space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b-2 border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#2563eb] text-white font-black text-xl flex items-center justify-center">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-[#1e3a8a]">
                    Astronaut Profile: {user.username}
                  </h3>
                  <p className="text-xs font-bold text-slate-500">
                    Total Career Score: {user.totalScore} pts • Missions Cleared:{' '}
                    {user.missionsCompleted?.length || 0}/3
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowProfileModal(false)}
                className="px-4 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 font-extrabold text-xs"
              >
                Close ✕
              </button>
            </div>

            {/* Role Selection */}
            <div className="bg-[#eff6ff] p-4 rounded-2xl border-2 border-[#bfdbfe]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black uppercase text-[#1e40af]">
                  The 4 Team Roles (Auto-Divided in Team Rooms)
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {TEAM_ROLES.map((role) => {
                  const active = user.preferredRole === role.title;
                  return (
                    <button
                      key={role.id}
                      onClick={() => onUpdateRole(role.title)}
                      className={`p-2.5 rounded-xl border-2 text-left transition ${
                        active
                          ? 'bg-[#fef9c3] border-[#f59e0b]'
                          : 'bg-white border-slate-200 hover:border-blue-300'
                      }`}
                    >
                      <div className="text-xs font-black text-[#1e3a8a]">
                        {role.badge} {role.title}
                      </div>
                      <div className="text-[11px] text-slate-500 font-semibold mt-0.5">
                        {role.responsibilities}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Recent Mission Log */}
            <div>
              <h4 className="text-xs font-black uppercase text-slate-500 mb-2">
                Recent Flight Log ({user.missionHistory?.length || 0})
              </h4>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {(user.missionHistory || []).length === 0 ? (
                  <div className="text-xs text-slate-400 font-bold py-4 text-center">
                    No missions flown yet! Select Moon, Mars, or Neptune to begin.
                  </div>
                ) : (
                  user.missionHistory.map((h) => (
                    <div
                      key={h.id}
                      className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs font-bold"
                    >
                      <span>
                        {h.success ? '✅' : '💥'} {h.missionName}
                      </span>
                      <span className="text-slate-500">
                        Spent ${(h.budgetSpent || 0).toLocaleString()}
                      </span>
                      <span
                        className={
                          h.success ? 'text-emerald-600 font-black' : 'text-rose-600'
                        }
                      >
                        {h.success ? `+${h.score} pts` : 'CRASHED'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Top Astronauts Leaderboard */}
            {leaderboard && leaderboard.length > 0 && (
              <div>
                <h4 className="text-xs font-black uppercase text-slate-500 mb-2">
                  Spaceport Leaderboard
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {leaderboard.slice(0, 3).map((u, i) => (
                    <div
                      key={u.id}
                      className="p-2.5 rounded-xl bg-[#fef9c3] border-2 border-[#fde047] flex items-center justify-between text-xs font-black"
                    >
                      <span>
                        #{i + 1} {u.username}
                      </span>
                      <span className="text-[#d97706]">{u.totalScore} pts</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </SpaceportScene>
  );
}
