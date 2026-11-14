import React, { useState, useEffect, useMemo } from 'react';
import { evaluateMissionBuild } from './engine/physicsEngine.js';
import { MISSIONS } from './data/missionCatalog.js';

import AuthPage from './components/AuthPage.jsx';
import MissionHubPage from './components/MissionHubPage.jsx';
import RocketBuilderPage from './components/RocketBuilderPage.jsx';
import FoodSelectionPage from './components/FoodSelectionPage.jsx';
import SolarSimulationPage from './components/SolarSimulationPage.jsx';

const API_BASE = 'http://localhost:3001';
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

  // Current Page ('auth' | 'hub' | 'rocket' | 'food' | 'solar')
  const [currentPage, setCurrentPage] = useState(() => (user ? 'hub' : 'auth'));
  const [leaderboard, setLeaderboard] = useState([]);

  // Active Mission ('moon' | 'mars' | 'neptune')
  const [selectedMissionId, setSelectedMissionId] = useState('moon');

  // Rocket Build State (initialized to match PDF screenshot: Aero Cone, Medium Tank, Stabilizer, Thruster X)
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

  // Sync user profile & leaderboard from database on mount
  useEffect(() => {
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

  // Compute full engineering & mission evaluation
  const evaluation = useMemo(
    () =>
      evaluateMissionBuild({
        missionId: selectedMissionId,
        build,
        foodQuantities,
        launchAngleDeg,
        trajectoryId,
      }),
    [selectedMissionId, build, foodQuantities, launchAngleDeg, trajectoryId]
  );

  // Auth Handlers
  const handleAuthSuccess = (loggedInUser) => {
    setUser(loggedInUser);
    localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(loggedInUser));
    setCurrentPage('hub');
  };

  const handleLogoutOrExit = () => {
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
    setLaunchAngleDeg(m.optimalAngleDeg);
    setTrajectoryId(m.optimalTrajectoryId);

    // Keep current build or load default starter for that mission
    if (missionId === 'moon') {
      setFoodQuantities({
        food_pouches: 1,
        food_thermo: 0,
        food_hydroponic: 0,
        food_cryo_vault: 0,
      });
    } else if (missionId === 'mars') {
      setFoodQuantities({
        food_pouches: 0,
        food_thermo: 0,
        food_hydroponic: 1,
        food_cryo_vault: 0,
      });
    } else {
      setFoodQuantities({
        food_pouches: 0,
        food_thermo: 0,
        food_hydroponic: 0,
        food_cryo_vault: 2,
      });
    }
  };

  const handleUpdateBuild = (partial) => {
    setBuild((prev) => ({ ...prev, ...partial }));
  };

  const handleResetBuild = () => {
    setBuild({
      noseId: 'nose_basic',
      tankId: 'tank_small',
      coatingId: 'coat_light',
      finsId: 'fins_basic',
      engineId: 'eng_spark',
      experimentIds: [],
    });
  };

  const handleUpdateFoodQty = (foodId, qty) => {
    setFoodQuantities((prev) => ({ ...prev, [foodId]: qty }));
  };

  const handleAutoPackFood = () => {
    if (selectedMissionId === 'moon') {
      setFoodQuantities({
        food_pouches: 1,
        food_thermo: 0,
        food_hydroponic: 0,
        food_cryo_vault: 0,
      });
    } else if (selectedMissionId === 'mars') {
      setFoodQuantities({
        food_pouches: 0,
        food_thermo: 0,
        food_hydroponic: 1,
        food_cryo_vault: 0,
      });
    } else {
      setFoodQuantities({
        food_pouches: 0,
        food_thermo: 0,
        food_hydroponic: 0,
        food_cryo_vault: 2,
      });
    }
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
    return <AuthPage onAuthSuccess={handleAuthSuccess} apiBase={API_BASE} />;
  }

  if (currentPage === 'hub') {
    return (
      <MissionHubPage
        user={user}
        selectedMissionId={selectedMissionId}
        onSelectMission={handleSelectMission}
        onGoToPage={setCurrentPage}
        onUpdateRole={handleUpdateRole}
        onLogout={handleLogoutOrExit}
        leaderboard={leaderboard}
      />
    );
  }

  if (currentPage === 'rocket') {
    return (
      <RocketBuilderPage
        evaluation={evaluation}
        build={build}
        onUpdateBuild={handleUpdateBuild}
        onResetBuild={handleResetBuild}
        onConfirmBuild={() => setCurrentPage('food')}
        onBackToHub={() => setCurrentPage('hub')}
        onSelectMission={handleSelectMission}
      />
    );
  }

  if (currentPage === 'food') {
    return (
      <FoodSelectionPage
        evaluation={evaluation}
        foodQuantities={foodQuantities}
        onUpdateFoodQty={handleUpdateFoodQty}
        onAutoPackFood={handleAutoPackFood}
        onBackToRocket={() => setCurrentPage('rocket')}
        onProceedToLaunch={() => setCurrentPage('solar')}
      />
    );
  }

  return (
    <SolarSimulationPage
      evaluation={evaluation}
      launchAngleDeg={launchAngleDeg}
      trajectoryId={trajectoryId}
      onChangeAngle={setLaunchAngleDeg}
      onChangeTrajectory={setTrajectoryId}
      onGoToPage={setCurrentPage}
      onMissionComplete={handleMissionComplete}
      onExitGame={handleLogoutOrExit}
    />
  );
}
