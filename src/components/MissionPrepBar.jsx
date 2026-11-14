import React, { useState } from 'react';
import { TEAM_ROLES } from '../data/missionCatalog.js';
import {
  QrCode,
  MessageCircle,
  CheckCircle2,
  Clock,
  Send,
  X,
  Rocket,
  Sparkles,
  ChevronDown,
} from 'lucide-react';

export default function MissionPrepBar({
  evaluation,
  room,
  myPlayer,
  onOpenRoomModal,
  onToggleReady,
  onSendChatMessage,
  onNavigatePage,
  walkthroughStep,
  onStartWalkthrough,
}) {
  const [chatOpen, setChatOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [messageText, setMessageText] = useState('');

  const { mission, prepSteps, prepProgressPct, isPrepFull } = evaluation;

  const myRoleObjs = TEAM_ROLES.filter((r) =>
    (
      myPlayer?.assignedRoles || [
        'commander',
        'propulsion',
        'payload',
        'lifesupport',
      ]
    ).includes(r.id)
  );

  const handleSend = (e) => {
    e.preventDefault();
    if (!messageText.trim()) return;
    onSendChatMessage(messageText.trim());
    setMessageText('');
  };

  const quickMessages = [
    'Watch our shared budget! 💰',
    'Propulsion & Tank ready! 🚀',
    'Science experiment installed! 🔬',
    'Astronaut food packed! 🍱',
    'Click Ready so we hit 100%! ✅',
  ];

  const stepPageMap = {
    propulsion: 'rocket',
    payload: 'rocket',
    lifesupport: 'food',
    commander: 'solar',
  };

  return (
    <>
      {/* SLEEK INTEGRATED SINGLE-LINE TOP HUD STRIP (No visual clutter!) */}
      <div className="relative z-40 w-full bg-[#152c69]/95 backdrop-blur-md border-b-2 border-[#60a5fa]/70 px-4 py-1.5 text-white shadow-md">
        <div className="max-w-[1550px] mx-auto flex flex-wrap items-center justify-between gap-2">
          {/* Left: Sleek Inline Mission Prep Progress Bar + 4 Compact Step Dots */}
          <div className="flex items-center gap-3 flex-1 min-w-[260px]">
            <button
              type="button"
              onClick={() => setDetailsOpen((d) => !d)}
              className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-cyan-200 hover:text-white shrink-0"
              title="Click to toggle Mission Prep Checklist details"
            >
              <Rocket className="w-3.5 h-3.5 text-[#facc15]" />
              <span>Prep:</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  isPrepFull
                    ? 'bg-emerald-400 text-[#064e3b]'
                    : 'bg-amber-400 text-[#1e3a8a]'
                }`}
              >
                {prepProgressPct}% {isPrepFull ? 'READY' : 'LOCKED'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 opacity-75" />
            </button>

            {/* Compact Progress Bar Track */}
            <div className="w-28 sm:w-40 h-2.5 bg-[#0a1636] rounded-full overflow-hidden border border-[#60a5fa] p-0.5 shrink-0">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isPrepFull
                    ? 'bg-gradient-to-r from-emerald-400 to-green-500'
                    : 'bg-gradient-to-r from-[#f59e0b] to-[#38bdf8]'
                }`}
                style={{ width: `${prepProgressPct}%` }}
              />
            </div>

            {/* 4 Inline Mini Step Chips */}
            <div className="hidden xl:flex items-center gap-1.5">
              {prepSteps.map((step) => (
                <button
                  key={step.id}
                  type="button"
                  onClick={() =>
                    onNavigatePage && onNavigatePage(stepPageMap[step.id] || 'hub')
                  }
                  title={step.hint}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold flex items-center gap-1 border transition ${
                    step.done
                      ? 'bg-emerald-500/20 border-emerald-400/60 text-emerald-200'
                      : 'bg-slate-900/60 border-amber-400/50 text-amber-200 hover:bg-slate-800'
                  }`}
                >
                  <span>{step.badge}</span>
                  <span>{step.label}</span>
                  <span>{step.done ? '✓' : '•'}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Right: Compact Action Pills (Walkthrough, Role Icons, Ready, Room/QR, Chat) */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Interactive Walkthrough Button */}
            <button
              type="button"
              onClick={onStartWalkthrough}
              className={`shrink-0 whitespace-nowrap px-3 py-1 rounded-full font-black text-[11px] border flex items-center gap-1 transition ${
                walkthroughStep > 0
                  ? 'bg-[#fef08a] text-[#1e3a8a] border-white shadow ring-2 ring-[#facc15]'
                  : 'bg-white/10 hover:bg-white/20 text-cyan-200 border-[#60a5fa]/60'
              }`}
              title="Start interactive Quick Demo Walkthrough"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#facc15]" />
              <span>
                {walkthroughStep > 0
                  ? `Walkthrough (${walkthroughStep}/8)`
                  : 'How to Play'}
              </span>
            </button>

            {/* Compact Role Pill */}
            <div
              onClick={onOpenRoomModal}
              title="Your Assigned Team Roles (Click to view Room & Role Division)"
              className="cursor-pointer hidden md:flex items-center gap-1 bg-white/10 hover:bg-white/15 border border-[#93c5fd]/50 rounded-full px-2.5 py-1 text-[11px] font-bold"
            >
              <span className="text-blue-200">Roles:</span>
              {myRoleObjs.map((r) => (
                <span key={r.id} title={r.title}>
                  {r.badge}
                </span>
              ))}
              <span className="text-[10px] text-amber-300 font-black ml-0.5">
                ({myRoleObjs.length}/4)
              </span>
            </div>

            {/* Ready Toggle (Only when in a Multiplayer Room) */}
            {room && myPlayer && (
              <button
                type="button"
                onClick={() => onToggleReady(!myPlayer.isReady)}
                className={`px-3 py-1 rounded-full font-black text-[11px] border flex items-center gap-1 transition ${
                  myPlayer.isReady
                    ? 'bg-emerald-500 text-white border-emerald-200'
                    : 'bg-amber-400 text-[#1e3a8a] border-white animate-pulse'
                }`}
              >
                {myPlayer.isReady ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" /> Ready ✓
                  </>
                ) : (
                  <>
                    <Clock className="w-3.5 h-3.5" /> Ready?
                  </>
                )}
              </button>
            )}

            {/* Room & QR Code Button */}
            <button
              type="button"
              onClick={onOpenRoomModal}
              className="px-3 py-1 rounded-full bg-[#f59e0b] hover:bg-[#eab308] text-[#1e3a8a] font-black text-[11px] border border-white shadow flex items-center gap-1 transition"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>
                {room
                  ? `Room ${room.roomCode} (${room.players.length}/4)`
                  : 'Room & QR'}
              </span>
            </button>

            {/* Team Chat Button */}
            <button
              type="button"
              onClick={() => setChatOpen((o) => !o)}
              className="relative px-3 py-1 rounded-full bg-white text-[#1e3a8a] font-black text-[11px] border border-[#60a5fa] shadow flex items-center gap-1 hover:bg-blue-50 transition"
            >
              <MessageCircle className="w-3.5 h-3.5 text-[#2563eb]" />
              <span className="hidden sm:inline">Chat</span>
              {room?.chatMessages?.length > 0 && (
                <span className="px-1.5 rounded-full bg-[#2563eb] text-white text-[9px]">
                  {room.chatMessages.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Collapsible Dropdown Checklist (Only shown if user clicks "Prep: XX%") */}
        {detailsOpen && (
          <div className="max-w-[1550px] mx-auto pt-2 mt-1.5 border-t border-blue-400/30 grid grid-cols-1 sm:grid-cols-4 gap-2">
            {prepSteps.map((step) => (
              <button
                key={step.id}
                type="button"
                onClick={() => {
                  onNavigatePage && onNavigatePage(stepPageMap[step.id] || 'hub');
                  setDetailsOpen(false);
                }}
                className={`p-2 rounded-xl text-left text-xs border flex items-center justify-between transition ${
                  step.done
                    ? 'bg-emerald-500/20 border-emerald-400/60 text-emerald-100'
                    : 'bg-slate-900/80 border-amber-400/60 text-amber-200'
                }`}
              >
                <div>
                  <div className="font-black">
                    {step.badge} {step.label}
                  </div>
                  <div className="text-[10px] opacity-80">{step.hint}</div>
                </div>
                <span className="text-sm">{step.done ? '✅' : '⏳'}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* FLOATING TEAM ROOM CHAT DRAWER */}
      {chatOpen && (
        <div className="fixed bottom-4 right-4 z-50 w-96 max-w-[92vw] bg-white border-4 border-[#60a5fa] rounded-3xl shadow-2xl text-[#1e3a8a] flex flex-col overflow-hidden">
          <div className="bg-[#1e3a8a] text-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-[#facc15]" />
              <div>
                <div className="text-sm font-black">
                  {room
                    ? `Room ${room.roomCode} Team Chat (${mission.name})`
                    : 'Mission Crew Chat'}
                </div>
                <div className="text-[10px] text-blue-200 font-bold">
                  {room
                    ? `${room.players.length}/4 Astronauts Connected`
                    : 'Create or Join a Room to chat with teammates!'}
                </div>
              </div>
            </div>
            <button
              onClick={() => setChatOpen(false)}
              className="p-1 rounded-full hover:bg-white/20 text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="px-3 py-2 bg-[#eff6ff] border-b border-blue-200 flex gap-1.5 overflow-x-auto">
            {quickMessages.map((qm, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onSendChatMessage(qm)}
                className="shrink-0 px-2.5 py-1 rounded-full bg-white hover:bg-[#fef9c3] text-[#1e3a8a] border border-blue-300 text-[10px] font-extrabold transition"
              >
                {qm}
              </button>
            ))}
          </div>

          <div className="p-3 h-60 overflow-y-auto space-y-2 bg-slate-50">
            {(room?.chatMessages || []).length === 0 ? (
              <div className="text-xs font-bold text-slate-400 text-center py-10">
                No messages yet. Say hello to your flight crew!
              </div>
            ) : (
              (room?.chatMessages || []).map((m) => {
                const isSystem = m.senderId === 'system' || m.senderId === 'action';
                return (
                  <div
                    key={m.id}
                    className={`p-2.5 rounded-2xl text-xs ${
                      isSystem
                        ? 'bg-blue-50 border border-blue-200 text-[#1e40af] font-bold'
                        : 'bg-white border-2 border-[#bfdbfe] text-[#1e3a8a] shadow-sm'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-extrabold mb-0.5">
                      <span className="text-[#2563eb]">{m.senderName}</span>
                      <span>{m.timestamp}</span>
                    </div>
                    <div className="font-bold leading-snug">{m.text}</div>
                  </div>
                );
              })
            )}
          </div>

          <form
            onSubmit={handleSend}
            className="p-2.5 bg-white border-t-2 border-slate-100 flex gap-2"
          >
            <input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder={
                room ? 'Message your room teammates...' : 'Type a team note...'
              }
              className="flex-1 px-3.5 py-2 rounded-full bg-slate-100 border-2 border-blue-200 text-xs font-bold text-[#1e3a8a] focus:outline-none focus:border-[#2563eb]"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-black text-xs flex items-center gap-1"
            >
              <Send className="w-3.5 h-3.5" /> Send
            </button>
          </form>
        </div>
      )}
    </>
  );
}
