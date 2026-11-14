import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { evaluateMissionBuild } from './engine/physicsEngine.js';
import { MISSIONS } from './data/missionCatalog.js';

import AuthPage from './components/AuthPage.jsx';
import MissionHubPage from './components/MissionHubPage.jsx';
import RocketBuilderPage from './components/RocketBuilderPage.jsx';
import FoodSelectionPage from './components/FoodSelectionPage.jsx';
import SolarSimulationPage from './components/SolarSimulationPage.jsx';
import MissionPrepBar from './components/MissionPrepBar.jsx';
import TeamRoomModal from './components/TeamRoomModal.jsx';
import DemoWalkthroughBar, { WALKTHROUGH_STEPS } from './components/DemoWalkthroughBar.jsx';

// Relative API base works seamlessly both locally (via Vite /api proxy to port 3001) and on Vercel Serverless (/api)
const API_BASE = '';
const STORAGE_USER_KEY = 'astrobuilder_saved_user';

const DEFAULT_BUILDS = {
  moon: {
    noseId: 'nose_aero',
    tankId: 'tank_medium',
    coatingId: 'coat_light',
    finsId: 'fins_stabilizer',
    engineId: 'eng_thruster_x',
    experimentIds: ['exp_lunar_drill'],
  },
  mars: {
    noseId: 'nose_aero',
    tankId: 'tank_medium',
    coatingId: 'coat_medium',
    finsId: 'fins_stabilizer',
    engineId: 'eng_thruster_x',
    experimentIds: ['exp_mars_rover'],
  },
  neptune: {
    noseId: 'nose_heat',
    tankId: 'tank_large',
    coatingId: 'coat_heavy',
    finsId: 'fins_grid',
    engineId: 'eng_ion_heavy',
    experimentIds: ['exp_neptune_probe'],
  },
};

const STARTER_UNBUILT_ROCKET = {
  noseId: 'nose_basic',
  tankId: 'tank_small',
  coatingId: 'coat_light',
  finsId: 'fins_basic',
  engineId: 'eng_spark',
  experimentIds: [],
};

