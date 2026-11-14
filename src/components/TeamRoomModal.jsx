import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { TEAM_ROLES } from '../data/missionCatalog.js';
import {
  Users,
  QrCode,
  PlusCircle,
  LogIn,
  LogOut,
  Copy,
  Check,
  RefreshCw,
  X,
  Lock,
  Unlock,
  Sparkles,
} from 'lucide-react';

export default function TeamRoomModal({
  isOpen,
  onClose,
  room,
  user,
  serverInfo,
  onCreateRoom,
  onJoinRoom,
  onLeaveRoom,
  onRotateRoles,
  onToggleStrictLock,
  roomError,
}) {
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [qrSvg, setQrSvg] = useState('');
  const [copied, setCopied] = useState(false);

  // Build the join URL for the QR code (uses LAN IP if on localhost so mobile phones on Wi-Fi can scan!)
  const getJoinUrl = () => {
    const code = room?.roomCode || serverInfo?.activeRoomCode || '';
    if (typeof window === 'undefined') return '';
    const { protocol, hostname, port } = window.location;
    const effectiveHost =
      (hostname === 'localhost' || hostname === '127.0.0.1') &&
      serverInfo?.lanIp &&
      serverInfo.lanIp !== 'localhost'
        ? serverInfo.lanIp
        : hostname;
    const portSuffix = port ? `:${port}` : '';
    return `${protocol}//${effectiveHost}${portSuffix}/?room=${code}`;
  };

  const joinUrl = getJoinUrl();

  useEffect(() => {
    if (!isOpen || !joinUrl) return;
    QRCode.toString(
      joinUrl,
      {
        type: 'svg',
        margin: 1,
        color: {
          dark: '#1e3a8a',
          light: '#ffffff',
        },
      },
      (err, svg) => {
        if (!err && svg) setQrSvg(svg);
      }
    );
  }, [isOpen, joinUrl, room?.roomCode]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(joinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border-4 border-[#60a5fa] rounded-3xl max-w-3xl w-full p-6 shadow-2xl text-[#1e3a8a] space-y-5 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#2563eb] text-white flex items-center justify-center shadow">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-[#1e3a8a]">
                Team Mission Room & QR Code (Up to 4 Players)
              </h2>
              <p className="text-xs font-bold text-slate-500">
                4 Roles are automatically divided among 1, 2, 3, or 4 teammates • Shared Single Budget
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {roomError && (
          <div className="p-3 rounded-2xl bg-rose-100 border-2 border-rose-400 text-rose-800 text-xs font-black">
            ⚠️ {roomError}
          </div>
        )}

        {!room ? (
          /* CREATE OR JOIN ROOM SCREEN */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Create Room Card */}
            <div className="bg-[#eff6ff] border-2 border-[#93c5fd] rounded-3xl p-5 flex flex-col justify-between space-y-4">
              <div>
                <span className="px-3 py-1 rounded-full bg-[#2563eb] text-white font-black text-[10px] uppercase">
                  OPTION 1 // HOST NEW ROUND
                </span>
                <h3 className="text-lg font-black text-[#1e3a8a] mt-2">
                  Create a Team Room
                </h3>
                <p className="text-xs font-semibold text-slate-600 mt-1">
                  Generates a 4-letter Room Code and a scannable QR Code. If fewer than 4 people join, the 4 roles are divided automatically!
                </p>
              </div>
              <button
                type="button"
                onClick={() => onCreateRoom()}
                className="w-full py-3.5 rounded-full bg-[#f59e0b] hover:bg-[#eab308] text-[#1e3a8a] font-black text-sm border-2 border-[#d97706] shadow-lg flex items-center justify-center gap-2 transition"
              >
                <PlusCircle className="w-5 h-5" /> Create Room & Generate QR
              </button>
            </div>

            {/* Join Room Card */}
            <div className="bg-[#f8fafc] border-2 border-[#cbd5e1] rounded-3xl p-5 flex flex-col justify-between space-y-4">
              <div>
                <span className="px-3 py-1 rounded-full bg-emerald-600 text-white font-black text-[10px] uppercase">
                  OPTION 2 // JOIN EXISTING ROOM
                </span>
                <h3 className="text-lg font-black text-[#1e3a8a] mt-2">
                  Enter 4-Letter Room Code
                </h3>
                <input
                  type="text"
                  maxLength={4}
                  value={joinCodeInput}
                  onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                  placeholder={serverInfo?.activeRoomCode || 'ABCD'}
                  className="w-full mt-2 px-4 py-2.5 rounded-2xl bg-white border-2 border-[#60a5fa] text-center font-mono text-2xl font-black tracking-widest uppercase text-[#1e3a8a] focus:outline-none"
                />
                {serverInfo?.activeRoomCode && (
                  <button
                    type="button"
                    onClick={() => onJoinRoom(serverInfo.activeRoomCode)}
                    className="mt-2 w-full py-1.5 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-black text-xs flex items-center justify-center gap-1"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Quick-Join Active Server Room (
                    {serverInfo.activeRoomCode})
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() =>
                  onJoinRoom(joinCodeInput || serverInfo?.activeRoomCode || 'TEAM')
                }
                className="w-full py-3.5 rounded-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-black text-sm shadow-lg flex items-center justify-center gap-2 transition"
              >
                <LogIn className="w-5 h-5" /> Join Team Room
              </button>
            </div>
          </div>
        ) : (
          /* ACTIVE ROOM DASHBOARD: QR CODE + DIVIDED ROLES FOR 1-4 PLAYERS */
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center bg-[#eff6ff] border-2 border-[#93c5fd] rounded-3xl p-5">
              {/* Scannable SVG QR Code */}
              <div className="md:col-span-4 flex flex-col items-center text-center">
                <div className="bg-white p-3 rounded-2xl border-4 border-[#2563eb] shadow-lg w-44 h-44 flex items-center justify-center">
                  {qrSvg ? (
                    <div
                      className="w-full h-full"
                      dangerouslySetInnerHTML={{ __html: qrSvg }}
                    />
                  ) : (
                    <QrCode className="w-20 h-20 text-[#1e3a8a]" />
                  )}
                </div>
                <span className="text-[11px] font-black text-[#1e3a8a] mt-2">
                  📱 Scan QR Code with Phone Camera to Join Room {room.roomCode}!
                </span>
              </div>

              {/* Room Code & Share Link */}
              <div className="md:col-span-8 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-xs font-extrabold uppercase text-slate-500 block">
                      ACTIVE ROOM CODE ({room.players.length} / 4 PLAYERS)
                    </span>
                    <span className="font-mono text-4xl font-black tracking-widest text-[#2563eb]">
                      {room.roomCode}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={onRotateRoles}
                      className="px-3.5 py-2 rounded-full bg-white hover:bg-blue-50 text-[#1e3a8a] border-2 border-[#60a5fa] font-black text-xs flex items-center gap-1"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Rotate Roles
                    </button>
                    <button
                      type="button"
                      onClick={onLeaveRoom}
                      className="px-3.5 py-2 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-black text-xs flex items-center gap-1"
                    >
                      <LogOut className="w-3.5 h-3.5" /> Leave Room
                    </button>
                  </div>
                </div>

                {/* Copyable Join Link */}
                <div className="bg-white p-2.5 rounded-2xl border-2 border-[#bfdbfe] flex items-center justify-between gap-2">
                  <span className="text-xs font-mono font-bold text-slate-600 truncate">
                    {joinUrl}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="shrink-0 px-3 py-1.5 rounded-xl bg-[#2563eb] text-white font-black text-xs flex items-center gap-1"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied!' : 'Copy Link'}</span>
                  </button>
                </div>

                {/* Role Lock Mode Toggle */}
                <div className="flex items-center justify-between bg-white/80 px-3.5 py-2 rounded-2xl border border-blue-200 text-xs">
                  <div>
                    <span className="font-black text-[#1e3a8a]">
                      Subsystem Role Lock:{' '}
                    </span>
                    <span className="text-slate-600 font-semibold">
                      {room.strictRoleLock
                        ? 'Strict (Each player can only edit their assigned role parts)'
                        : 'Cooperative (Roles are assigned, everyone can assist)'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onToggleStrictLock(!room.strictRoleLock)}
                    className={`px-3 py-1 rounded-full font-black text-[11px] flex items-center gap-1 ${
                      room.strictRoleLock
                        ? 'bg-amber-400 text-[#1e3a8a]'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {room.strictRoleLock ? (
                      <>
                        <Lock className="w-3 h-3" /> Strict Lock ON
                      </>
                    ) : (
                      <>
                        <Unlock className="w-3 h-3" /> Co-op Mode
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Automatic 4-Role Division Breakdown */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-[#1e3a8a]">
                  HOW THE 4 ROLES ARE DIVIDED AMONG {room.players.length} PLAYER(S):
                </h3>
                <span className="text-xs font-bold text-emerald-700">
                  {room.players.length === 1 && '1 Player → Owns all 4 Roles'}
                  {room.players.length === 2 && '2 Players → 2 Roles Each'}
                  {room.players.length === 3 && '3 Players → 2, 1, 1 Roles'}
                  {room.players.length === 4 && '4 Players → 1 Dedicated Role Each'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {room.players.map((pl, idx) => {
                  const isMe =
                    pl.userId === user?.sessionPlayerId || pl.userId === user?.id;
                  const roleObjs = TEAM_ROLES.filter((r) =>
                    (pl.assignedRoles || []).includes(r.id)
                  );
                  return (
                    <div
                      key={pl.userId}
                      className={`p-4 rounded-2xl border-2 ${
                        isMe
                          ? 'bg-[#fef9c3] border-[#f59e0b] shadow-md'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-black text-sm text-[#1e3a8a]">
                          Astronaut #{idx + 1}: {pl.username}{' '}
                          {isMe && (
                            <span className="ml-1 px-2 py-0.5 rounded-full bg-[#2563eb] text-white text-[10px]">
                              YOU
                            </span>
                          )}
                        </div>
                        <span
                          className={`text-xs font-black ${
                            pl.isReady ? 'text-emerald-600' : 'text-amber-600'
                          }`}
                        >
                          {pl.isReady ? '✅ Ready' : '⏳ Prepping'}
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        {roleObjs.map((r) => (
                          <div
                            key={r.id}
                            className="p-2 rounded-xl bg-white border border-blue-200 text-xs"
                          >
                            <div className="font-black text-[#1e3a8a]">
                              {r.badge} {r.title}
                            </div>
                            <div className="text-[11px] font-semibold text-slate-500">
                              {r.responsibilities}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
