import React from 'react';
import { Sparkles, ArrowRight, X, CheckCircle2 } from 'lucide-react';

export const WALKTHROUGH_STEPS = [
  {
    step: 1,
    page: 'hub',
    roleBadge: '🎖️ Mission Selection',
    title: 'Step 1: Choose Your Planetary Mission (The Moon)',
    instruction:
      'Welcome to AstroBuilder! Each mission has a Shared Budget and Temperature challenge. The Moon ($1,000,000 budget, +100°C to -130°C) is warmer than Neptune (-200°C), so it uses a lighter, cheaper coated fuel tank.',
    highlightHint: 'Click the highlighted Moon Mission card or click "Auto-Select & Next"!',
    buttonText: 'Auto-Select Moon Mission →',
  },
  {
    step: 2,
    page: 'rocket',
    roleBadge: '🚀 Propulsion & Tank Role',
    title: 'Step 2: Select Required Fuel Tank & Thermal Coating',
    instruction:
      'In the Left Panel, select "Medium Tank" ($250,000 • 1,900 kg) and "Light Reflective Coat" ($100,000) for the Moon. (Freezing Neptune requires the Heavy Tank + Thick Cryo-Armor!).',
    highlightHint: 'Click "Medium Tank" on the left or click "Auto-Select & Next"!',
    buttonText: 'Auto-Select Tank & Coating →',
  },
  {
    step: 3,
    page: 'rocket',
    roleBadge: '🚀 Propulsion & Aero Roles',
    title: 'Step 3: Select Engine (Thrust) & Aerodynamics (Nose + Fins)',
    instruction:
      'Every part adds weight (kg). Your Engine Thrust must beat total weight (TWR ≥ 1.20) to lift off. Select "Thruster X" (48k N), "Aero Cone", and "Stabilizer" fins!',
    highlightHint: 'Click "Thruster X", "Aero Cone", or "Stabilizer", or click "Auto-Select & Next"!',
    buttonText: 'Auto-Select Engine & Aero →',
  },
  {
    step: 4,
    page: 'rocket',
    roleBadge: '🔬 Payload & Science Role',
    title: 'Step 4: Install Required Science Experiment (+400 Score)',
    instruction:
      'Every mission requires a mandatory Science Experiment to earn points! Select "Lunar Core Drill" (REQUIRED! +400 PTS) at the bottom of the Left Panel, then click "Confirm Build → Food".',
    highlightHint: 'Click "Lunar Core Drill" & "Confirm Build", or click "Auto-Select & Next"!',
    buttonText: 'Auto-Install Science & Go to Food →',
  },
  {
    step: 5,
    page: 'food',
    roleBadge: '🍱 Life Support & Rations Role',
    title: 'Step 5: Buy Astronaut Food with Leftover Shared Budget',
    instruction:
      'Food is bought with your leftover budget ($130,000 left), and its weight adds +$45/kg in extra rocket fuel cost. The Moon needs 14 Days of rations — add 1x "Freeze-Dried Astro Pouches" (+14 Days)!',
    highlightHint: 'Click "+" on Freeze-Dried Astro Pouches or click "Auto-Select & Next"!',
    buttonText: 'Auto-Select 14 Days of Food →',
  },
  {
    step: 6,
    page: 'food',
    roleBadge: '🍱 Proceed to Flight Deck',
    title: 'Step 6: Proceed to Solar System Trajectory Setup',
    instruction:
      'Rocket and Food are packed with $74,600 remaining under our $1M budget! Now click "Proceed to Launch Angle & Solar System" to set our flight trajectory.',
    highlightHint: 'Click the highlighted "Proceed to Launch Angle & Solar System" button!',
    buttonText: 'Go to Solar System Page →',
  },
  {
    step: 7,
    page: 'solar',
    roleBadge: '📐 Trajectory & Angle Role',
    title: 'Step 7: Set Launch Trajectory & Pitch Angle (80°)',
    instruction:
      'Before launching, select the "Direct Lunar Transfer" trajectory card and set Launch Pitch Angle to 80° (≥40% accuracy required). This brings the Top Mission Prep Bar to 100% READY!',
    highlightHint: 'Click "Direct Lunar Transfer" card below or click "Auto-Set Trajectory"!',
    buttonText: 'Auto-Set 80° & Direct Trajectory →',
  },
  {
    step: 8,
    page: 'solar',
    roleBadge: '🔥 Ready for Liftoff!',
    title: 'Step 8: Mission Prep is 100% Full — Launch Your Rocket!',
    instruction:
      'Trajectory is locked at 100% accuracy and the Top Mission Prep Bar is 100% FULL! Now click the glowing "Ignite Engines & Launch (100%)" button whenever you are ready to fly to the Moon!',
    highlightHint: 'Click "Ignite Engines & Launch (100%)" to launch!',
    buttonText: '🚀 Launch Rocket Now!',
  },
];

