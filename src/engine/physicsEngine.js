import {
  MISSIONS,
  ROCKET_PARTS,
  SCIENCE_EXPERIMENTS,
  FOOD_CATALOG,
  TRAJECTORY_PATHS,
} from '../data/missionCatalog.js';

export function evaluateMissionBuild({
  missionId = 'moon',
  build,
  foodQuantities = {},
  launchAngleDeg = 80,
  trajectoryId = 'direct',
}) {
  const mission = MISSIONS.find((m) => m.id === missionId) || MISSIONS[0];

  const nose = ROCKET_PARTS.nose.find((n) => n.id === build.noseId) || ROCKET_PARTS.nose[0];
  const tank = ROCKET_PARTS.tank.find((t) => t.id === build.tankId) || ROCKET_PARTS.tank[0];
  const coating =
    ROCKET_PARTS.coating.find((c) => c.id === build.coatingId) || ROCKET_PARTS.coating[0];
  const fins = ROCKET_PARTS.fins.find((f) => f.id === build.finsId) || ROCKET_PARTS.fins[0];
  const engine =
    ROCKET_PARTS.engine.find((e) => e.id === build.engineId) || ROCKET_PARTS.engine[0];

  const selectedExperiments = (build.experimentIds || [])
    .map((id) => SCIENCE_EXPERIMENTS.find((e) => e.id === id))
    .filter(Boolean);

  // 1. Rocket Parts Cost & Weight
  const corePartsCost =
    nose.cost + tank.cost + coating.cost + fins.cost + engine.cost;
  const experimentsCost = selectedExperiments.reduce((sum, e) => sum + e.cost, 0);
  const rocketCost = corePartsCost + experimentsCost;

  const corePartsWeightKg =
    nose.weightKg +
    tank.weightKg +
    coating.weightKg +
    fins.weightKg +
    engine.weightKg;
  const experimentsWeightKg = selectedExperiments.reduce(
    (sum, e) => sum + e.weightKg,
    0
  );
  const rocketWeightKg = corePartsWeightKg + experimentsWeightKg;

  // 2. Astronaut Food Cost, Weight, & Extra Launch Mass Fuel Cost
  let foodDirectCost = 0;
  let foodWeightKg = 0;
  let totalFoodDays = 0;
  let foodMoraleScore = 0;
  const selectedFoodItems = [];

  FOOD_CATALOG.forEach((item) => {
    const qty = Number(foodQuantities[item.id] || 0);
    if (qty > 0) {
      const itemCost = item.baseCost * qty;
      const itemWeight = item.weightKg * qty;
      const itemDays = item.daysProvided * qty;
      const itemScore = item.moraleScore * qty;

      foodDirectCost += itemCost;
      foodWeightKg += itemWeight;
      totalFoodDays += itemDays;
      foodMoraleScore += itemScore;

      selectedFoodItems.push({
        ...item,
        qty,
        itemCost,
        itemWeight,
        itemDays,
      });
    }
  });

  // Food weight adds extra propellant/handling cost to the rocket ($45 per kg of food)
  const foodWeightRocketSurcharge = foodWeightKg * 45;
  const totalFoodCost = foodDirectCost + foodWeightRocketSurcharge;

  // 3. Total Budget & Remaining
  const totalSpent = rocketCost + totalFoodCost;
  const remainingBudget = mission.budget - totalSpent;
  const budgetLeftAfterRocket = mission.budget - rocketCost;

  // 4. Total Weight (tonnes), Thrust (kN), & Stability (%)
  const totalWeightKg = rocketWeightKg + foodWeightKg;
  const totalWeightTons = Number((totalWeightKg / 1000).toFixed(1));
  const thrustKn = engine.thrustKn;

  const weightPenalty = Math.max(0, Math.round((totalWeightTons - 9) * 1.2));
  const stabilityPct = Math.max(
    15,
    Math.min(99, 20 + nose.stabilityBonus + fins.stabilityBonus - weightPenalty)
  );

  // 5. Science & Mission Score Calculation
  const experimentsScore = selectedExperiments.reduce((sum, e) => sum + e.score, 0);
  const budgetEfficiencyBonus =
    remainingBudget > 0
      ? Math.round((remainingBudget / mission.budget) * 350)
      : 0;

  // 6. Trajectory & Launch Angle Accuracy (40% threshold!)
  const angleErrorDeg = Math.abs(Number(launchAngleDeg) - mission.optimalAngleDeg);
  const angleAccuracy = Math.max(0, 100 - angleErrorDeg * 1.5);
  const isOptimalPath = trajectoryId === mission.optimalTrajectoryId;
  const pathAccuracy = isOptimalPath ? 100 : 45;

  const trajectoryAccuracyPct = Math.round(
    angleAccuracy * 0.65 + pathAccuracy * 0.35
  );
  const isTrajectoryAcceptable = trajectoryAccuracyPct >= 40;

  const chosenTrajectoryObj =
    TRAJECTORY_PATHS.find((t) => t.id === trajectoryId) || TRAJECTORY_PATHS[0];
  const optimalTrajectoryObj =
    TRAJECTORY_PATHS.find((t) => t.id === mission.optimalTrajectoryId) ||
    TRAJECTORY_PATHS[0];

  // 7. Check all failure / crash reasons (in chronological order of flight!)
  const failures = [];

  if (totalSpent > mission.budget) {
    failures.push({
      code: 'OVER_BUDGET',
      stage: 'liftoff',
      progressStop: 0.08,
      redirectTo: totalFoodCost > 0 && rocketCost <= mission.budget ? 'food' : 'rocket',
      title: 'Mission Grounded: Budget Overrun!',
      explanation: `Your total mission cost ($${totalSpent.toLocaleString()}) exceeded the $${mission.budget.toLocaleString()} budget cap for ${mission.name} by $${Math.abs(remainingBudget).toLocaleString()}!`,
      fixHint:
        totalFoodCost > 0 && rocketCost <= mission.budget
          ? 'Reduce expensive food crates or heavy rations on the Astronaut Food page.'
          : 'Pick more economical rocket parts or fewer bonus experiments in the Rocket Builder.',
    });
  }

  if (thrustKn < mission.minThrustKn || totalWeightTons > engine.maxWeightTons) {
    const overloadedByFood =
      rocketWeightKg / 1000 <= engine.maxWeightTons &&
      totalWeightTons > engine.maxWeightTons;
    failures.push({
      code: 'LOW_THRUST_HEAVY_WEIGHT',
      stage: 'liftoff',
      progressStop: 0.18,
      redirectTo: overloadedByFood ? 'food' : 'rocket',
      title: 'Launchpad Crash: Rocket Too Heavy for Engine Thrust!',
      explanation: overloadedByFood
        ? `Adding ${foodWeightKg.toLocaleString()} kg of astronaut food pushed your rocket weight to ${totalWeightTons} t, exceeding the ${engine.name} engine's ${engine.maxWeightTons} t lift limit!`
        : `Your ${engine.name} engine (${thrustKn} kN thrust, max lift ${engine.maxWeightTons} t) could not lift your ${totalWeightTons} t rocket off the launchpad (Minimum ${mission.minThrustKn} kN required for ${mission.name}).`,
      fixHint: overloadedByFood
        ? 'Return to the Food page and select lighter freeze-dried rations, or upgrade your Engine in the Rocket Builder!'
        : `Return to the Rocket Builder and equip a stronger engine (at least ${mission.minThrustKn} kN thrust).`,
    });
  }

  if (!isTrajectoryAcceptable) {
    failures.push({
      code: 'BAD_TRAJECTORY',
      stage: 'orbit',
      progressStop: 0.42,
      redirectTo: 'trajectory',
      title: `Off-Course Lost in Space (${trajectoryAccuracyPct}% Trajectory Accuracy < 40%)`,
      explanation: `You launched at ${launchAngleDeg}° using "${chosenTrajectoryObj.name}", resulting in ${trajectoryAccuracyPct}% trajectory accuracy (minimum 40% required). Your spacecraft missed the ${mission.name} orbital intercept corridor!`,
      fixHint: `Adjust your Launch Angle closer to ${mission.optimalAngleDeg}° and select "${optimalTrajectoryObj.name}" before launching.`,
    });
  }

  if (tank.tankLevel < mission.requiredTankLevel) {
    failures.push({
      code: 'OUT_OF_FUEL',
      stage: 'cruise',
      progressStop: 0.58,
      redirectTo: 'rocket',
      title: 'Engines Flamed Out: Insufficient Fuel Tank Size!',
      explanation: `Your ${tank.name} (${tank.fuelKg.toLocaleString()} kg fuel) burned out halfway across the ${mission.distanceKm} journey to ${mission.name}!`,
      fixHint: `Return to the Rocket Builder and equip a larger Fuel Tank for ${mission.name}.`,
    });
  }

  if (coating.coatingLevel < mission.requiredCoatingLevel) {
    failures.push({
      code: 'TANK_FROZE_RUPTURED',
      stage: 'cruise',
      progressStop: 0.68,
      redirectTo: 'rocket',
      title: 'Cryogenic Tank Rupture: Fuel Coating Too Thin!',
      explanation: `${mission.name} reaches ${mission.avgTemp}, but you equipped "${coating.name}" (${coating.statLabel}). In deep space, the extreme cold froze the propellant lines and cracked the thinly coated fuel tank!`,
      fixHint:
        mission.id === 'neptune'
          ? 'Neptune (-214°C) requires the heavy Thick Cryo-Armor tank coating in the Rocket Builder!'
          : 'Mars (-65°C) requires at least the Mid Cryo-Foam tank coating in the Rocket Builder!',
    });
  }

  if (totalFoodDays < mission.requiredFoodDays) {
    failures.push({
      code: 'STARVATION_ABORT',
      stage: 'cruise',
      progressStop: 0.76,
      redirectTo: 'food',
      title: 'Life Support Emergency: Astronauts Ran Out of Food!',
      explanation: `${mission.name} requires at least ${mission.requiredFoodDays} days of astronaut food rations, but you only packed ${totalFoodDays} days of supplies! The crew had to abort the mission mid-flight.`,
      fixHint: `Return to the Astronaut Food page and pack at least ${mission.requiredFoodDays} days of rations.`,
    });
  }

  if (nose.heatLevel < mission.requiredHeatLevel) {
    failures.push({
      code: 'HEAT_SHIELD_BURNUP',
      stage: 'arrival',
      progressStop: 0.88,
      redirectTo: 'rocket',
      title: 'Atmospheric Entry Burn-Up: Weak Nose Cone Shielding!',
      explanation: `Upon arriving at ${mission.name}, high-velocity atmospheric entry heat melted your ${nose.name}!`,
      fixHint: `Return to the Rocket Builder and equip ${
        mission.requiredHeatLevel === 3 ? 'the Heat Shield Nose Cone' : 'at least the Aero Cone or Heat Shield'
      }.`,
    });
  }

  const hasRequiredExperiment = selectedExperiments.some(
    (e) => e.id === mission.requiredExperimentId
  );
  const requiredExpObj = SCIENCE_EXPERIMENTS.find(
    (e) => e.id === mission.requiredExperimentId
  );

  if (!hasRequiredExperiment) {
    failures.push({
      code: 'MISSING_REQUIRED_EXPERIMENT',
      stage: 'arrival',
      progressStop: 0.94,
      redirectTo: 'rocket',
      title: 'Science Failure: Missing Mandatory Mission Experiment!',
      explanation: `Your rocket reached ${mission.name}, but you forgot to install the mandatory "${requiredExpObj?.name}" needed to complete the primary science objective!`,
      fixHint: `Return to the Rocket Builder and check "${requiredExpObj?.name}" under Science Experiments.`,
    });
  }

  const primaryFailure = failures.length > 0 ? failures[0] : null;
  const isMissionSuccess = failures.length === 0;

  const totalMissionScore = isMissionSuccess
    ? Math.round(
        experimentsScore +
          foodMoraleScore +
          budgetEfficiencyBonus +
          Math.round(trajectoryAccuracyPct * 3)
      )
    : 0;

  return {
    mission,
    nose,
    tank,
    coating,
    fins,
    engine,
    selectedExperiments,
    hasRequiredExperiment,
    requiredExpObj,
    // Costs
    corePartsCost,
    experimentsCost,
    rocketCost,
    foodDirectCost,
    foodWeightRocketSurcharge,
    totalFoodCost,
    totalSpent,
    remainingBudget,
    budgetLeftAfterRocket,
    // Weights & Stats
    rocketWeightKg,
    foodWeightKg,
    totalWeightKg,
    totalWeightTons,
    thrustKn,
    stabilityPct,
    // Food
    selectedFoodItems,
    totalFoodDays,
    foodMoraleScore,
    // Trajectory
    launchAngleDeg,
    trajectoryId,
    chosenTrajectoryObj,
    optimalTrajectoryObj,
    trajectoryAccuracyPct,
    isTrajectoryAcceptable,
    // Outcome
    failures,
    primaryFailure,
    isMissionSuccess,
    experimentsScore,
    budgetEfficiencyBonus,
    totalMissionScore,
  };
}
