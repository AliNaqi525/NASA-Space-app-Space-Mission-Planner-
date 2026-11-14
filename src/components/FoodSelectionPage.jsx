import React from 'react';
import SpaceportScene from './SpaceportScene.jsx';
import { FOOD_CATALOG } from '../data/missionCatalog.js';
import {
  ArrowLeft,
  Utensils,
  Plus,
  Minus,
  Weight,
  Calendar,
  Rocket,
  Sparkles,
  Lock,
} from 'lucide-react';

export default function FoodSelectionPage({
  evaluation,
  foodQuantities,
  onUpdateFoodQty,
  onAutoPackFood,
  onBackToRocket,
  onProceedToLaunch,
  room,
  myAssignedRoles = ['commander', 'propulsion', 'payload', 'lifesupport'],
  walkthroughStep = 0,
  onWalkthroughStepComplete,
}) {
  const {
    mission,
    engine,
    foodDirectCost,
    foodWeightRocketSurcharge,
    remainingBudget,
    budgetLeftAfterRocket,
    rocketWeightKg,
    foodWeightKg,
    totalWeightTons,
    totalFoodDays,
    foodMoraleScore,
  } = evaluation;

  const canEditFood =
    !room || !room.strictRoleLock || myAssignedRoles.includes('lifesupport');

  const lifeSupportOwner = room
    ? room.players.find((p) => (p.assignedRoles || []).includes('lifesupport'))
        ?.username || 'Teammate'
    : 'You';

  const daysProgressPct = Math.min(
    100,
    Math.round((totalFoodDays / mission.requiredFoodDays) * 100)
  );

  return (
    <SpaceportScene showCharacter={true} showTowers={true}>
      {/* Top Cartoon Bar */}
      <div className="relative z-20 w-full max-w-7xl mx-auto px-5 pt-3 flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={onBackToRocket}
          className="bg-white/95 hover:bg-white border-4 border-[#93c5fd] rounded-full px-5 py-2 shadow-lg flex items-center gap-2 text-[#1e3a8a] font-black text-sm transition"
        >
          <ArrowLeft className="w-5 h-5" /> Back to Rocket Builder
        </button>

        <div className="bg-white/95 border-4 border-[#93c5fd] rounded-full px-8 py-2 shadow-xl flex items-center gap-2.5">
          <Utensils className="w-5 h-5 text-[#d97706]" />
          <span className="font-black text-lg text-[#1e3a8a]">
            Astronaut Food & Ration Supply ({mission.name})
          </span>
        </div>

        <div className="bg-white/95 border-4 border-[#93c5fd] rounded-full px-6 py-1.5 shadow-xl flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#f59e0b] border-2 border-[#fde047] flex items-center justify-center text-white font-black text-base">
            $
          </div>
          <div>
            <div className="text-[10px] font-extrabold uppercase text-slate-400 leading-none">
              SHARED BUDGET LEFT
            </div>
            <div
              className={`text-base font-black leading-tight ${
                remainingBudget < 0 ? 'text-rose-600' : 'text-emerald-600'
              }`}
            >
              ${remainingBudget.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="relative z-20 flex-1 max-w-7xl w-full mx-auto px-5 py-4 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Food Supply Catalog Cards */}
        <div
          className={`lg:col-span-7 bg-white/95 backdrop-blur-md border-4 border-[#93c5fd] rounded-3xl p-6 shadow-2xl space-y-4 text-[#1e3a8a] ${
            !canEditFood ? 'opacity-75' : ''
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-slate-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-[#1e3a8a]">
                  Select Astronaut Rations
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-900 font-black text-xs">
                  🍱 Life Support Role ({lifeSupportOwner})
                </span>
              </div>
              <p className="text-xs font-bold text-slate-500 mt-0.5">
                Bought with shared leftover budget! Food weight adds +$45/kg in extra rocket launch fuel cost.
              </p>
            </div>
            <button
              onClick={() => {
                if (!canEditFood) return;
                onAutoPackFood();
                if (walkthroughStep === 5 && onWalkthroughStepComplete) {
                  onWalkthroughStepComplete(5);
                }
              }}
              disabled={!canEditFood}
              className={`px-4 py-2 rounded-full bg-[#eff6ff] hover:bg-[#dbeafe] disabled:opacity-50 text-[#1d4ed8] border-2 border-[#93c5fd] font-black text-xs flex items-center gap-1.5 transition ${
                walkthroughStep === 5
                  ? 'ring-4 ring-[#facc15] bg-[#fef08a] text-[#1e3a8a] shadow-lg'
                  : ''
              }`}
            >
              <Sparkles className="w-4 h-4" /> Auto-Pack for {mission.requiredFoodDays} Days
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {FOOD_CATALOG.map((item) => {
              const qty = Number(foodQuantities[item.id] || 0);
              const weightSurcharge = item.weightKg * 45;
              const effectiveTotalPerPack = item.baseCost + weightSurcharge;
              const isHighlight =
                walkthroughStep === 5 && item.id === 'food_pouches';

              return (
                <div
                  key={item.id}
                  className={`relative p-4 rounded-2xl border-2 flex flex-col justify-between transition ${
                    isHighlight
                      ? 'bg-[#fef08a] border-[#eab308] ring-4 ring-[#facc15] shadow-[0_0_25px_rgba(250,204,21,0.9)]'
                      : qty > 0
                      ? 'bg-[#fef9c3] border-[#f59e0b] shadow-md'
                      : 'bg-[#f8fafc] border-[#e2e8f0]'
                  }`}
                >
                  {isHighlight && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 px-3 py-0.5 rounded-full bg-[#1e3a8a] text-[#fef08a] font-black text-[9px] uppercase whitespace-nowrap shadow animate-bounce">
                      👆 STEP 5: CLICK + TO ADD 14 DAYS OF RATIONS
                    </span>
                  )}
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="text-3xl">{item.icon}</span>
                        <div>
                          <h3 className="text-sm font-black text-[#1e3a8a]">
                            {item.name}
                          </h3>
                          <span className="text-[11px] font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                            +{item.daysProvided} Days • +{item.moraleScore} Score
                          </span>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs font-semibold text-slate-600 mt-2">
                      {item.description}
                    </p>

                    <div className="mt-3 pt-2 border-t border-slate-200/80 grid grid-cols-2 gap-1 text-[11px] font-bold">
                      <div>
                        <span className="text-slate-400 block">PACK PRICE</span>
                        <span className="text-[#1e3a8a] font-black">
                          ${item.baseCost.toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">WEIGHT + ROCKET FEE</span>
                        <span className="text-amber-700 font-black">
                          {item.weightKg}kg (+${weightSurcharge.toLocaleString()})
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quantity Stepper */}
                  <div className="mt-3 pt-2.5 border-t border-slate-200/80 flex items-center justify-between">
                    <span className="text-xs font-extrabold text-slate-500">
                      Total: ${effectiveTotalPerPack.toLocaleString()}/crate
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={!canEditFood}
                        onClick={() =>
                          canEditFood &&
                          onUpdateFoodQty(item.id, Math.max(0, qty - 1), item.name)
                        }
                        className="w-8 h-8 rounded-full bg-white border-2 border-[#3b82f6] flex items-center justify-center text-[#1e3a8a] font-black hover:bg-blue-50 disabled:opacity-40"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-7 text-center font-black text-base text-[#1e3a8a]">
                        {qty}
                      </span>
                      <button
                        type="button"
                        disabled={!canEditFood}
                        onClick={() => {
                          if (!canEditFood) return;
                          onUpdateFoodQty(item.id, qty + 1, item.name);
                          if (isHighlight && onWalkthroughStepComplete) {
                            onWalkthroughStepComplete(5);
                          }
                        }}
                        className={`w-8 h-8 rounded-full bg-[#2563eb] text-white flex items-center justify-center font-black hover:bg-[#1d4ed8] disabled:opacity-40 ${
                          isHighlight ? 'ring-4 ring-[#1e3a8a] scale-110' : ''
                        }`}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Crew Provisioning & Weight Impact Summary Card */}
        <div className="lg:col-span-5 bg-white/95 backdrop-blur-md border-4 border-[#93c5fd] rounded-3xl p-6 shadow-2xl space-y-4 text-[#1e3a8a]">
          <h3 className="text-base font-black uppercase tracking-wider text-[#1e3a8a]">
            🍱 Life Support & Shared Budget Impact
          </h3>

          {/* 1. Mission Days Requirement */}
          <div className="bg-[#eff6ff] p-4 rounded-2xl border-2 border-[#bfdbfe]">
            <div className="flex items-center justify-between text-xs font-black mb-1">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4 text-[#2563eb]" /> RATION DAYS PACKED
              </span>
              <span
                className={
                  totalFoodDays >= mission.requiredFoodDays
                    ? 'text-emerald-600'
                    : 'text-rose-600'
                }
              >
                {totalFoodDays} / {mission.requiredFoodDays} Days Required
              </span>
            </div>
            <div className="w-full h-3.5 bg-white rounded-full overflow-hidden border border-blue-200">
              <div
                className={`h-full transition-all duration-300 ${
                  totalFoodDays >= mission.requiredFoodDays
                    ? 'bg-emerald-500'
                    : 'bg-amber-500'
                }`}
                style={{ width: `${daysProgressPct}%` }}
              />
            </div>
            {totalFoodDays < mission.requiredFoodDays && (
              <p className="text-[11px] font-bold text-rose-600 mt-1.5">
                ⚠️ Pack at least {mission.requiredFoodDays - totalFoodDays} more days of food so your Mission Prep Bar can reach 100%!
              </p>
            )}
          </div>

          {/* 2. Budget & Rocket Weight Surcharge Breakdown */}
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
              <span className="text-slate-500 font-semibold">
                Shared Budget Left After Rocket
              </span>
              <span className="font-black text-[#1e3a8a]">
                ${budgetLeftAfterRocket.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
              <span className="text-slate-500 font-semibold">
                Food Crates Direct Cost
              </span>
              <span className="font-bold text-[#1e3a8a]">
                ${foodDirectCost.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
              <span className="text-slate-500 font-semibold">
                Food Weight Rocket Fuel Fee ({foodWeightKg} kg × $45)
              </span>
              <span className="font-bold text-amber-600">
                +${foodWeightRocketSurcharge.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
              <span className="text-slate-500 font-semibold">
                Astronaut Morale Bonus Score
              </span>
              <span className="font-black text-emerald-600">
                +{foodMoraleScore} pts
              </span>
            </div>
            <div className="flex items-center justify-between pt-1 text-base font-black">
              <span>Remaining Team Budget</span>
              <span
                className={
                  remainingBudget < 0 ? 'text-rose-600' : 'text-emerald-600'
                }
              >
                ${remainingBudget.toLocaleString()}
              </span>
            </div>
          </div>

          {/* 3. Total Rocket + Food Weight vs Engine Lift Limit */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border-2 border-slate-200">
            <div className="flex items-center justify-between text-xs font-black">
              <span className="flex items-center gap-1">
                <Weight className="w-4 h-4 text-[#2563eb]" /> TOTAL ROCKET + FOOD WEIGHT
              </span>
              <span
                className={
                  totalWeightTons > engine.maxWeightTons
                    ? 'text-rose-600'
                    : 'text-[#1e3a8a]'
                }
              >
                {totalWeightTons} t / {engine.maxWeightTons} t ({engine.name} Limit)
              </span>
            </div>
            <div className="text-[11px] font-semibold text-slate-500 mt-1">
              Rocket Dry/Fuel: {(rocketWeightKg / 1000).toFixed(1)} t + Food Cargo:{' '}
              {(foodWeightKg / 1000).toFixed(2)} t
            </div>
          </div>

          <button
            onClick={() => {
              if (walkthroughStep === 6 && onWalkthroughStepComplete) {
                onWalkthroughStepComplete(6);
              } else {
                onProceedToLaunch();
              }
            }}
            className={`relative w-full py-4 rounded-full bg-[#f59e0b] hover:bg-[#eab308] text-[#1e3a8a] font-black text-base border-2 border-[#d97706] shadow-xl flex items-center justify-center gap-2 transition transform active:scale-95 ${
              walkthroughStep === 6
                ? 'ring-4 ring-[#facc15] shadow-[0_0_30px_rgba(250,204,21,0.95)] scale-[1.02]'
                : ''
            }`}
          >
            {walkthroughStep === 6 && (
              <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10 px-3 py-0.5 rounded-full bg-[#1e3a8a] text-[#fef08a] font-black text-[10px] uppercase whitespace-nowrap shadow animate-bounce">
                👆 STEP 6: CLICK TO GO TO LAUNCH PAD
              </span>
            )}
            <Rocket className="w-5 h-5" /> Proceed to Launch Angle & Solar System →
          </button>
        </div>
      </div>
    </SpaceportScene>
  );
}