export default function DemoWalkthroughBar({
  walkthroughStep,
  onAutoAdvanceStep,
  onCloseWalkthrough,
  onSelectStep,
}) {
  if (!walkthroughStep || walkthroughStep < 1 || walkthroughStep > WALKTHROUGH_STEPS.length) {
    return null;
  }

  const current =
    WALKTHROUGH_STEPS.find((s) => s.step === walkthroughStep) || WALKTHROUGH_STEPS[0];

  return (
    <div className="relative z-30 w-full bg-[#1e3a8a] border-b-4 border-[#facc15] px-4 py-2.5 text-white shadow-lg">
      <div className="max-w-[1550px] mx-auto flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
        {/* Left: Coach Icon & Step Instructions */}
        <div className="flex items-start sm:items-center gap-3 flex-1">
          <div className="w-10 h-10 rounded-2xl bg-[#f59e0b] border-2 border-white text-[#1e3a8a] flex items-center justify-center shrink-0 shadow font-black text-lg">
            🧑‍🚀
          </div>
          <div className="space-y-0.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-[#facc15] text-[#1e3a8a] font-black text-[10px] uppercase tracking-wider">
                TRAINING WALKTHROUGH • STEP {current.step} OF {WALKTHROUGH_STEPS.length}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-blue-500/30 border border-blue-300/40 text-cyan-200 font-bold text-[10px]">
                {current.roleBadge}
              </span>
              {/* Step Dots */}
              <div className="flex items-center gap-1 ml-1">
                {WALKTHROUGH_STEPS.map((s) => (
                  <button
                    key={s.step}
                    type="button"
                    onClick={() => onSelectStep && onSelectStep(s.step)}
                    className={`w-2 h-2 rounded-full transition ${
                      s.step === current.step
                        ? 'bg-[#facc15] scale-125'
                        : s.step < current.step
                        ? 'bg-emerald-400'
                        : 'bg-white/30'
                    }`}
                    title={s.title}
                  />
                ))}
              </div>
              <span className="text-xs sm:text-sm font-black text-[#fef08a]">
                — {current.title}
              </span>
            </div>

            <p className="text-xs font-semibold text-blue-100 leading-snug">
              {current.instruction}{' '}
              <span className="text-emerald-300 font-black">
                ({current.highlightHint})
              </span>
            </p>
          </div>
        </div>

        {/* Right: Auto-Select & Next Button + Close */}
        <div className="flex items-center gap-2 shrink-0 w-full lg:w-auto justify-end">
          <button
            type="button"
            onClick={onAutoAdvanceStep}
            className="flex-1 lg:flex-initial px-4 py-2 rounded-full bg-[#f59e0b] hover:bg-[#eab308] text-[#1e3a8a] font-black text-xs border-2 border-white shadow-md flex items-center justify-center gap-1.5 transition transform hover:scale-105 active:scale-95"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{current.buttonText}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={onCloseWalkthrough}
            title="Close Training Walkthrough"
            className="px-2.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-blue-200 hover:text-white border border-white/20 text-xs font-bold flex items-center gap-1 transition"
          >
            <X className="w-3.5 h-3.5" /> Close
          </button>
        </div>
      </div>
    </div>
  );
}
