import React, { useState } from 'react';
import SpaceportScene from './SpaceportScene.jsx';
import { TEAM_ROLES } from '../data/missionCatalog.js';
import { Rocket, UserPlus, LogIn, Sparkles, ShieldCheck } from 'lucide-react';

export default function AuthPage({ onAuthSuccess, apiBase }) {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [preferredRole, setPreferredRole] = useState(TEAM_ROLES[0].id);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const endpoint = mode === 'signup' ? '/api/auth/signup' : '/api/auth/login';
      const res = await fetch(`${apiBase}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          email,
          password,
          preferredRole,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Authentication failed. Please try again.');
      } else {
        onAuthSuccess(data.user);
      }
    } catch (err) {
      setError('Cannot reach Spaceport Database Server on port 3001.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'CaptainNova',
          password: 'password123',
        }),
      });
      const data = await res.json();
      if (data.success) {
        onAuthSuccess(data.user);
      }
    } catch (err) {
      setError('Server connection error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SpaceportScene showCharacter={true} showTowers={true}>
      {/* Top Cartoon Header Bar */}
      <div className="w-full max-w-6xl mx-auto px-6 pt-5 flex items-center justify-between">
        <div className="bg-white/95 border-4 border-[#93c5fd] rounded-full px-6 py-2 shadow-lg flex items-center gap-2.5">
          <Rocket className="w-6 h-6 text-[#1d4ed8]" />
          <span className="font-extrabold text-lg text-[#1e3a8a] tracking-tight">
            AstroBuilder: Space Mission Designer
          </span>
        </div>

        <button
          onClick={handleQuickDemoLogin}
          className="bg-[#f59e0b] hover:bg-[#eab308] text-[#1e3a8a] font-extrabold text-sm px-5 py-2.5 rounded-full border-4 border-white shadow-lg flex items-center gap-2 transition transform hover:scale-105"
        >
          <Sparkles className="w-4 h-4" /> Quick Demo Login (CaptainNova)
        </button>
      </div>

      {/* Main Left/Center Cartoon Auth Card */}
      <div className="flex-1 flex items-center justify-center lg:justify-start max-w-6xl w-full mx-auto px-6 py-6">
        <div className="w-full max-w-md bg-white/95 backdrop-blur-md border-4 border-[#93c5fd] rounded-3xl p-6 shadow-2xl text-[#1e3a8a]">
          {/* Mode Switcher */}
          <div className="grid grid-cols-2 gap-2 bg-[#eff6ff] p-1.5 rounded-2xl border-2 border-[#bfdbfe] mb-5">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError('');
              }}
              className={`py-2.5 rounded-xl font-extrabold text-sm flex items-center justify-center gap-1.5 transition ${
                mode === 'login'
                  ? 'bg-[#2563eb] text-white shadow-md'
                  : 'text-[#1e3a8a] hover:bg-white/60'
              }`}
            >
              <LogIn className="w-4 h-4" /> Cadet Login
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setError('');
              }}
              className={`py-2.5 rounded-xl font-extrabold text-sm flex items-center justify-center gap-1.5 transition ${
                mode === 'signup'
                  ? 'bg-[#2563eb] text-white shadow-md'
                  : 'text-[#1e3a8a] hover:bg-white/60'
              }`}
            >
              <UserPlus className="w-4 h-4" /> New Astronaut
            </button>
          </div>

          <h1 className="text-2xl font-black text-[#1e3a8a]">
            {mode === 'login'
              ? 'Welcome Back to the Spaceport!'
              : 'Enlist in the Space Program!'}
          </h1>
          <p className="text-xs font-semibold text-slate-500 mt-1 mb-4">
            {mode === 'login'
              ? 'Log in to access your astronaut profile, saved logins, and mission scores.'
              : 'Create your astronaut account. Choose your specialization role (saved for Team Mode!).'}
          </p>

          {error && (
            <div className="mb-4 p-3 rounded-2xl bg-rose-100 border-2 border-rose-400 text-rose-800 text-xs font-bold">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-[#1e40af] mb-1">
                Astronaut Callsign (Username)
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. CaptainNova"
                className="w-full px-4 py-2.5 rounded-xl bg-[#f8fafc] border-2 border-[#bfdbfe] text-[#1e3a8a] font-bold text-sm focus:outline-none focus:border-[#2563eb]"
              />
            </div>

            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-[#1e40af] mb-1">
                  Spaceport Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="cadet@spaceport.org"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#f8fafc] border-2 border-[#bfdbfe] text-[#1e3a8a] font-bold text-sm focus:outline-none focus:border-[#2563eb]"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-[#1e40af] mb-1">
                Secret Passcode
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl bg-[#f8fafc] border-2 border-[#bfdbfe] text-[#1e3a8a] font-bold text-sm focus:outline-none focus:border-[#2563eb]"
              />
            </div>

            {mode === 'signup' && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-extrabold uppercase tracking-wider text-[#1e40af]">
                    Profile Role (For Future Team Mode)
                  </label>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                    Solo Mode Now
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {TEAM_ROLES.map((role) => {
                    const selected = preferredRole === role.id;
                    return (
                      <button
                        type="button"
                        key={role.id}
                        onClick={() => setPreferredRole(role.id)}
                        className={`p-2 rounded-xl border-2 text-left transition ${
                          selected
                            ? 'bg-[#fef9c3] border-[#f59e0b] shadow-sm'
                            : 'bg-[#f8fafc] border-[#e2e8f0] hover:border-[#93c5fd]'
                        }`}
                      >
                        <div className="text-xs font-extrabold text-[#1e3a8a]">
                          {role.badge} {role.id}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-full bg-[#f59e0b] hover:bg-[#eab308] text-[#1e3a8a] font-black text-base shadow-lg border-2 border-[#d97706] transition transform active:scale-95"
            >
              {loading
                ? 'Connecting to Spaceport...'
                : mode === 'login'
                ? '🚀 Enter Spaceport Hub'
                : '🌟 Create Profile & Launch'}
            </button>
          </form>

          <div className="mt-4 pt-3 border-t-2 border-slate-100 flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span className="flex items-center gap-1 text-emerald-700 font-bold">
              <ShieldCheck className="w-4 h-4" /> Logins Saved in Database
            </span>
            <span>Demo: CaptainNova / password123</span>
          </div>
        </div>
      </div>
    </SpaceportScene>
  );
}