export default function App() {
  // User Session (Persisted in localStorage + Backend Database)
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_USER_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Unique per-device/tab session ID so multiple devices using Quick Demo can join the same Room as separate players!
  const [sessionPlayerId] = useState(() => {
    try {
      let sid = sessionStorage.getItem('astrobuilder_session_player_id');
      if (!sid) {
        sid = `dev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        sessionStorage.setItem('astrobuilder_session_player_id', sid);
      }
      return sid;
    } catch {
      return `dev-${Math.random().toString(36).slice(2, 8)}`;
    }
  });

  // Check if user scanned a QR code with ?room=CODE
  const [pendingRoomCode, setPendingRoomCode] = useState(() => {
    if (typeof window === 'undefined') return '';
    const params = new URLSearchParams(window.location.search);
    return (params.get('room') || '').trim().toUpperCase();
  });

  // Current Page ('auth' | 'hub' | 'rocket' | 'food' | 'solar')
  const [currentPage, setCurrentPage] = useState(() => (user ? 'hub' : 'auth'));
  const [leaderboard, setLeaderboard] = useState([]);
  const [serverInfo, setServerInfo] = useState({ lanIp: 'localhost', activeRoomCode: null });

  // Active Multiplayer Room State (Up to 4 Players, Shared Single Budget, Live Chat)
  const [room, setRoom] = useState(null);
  const [roomModalOpen, setRoomModalOpen] = useState(false);
  const [roomError, setRoomError] = useState('');

  // Interactive Quick Demo Walkthrough State (0 = off, 1..7 = active step)
  const [walkthroughStep, setWalkthroughStep] = useState(0);
  const [autoLaunchSignal, setAutoLaunchSignal] = useState(0);

  // Active Mission ('moon' | 'mars' | 'neptune')
  const [selectedMissionId, setSelectedMissionId] = useState('moon');

  // Rocket Build State
  const [build, setBuild] = useState(DEFAULT_BUILDS.moon);

  // Astronaut Food Quantities
  const [foodQuantities, setFoodQuantities] = useState({
    food_pouches: 1,
    food_thermo: 0,
    food_hydroponic: 0,
    food_cryo_vault: 0,
  });

  // Pre-Flight Trajectory & Launch Angle State
  const [launchAngleDeg, setLaunchAngleDeg] = useState(80);
  const [trajectoryId, setTrajectoryId] = useState('direct');

  // Sync server info, user profile & leaderboard on mount
  useEffect(() => {
    fetch(`${API_BASE}/api/server-info`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setServerInfo(d);
      })
      .catch(() => {});

    fetch(`${API_BASE}/api/leaderboard`)
      .then((r) => r.json())
      .then((d) => {
        if (d.leaderboard) setLeaderboard(d.leaderboard);
      })
      .catch(() => {});

    if (user?.id) {
      fetch(`${API_BASE}/api/user/${user.id}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.success && d.user) {
            setUser(d.user);
            localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(d.user));
          }
        })
        .catch(() => {});
    }
  }, []);

  // Apply incoming room state to local shared mission state
  const applyRoomState = useCallback((incomingRoom) => {
    if (!incomingRoom) return;
    setRoom(incomingRoom);
    if (incomingRoom.missionId) setSelectedMissionId(incomingRoom.missionId);
    if (incomingRoom.build) setBuild(incomingRoom.build);
    if (incomingRoom.foodQuantities) setFoodQuantities(incomingRoom.foodQuantities);
    if (incomingRoom.launchAngleDeg !== undefined) {
      setLaunchAngleDeg(Number(incomingRoom.launchAngleDeg));
    }
    if (incomingRoom.trajectoryId) setTrajectoryId(incomingRoom.trajectoryId);
  }, []);

  // Refresh server-info whenever the Room Modal is opened so Device 2 immediately sees active rooms
  useEffect(() => {
    if (!roomModalOpen) return;
    fetch(`${API_BASE}/api/server-info`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setServerInfo(d);
      })
      .catch(() => {});
  }, [roomModalOpen]);

  // Join Room by 4-letter code
  const handleJoinRoom = useCallback(
    async (codeToJoin, explicitUser) => {
      const activeUser = explicitUser || user;
      const cleanCode = String(codeToJoin || serverInfo?.activeRoomCode || '').trim().toUpperCase();
      if (!activeUser || !cleanCode) return;
      setRoomError('');
      try {
        const res = await fetch(`${API_BASE}/api/rooms/join`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomCode: cleanCode,
            user: { ...activeUser, sessionPlayerId },
          }),
        });
        const data = await res.json();
        if (!res.ok || data.error) {
          setRoomError(data.error || 'Could not join room');
          return;
        }
        if (data.room) {
          applyRoomState(data.room);
          setPendingRoomCode('');
        }
      } catch {
        setRoomError('Network error joining room.');
      }
    },
    [user, serverInfo?.activeRoomCode, sessionPlayerId, applyRoomState]
  );

  // Auto-join room when user scanned QR code (?room=XXXX) and is logged in
  useEffect(() => {
    if (user && pendingRoomCode && !room) {
      handleJoinRoom(pendingRoomCode, user);
      setRoomModalOpen(true);
    }
  }, [user, pendingRoomCode, room, handleJoinRoom]);

  // Poll active room every 1000ms for real-time team sync
  useEffect(() => {
    if (!room?.roomCode) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/rooms/${room.roomCode}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.success && data.room) {
          applyRoomState(data.room);
        }
      } catch {
        // Ignore transient poll errors
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [room?.roomCode, applyRoomState]);

  // Helper to push shared state updates to the active Room on the server
  const syncWithRoom = async (payload) => {
    if (!room?.roomCode) return;
    try {
      const res = await fetch(`${API_BASE}/api/rooms/${room.roomCode}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          actorName: user?.username || 'Astronaut',
        }),
      });
      const data = await res.json();
      if (data.success && data.room) {
        applyRoomState(data.room);
      }
    } catch {
      // Ignore network hiccup
    }
  };

  // Start Interactive Quick Demo Walkthrough (Resets rocket, food & trajectory to starter so walkthrough highlights & selects each part!)
  const handleStartWalkthrough = useCallback(() => {
    setSelectedMissionId('moon');
    setBuild(STARTER_UNBUILT_ROCKET);
    const emptyFood = {
      food_pouches: 0,
      food_thermo: 0,
      food_hydroponic: 0,
      food_cryo_vault: 0,
    };
    setFoodQuantities(emptyFood);
    setLaunchAngleDeg(20);
    setTrajectoryId('gravity');
    setCurrentPage('hub');
    setWalkthroughStep(1);
    syncWithRoom({
      missionId: 'moon',
      build: STARTER_UNBUILT_ROCKET,
      foodQuantities: emptyFood,
      launchAngleDeg: 20,
      trajectoryId: 'gravity',
    });
  }, [room?.roomCode]);

  // Jump to a specific walkthrough step
  const handleSelectWalkthroughStep = (targetStep) => {
    const stepMeta = WALKTHROUGH_STEPS.find((s) => s.step === targetStep);
    if (!stepMeta) return;
    setCurrentPage(stepMeta.page);
    setWalkthroughStep(targetStep);
  };

  // Execute & Advance Walkthrough Step (when user clicks the highlighted UI element OR clicks "Auto-Select & Next")
  const handleCompleteWalkthroughStep = (stepNumber) => {
    const step = stepNumber || walkthroughStep;

    if (step === 1) {
      setSelectedMissionId('moon');
      setBuild(STARTER_UNBUILT_ROCKET);
      setFoodQuantities({
        food_pouches: 0,
        food_thermo: 0,
        food_hydroponic: 0,
        food_cryo_vault: 0,
      });
      setCurrentPage('rocket');
      setWalkthroughStep(2);
      syncWithRoom({
        missionId: 'moon',
        build: STARTER_UNBUILT_ROCKET,
        actionNote: 'Walkthrough Step 1: Selected Moon Mission!',
      });
      return;
    }

    if (step === 2) {
      setBuild((prev) => {
        const next = {
          ...prev,
          tankId: 'tank_medium',
          coatingId: 'coat_light',
        };
        syncWithRoom({
          build: next,
          actionNote: 'Walkthrough Step 2: Selected Medium Fuel Tank & Light Coating!',
        });
        return next;
      });
      setWalkthroughStep(3);
      return;
    }

    if (step === 3) {
      setBuild((prev) => {
        const next = {
          ...prev,
          engineId: 'eng_thruster_x',
          noseId: 'nose_aero',
          finsId: 'fins_stabilizer',
        };
        syncWithRoom({
          build: next,
          actionNote: 'Walkthrough Step 3: Equipped Thruster X, Aero Cone & Stabilizer Fins!',
        });
        return next;
      });
      setWalkthroughStep(4);
      return;
    }

    if (step === 4) {
      setBuild((prev) => {
        const next = {
          ...prev,
          noseId: 'nose_aero',
          tankId: 'tank_medium',
          coatingId: 'coat_light',
          finsId: 'fins_stabilizer',
          engineId: 'eng_thruster_x',
          experimentIds: ['exp_lunar_drill'],
        };
        syncWithRoom({
          build: next,
          actionNote: 'Walkthrough Step 4: Installed Required Lunar Core Drill (+400 pts)!',
        });
        return next;
      });
      setCurrentPage('food');
      setWalkthroughStep(5);
      return;
    }

    if (step === 5) {
      const nextFood = {
        food_pouches: 1,
        food_thermo: 0,
        food_hydroponic: 0,
        food_cryo_vault: 0,
      };
      setFoodQuantities(nextFood);
      syncWithRoom({
        foodQuantities: nextFood,
        actionNote: 'Walkthrough Step 5: Packed 14 Days of Freeze-Dried Astro Pouches!',
      });
      setWalkthroughStep(6);
      return;
    }

    if (step === 6) {
      setCurrentPage('solar');
      setWalkthroughStep(7);
      return;
    }

    if (step === 7) {
      setLaunchAngleDeg(80);
      setTrajectoryId('direct');
      setWalkthroughStep(8);
      syncWithRoom({
        launchAngleDeg: 80,
        trajectoryId: 'direct',
        actionNote: 'Walkthrough Step 7: Set Direct Lunar Transfer Trajectory & 80° Pitch Angle!',
      });
      return;
    }

    if (step === 8) {
      setLaunchAngleDeg(80);
      setTrajectoryId('direct');
      setWalkthroughStep(0);
      setAutoLaunchSignal((n) => n + 1);
      syncWithRoom({
        launchAngleDeg: 80,
        trajectoryId: 'direct',
        triggerLaunch: true,
        actionNote: 'Walkthrough Complete: Launching Rocket to the Moon!',
      });
    }
  };

  // Create a new Room on the server
  const handleCreateRoom = async () => {
    if (!user) return;
    setRoomError('');
    try {
      const res = await fetch(`${API_BASE}/api/rooms/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user: { ...user, sessionPlayerId },
          initialState: {
            missionId: selectedMissionId,
            build,
            foodQuantities,
            launchAngleDeg,
            trajectoryId,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setRoomError(data.error || 'Could not create room');
        return;
      }
      if (data.room) {
        applyRoomState(data.room);
        setServerInfo((prev) => ({ ...prev, activeRoomCode: data.room.roomCode }));
      }
    } catch {
      setRoomError('Failed to create room.');
    }
  };

  const handleLeaveRoom = async () => {
    if (!room?.roomCode) return;
    try {
      await fetch(`${API_BASE}/api/rooms/${room.roomCode}/leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: sessionPlayerId || user?.id,
          username: user?.username,
        }),
      });
    } catch {
      // ignore
    }
    setRoom(null);
  };

  const handleToggleReady = async (nextReady) => {
    if (!room?.roomCode || !user) return;
    try {
      const res = await fetch(`${API_BASE}/api/rooms/${room.roomCode}/ready`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: sessionPlayerId || user.id,
          isReady: nextReady,
        }),
      });
      const data = await res.json();
      if (data.success && data.room) applyRoomState(data.room);
    } catch {
      // ignore
    }
  };

  const handleRotateRoles = async () => {
    if (!room?.roomCode) return;
    try {
      const res = await fetch(`${API_BASE}/api/rooms/${room.roomCode}/ready`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rotateRoles: true }),
      });
      const data = await res.json();
      if (data.success && data.room) applyRoomState(data.room);
    } catch {
      // ignore
    }
  };

  const handleToggleStrictLock = (nextStrict) => {
    syncWithRoom({
      strictRoleLock: nextStrict,
      actionNote: `${user?.username || 'Host'} switched Role Lock to ${
        nextStrict ? 'Strict Role Lock' : 'Cooperative Mode'
      }.`,
    });
  };

  const handleSendChatMessage = async (text) => {
    if (!room?.roomCode) {
      setRoomModalOpen(true);
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/rooms/${room.roomCode}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: user?.id,
          senderName: user?.username || 'Astronaut',
          text,
        }),
      });
      const data = await res.json();
      if (data.success && data.room) applyRoomState(data.room);
    } catch {
      // ignore
    }
  };

  // Compute full engineering & mission evaluation (including Top Mission Prep Progress Bar 0-100%)
  const evaluation = useMemo(
    () =>
      evaluateMissionBuild({
        missionId: selectedMissionId,
        build,
        foodQuantities,
        launchAngleDeg,
        trajectoryId,
        roomPlayers: room?.players || [],
      }),
    [selectedMissionId, build, foodQuantities, launchAngleDeg, trajectoryId, room?.players]
  );

  // Determine the logged-in player's divided roles
  const myPlayer = useMemo(() => {
    if (!room || !user) return null;
    return (
      room.players.find(
        (p) => p.userId === sessionPlayerId || p.userId === user.id
      ) || null
    );
  }, [room, user, sessionPlayerId]);

  const myAssignedRoles = useMemo(() => {
    if (!myPlayer || !myPlayer.assignedRoles) {
      return ['commander', 'propulsion', 'payload', 'lifesupport'];
    }
    return myPlayer.assignedRoles;
  }, [myPlayer]);

  // Auth Handlers
  const handleAuthSuccess = (loggedInUser, options = {}) => {
    setUser(loggedInUser);
    localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(loggedInUser));
    setCurrentPage('hub');

    if (pendingRoomCode) {
      handleJoinRoom(pendingRoomCode, loggedInUser);
      setRoomModalOpen(true);
    } else if (options.isQuickDemo) {
      // Start Interactive Quick Demo Walkthrough automatically!
      handleStartWalkthrough();
    }
  };

  const handleLogoutOrExit = () => {
    setWalkthroughStep(0);
    localStorage.removeItem(STORAGE_USER_KEY);
    setUser(null);
    setCurrentPage('auth');
  };

  const handleUpdateRole = async (newRole) => {
    if (!user) return;
    try {
      const res = await fetch(`${API_BASE}/api/user/${user.id}/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferredRole: newRole }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        setUser(data.user);
        localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(data.user));
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Mission Switch Handler
  const handleSelectMission = (missionId) => {
    setSelectedMissionId(missionId);
    const m = MISSIONS.find((x) => x.id === missionId) || MISSIONS[0];
    const nextAngle = m.optimalAngleDeg;
    const nextTraj = m.optimalTrajectoryId;
    setLaunchAngleDeg(nextAngle);
    setTrajectoryId(nextTraj);

    let nextFood = {
      food_pouches: 1,
      food_thermo: 0,
      food_hydroponic: 0,
      food_cryo_vault: 0,
    };
    if (missionId === 'mars') {
      nextFood = {
        food_pouches: 0,
        food_thermo: 0,
        food_hydroponic: 1,
        food_cryo_vault: 0,
      };
    } else if (missionId === 'neptune') {
      nextFood = {
        food_pouches: 0,
        food_thermo: 0,
        food_hydroponic: 0,
        food_cryo_vault: 2,
      };
    }
    setFoodQuantities(nextFood);

    syncWithRoom({
      missionId,
      foodQuantities: nextFood,
      launchAngleDeg: nextAngle,
      trajectoryId: nextTraj,
      actionNote: `Selected ${m.name} Mission (Shared Budget: $${m.budget.toLocaleString()})`,
    });
  };

  const handleUpdateBuild = (partial, actionNote) => {
    setBuild((prev) => {
      const next = { ...prev, ...partial };
      syncWithRoom({ build: next, actionNote });
      return next;
    });
  };

  const handleResetBuild = () => {
    setBuild(STARTER_UNBUILT_ROCKET);
    syncWithRoom({
      build: STARTER_UNBUILT_ROCKET,
      actionNote: 'Reset rocket blueprint to starter parts.',
    });
  };

  const handleUpdateFoodQty = (foodId, qty, foodName) => {
    setFoodQuantities((prev) => {
      const next = { ...prev, [foodId]: qty };
      syncWithRoom({
        foodQuantities: next,
        actionNote: foodName ? `Updated ${foodName} to x${qty}` : undefined,
      });
      return next;
    });
  };

  const handleAutoPackFood = () => {
    let nextFood = {
      food_pouches: 1,
      food_thermo: 0,
      food_hydroponic: 0,
      food_cryo_vault: 0,
    };
    if (selectedMissionId === 'mars') {
      nextFood = {
        food_pouches: 0,
        food_thermo: 0,
        food_hydroponic: 1,
        food_cryo_vault: 0,
      };
    } else if (selectedMissionId === 'neptune') {
      nextFood = {
        food_pouches: 0,
        food_thermo: 0,
        food_hydroponic: 0,
        food_cryo_vault: 2,
      };
    }
    setFoodQuantities(nextFood);
    syncWithRoom({
      foodQuantities: nextFood,
      actionNote: 'Auto-packed optimal astronaut food rations.',
    });
  };

  const handleChangeAngle = (deg) => {
    setLaunchAngleDeg(deg);
    syncWithRoom({ launchAngleDeg: deg });
  };

  const handleChangeTrajectory = (trajId) => {
    setTrajectoryId(trajId);
    syncWithRoom({ trajectoryId: trajId });
  };

  const handleTriggerRoomLaunch = () => {
    syncWithRoom({
      triggerLaunch: true,
      actionNote: '🚀 Ignited main engines! Mission launched!',
    });
  };

  const handleMissionComplete = async (resultPayload) => {
    if (!user) return;
    try {
      const res = await fetch(`${API_BASE}/api/user/${user.id}/mission-result`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resultPayload),
      });
      const data = await res.json();
      if (data.success && data.user) {
        setUser(data.user);
        localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(data.user));
      }
      if (data.leaderboard) {
        setLeaderboard(data.leaderboard);
      }
    } catch (e) {
      console.error('Failed to record mission result:', e);
    }
  };

  // Page Router
  if (!user || currentPage === 'auth') {
    return (
      <AuthPage
        onAuthSuccess={handleAuthSuccess}
        apiBase={API_BASE}
        pendingRoomCode={pendingRoomCode}
      />
    );
  }

  return (
    <div className="min-h-[100dvh] flex flex-col">
      {/* Sleek Single-Line Top Mission Prep Strip (0-100%), Role Icons, Walkthrough & Chat */}
      <MissionPrepBar
        evaluation={evaluation}
        room={room}
        myPlayer={myPlayer}
        onOpenRoomModal={() => setRoomModalOpen(true)}
        onToggleReady={handleToggleReady}
        onSendChatMessage={handleSendChatMessage}
        onNavigatePage={setCurrentPage}
        walkthroughStep={walkthroughStep}
        onStartWalkthrough={handleStartWalkthrough}
      />

      {/* Interactive Quick Demo Guided Walkthrough Coach Bar */}
      <DemoWalkthroughBar
        walkthroughStep={walkthroughStep}
        onAutoAdvanceStep={() => handleCompleteWalkthroughStep(walkthroughStep)}
        onCloseWalkthrough={() => setWalkthroughStep(0)}
        onSelectStep={handleSelectWalkthroughStep}
      />

      {/* Team Room & Scannable QR Code Modal */}
      <TeamRoomModal
        isOpen={roomModalOpen}
        onClose={() => setRoomModalOpen(false)}
        room={room}
        user={{ ...user, sessionPlayerId }}
        serverInfo={serverInfo}
        onCreateRoom={handleCreateRoom}
        onJoinRoom={(code) => handleJoinRoom(code, user)}
        onLeaveRoom={handleLeaveRoom}
        onRotateRoles={handleRotateRoles}
        onToggleStrictLock={handleToggleStrictLock}
        roomError={roomError}
      />

      {/* Active Screen */}
      <div className="flex-1 flex flex-col">
        {currentPage === 'hub' && (
          <MissionHubPage
            user={user}
            selectedMissionId={selectedMissionId}
            onSelectMission={handleSelectMission}
            onGoToPage={setCurrentPage}
            onUpdateRole={handleUpdateRole}
            onLogout={handleLogoutOrExit}
            leaderboard={leaderboard}
            room={room}
            onOpenRoomModal={() => setRoomModalOpen(true)}
            walkthroughStep={walkthroughStep}
            onWalkthroughStepComplete={handleCompleteWalkthroughStep}
          />
        )}

        {currentPage === 'rocket' && (
          <RocketBuilderPage
            evaluation={evaluation}
            build={build}
            onUpdateBuild={handleUpdateBuild}
            onResetBuild={handleResetBuild}
            onConfirmBuild={() => setCurrentPage('food')}
            onBackToHub={() => setCurrentPage('hub')}
            onSelectMission={handleSelectMission}
            room={room}
            myAssignedRoles={myAssignedRoles}
            walkthroughStep={walkthroughStep}
            onWalkthroughStepComplete={handleCompleteWalkthroughStep}
          />
        )}

        {currentPage === 'food' && (
          <FoodSelectionPage
            evaluation={evaluation}
            foodQuantities={foodQuantities}
            onUpdateFoodQty={handleUpdateFoodQty}
            onAutoPackFood={handleAutoPackFood}
            onBackToRocket={() => setCurrentPage('rocket')}
            onProceedToLaunch={() => setCurrentPage('solar')}
            room={room}
            myAssignedRoles={myAssignedRoles}
            walkthroughStep={walkthroughStep}
            onWalkthroughStepComplete={handleCompleteWalkthroughStep}
          />
        )}

        {currentPage === 'solar' && (
          <SolarSimulationPage
            evaluation={evaluation}
            launchAngleDeg={launchAngleDeg}
            trajectoryId={trajectoryId}
            onChangeAngle={handleChangeAngle}
            onChangeTrajectory={handleChangeTrajectory}
            onGoToPage={setCurrentPage}
            onMissionComplete={handleMissionComplete}
            onExitGame={handleLogoutOrExit}
            room={room}
            myAssignedRoles={myAssignedRoles}
            onTriggerRoomLaunch={handleTriggerRoomLaunch}
            walkthroughStep={walkthroughStep}
            onWalkthroughStepComplete={handleCompleteWalkthroughStep}
            autoLaunchSignal={autoLaunchSignal}
          />
        )}
      </div>
    </div>
  );
}
