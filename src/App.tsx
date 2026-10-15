import React, { useState, useEffect, useMemo, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  RaceScenario,
  CircuitInfo,
  RivalCar,
  DecisionLogEntry,
  WhatIfSnapshot,
  StrategyEvaluationResult
} from './types/strategy';
import { CIRCUITS } from './engine/circuitsData';
import { SCENARIO_PRESETS } from './engine/presets';
import { evaluateScenario } from './engine/simulationEngine';
import { soundFx } from './utils/audioSynth';

// Components
import { Header } from './components/Header';
import { TelemetryBar } from './components/TelemetryBar';
import { CircuitViewer3D } from './components/CircuitViewer3D';
import { StrategyCards } from './components/StrategyCards';
import { StrategyCharts } from './components/StrategyCharts';
import { TriggerMatrix } from './components/TriggerMatrix';
import { RivalMonitor } from './components/RivalMonitor';
import { ScenarioControls } from './components/ScenarioControls';
import { WhatIfModal } from './components/WhatIfModal';
import { DecisionLog } from './components/DecisionLog';
import { EventTimeline, SimulationEvent } from './components/EventTimeline';
import { ModelAssumptionsModal } from './components/ModelAssumptionsModal';

// Icons
import {
  Play,
  RotateCcw,
  Sparkles,
  GitCompare,
  BookOpen,
  Volume2,
  VolumeX,
  FastForward,
  Info,
  ShieldCheck,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';

export function App() {
  // Main Scenario state initialized to Championship Decider (Default scenario: Lap 31/53, P3, SC deployed, rain approaching)
  const [scenario, setScenario] = useState<RaceScenario>(() => {
    return JSON.parse(JSON.stringify(SCENARIO_PRESETS.championship_decider));
  });

  // Selected car on track
  const [selectedCarId, setSelectedCarId] = useState<string>('player');
  const [selectedStrategyId, setSelectedStrategyId] = useState<string | undefined>(undefined);

  // Modals state
  const [isWhatIfOpen, setIsWhatIfOpen] = useState<boolean>(false);
  const [isModelAssumptionsOpen, setIsModelAssumptionsOpen] = useState<boolean>(false);
  const [snapshotA, setSnapshotA] = useState<WhatIfSnapshot | null>(null);

  // Audio mute state
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);

  // Initial event timeline items
  const [events, setEvents] = useState<SimulationEvent[]>([
    {
      id: 'evt_1',
      time: '14:28:10',
      lap: 31,
      type: 'SAFETY_CAR',
      title: 'Safety Car Deployed (Neutralization)',
      description: 'Incident at Turn 8. Full Safety Car delta active. Pit window open with ~11.3s discounted loss.',
      severity: 'WARNING'
    },
    {
      id: 'evt_2',
      time: '14:28:35',
      lap: 31,
      type: 'RIVAL_ACTION',
      title: 'Rival P2 (M. Keller) Pitting for Softs',
      description: 'Unexpected rival box call into pit lane to fit Soft compound.',
      severity: 'INFO'
    },
    {
      id: 'evt_3',
      time: '14:29:02',
      lap: 31,
      type: 'WEATHER',
      title: 'Rain Cell Approaching on Radar',
      description: 'Precipitation expected on Lap 35. Projected peak wetness ~58% (Inter crossover window).',
      severity: 'INFO'
    },
    {
      id: 'evt_4',
      time: '14:29:15',
      lap: 31,
      type: 'TIRE_WARNING',
      title: 'Hard Compound Wear Critical (>65%)',
      description: 'Our car #7 tire degradation accelerating. Time loss projected to worsen by 0.25s/lap.',
      severity: 'WARNING'
    }
  ]);

  // Decision log entries
  const [logEntries, setLogEntries] = useState<DecisionLogEntry[]>([]);

  // Current circuit data
  const currentCircuit: CircuitInfo = useMemo(() => {
    return CIRCUITS[scenario.circuitId] || CIRCUITS.monaco;
  }, [scenario.circuitId]);

  // Real-time strategy evaluation
  const evaluation: StrategyEvaluationResult = useMemo(() => {
    return evaluateScenario(scenario);
  }, [scenario]);

  // Log recording effect whenever decisive evaluation shifts
  useEffect(() => {
    const recommended = evaluation.rankedStrategies[0];
    if (!recommended) return;

    const stayOutStrat = evaluation.rankedStrategies.find((s) => s.id === 'strat_stay_out');
    const stayOutTime = stayOutStrat ? stayOutStrat.totalRemainingTimeSec : recommended.totalRemainingTimeSec;
    const advantage = stayOutTime - recommended.totalRemainingTimeSec;

    const newEntry: DecisionLogEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toLocaleTimeString(),
      circuitName: currentCircuit.name,
      currentLap: scenario.currentLap,
      weatherState: `${scenario.currentWeather} (${scenario.currentTrackWetnessPercent}%)`,
      safetyCarState: scenario.safetyCarStatus,
      recommendedStrategy: recommended.name,
      recommendedCompound: recommended.targetCompound,
      pitLap: recommended.pitLap ? `Lap ${recommended.pitLap}` : 'Stay Out',
      projectedPosition: recommended.projectedPosition,
      advantageOverStayOutSec: Number(advantage.toFixed(2)),
      confidenceScore: recommended.confidenceScore,
      decisiveReason: evaluation.keyDecisiveFactor
    };

    setLogEntries((prev) => [newEntry, ...prev.slice(0, 39)]); // Keep last 40 entries
  }, [
    scenario.circuitId,
    scenario.rainForecastLap,
    scenario.safetyCarStatus,
    scenario.tireWearPercent,
    scenario.fuelRemainingKg,
    scenario.degMultiplier
  ]);

  // Confetti trigger if winning call projects P1
  useEffect(() => {
    const topStrat = evaluation.rankedStrategies[0];
    if (topStrat && topStrat.projectedPosition === 1 && topStrat.confidenceScore >= 75) {
      confetti({
        particleCount: 25,
        spread: 60,
        origin: { y: 0.85 },
        colors: ['#00f0ff', '#10b981', '#f59e0b']
      });
    }
  }, [evaluation.recommendedStrategyId, scenario.circuitId]);

  // Circuit switch handler
  const handleSelectCircuit = (circuitId: string) => {
    setScenario((prev) => ({
      ...prev,
      circuitId
    }));

    setEvents((prev) => [
      {
        id: `evt_${Date.now()}`,
        time: new Date().toLocaleTimeString(),
        lap: scenario.currentLap,
        type: 'STRATEGY_SHIFT',
        title: `Switched Circuit to ${CIRCUITS[circuitId]?.name || circuitId}`,
        description: `Recalculated base lap pace (${CIRCUITS[circuitId]?.baseLapTimeSec}s) and SC pit loss (${CIRCUITS[circuitId]?.scPitLaneDeltaSec}s).`,
        severity: 'INFO'
      },
      ...prev
    ]);
  };

  // Preset switch handler
  const handleSelectPreset = (presetId: string) => {
    const preset = SCENARIO_PRESETS[presetId];
    if (!preset) return;
    setScenario(JSON.parse(JSON.stringify(preset)));

    setEvents((prev) => [
      {
        id: `evt_${Date.now()}`,
        time: new Date().toLocaleTimeString(),
        lap: preset.currentLap,
        type: 'STRATEGY_SHIFT',
        title: `Loaded Preset: "${preset.title}"`,
        description: `Reset parameters for Lap ${preset.currentLap}/${preset.totalLaps}, Weather ${preset.currentWeather}, SC ${preset.safetyCarStatus}.`,
        severity: 'SUCCESS'
      },
      ...prev
    ]);
  };

  // Reset to opening scenario
  const handleResetScenario = () => {
    setScenario(JSON.parse(JSON.stringify(SCENARIO_PRESETS.championship_decider)));
    setEvents((prev) => [
      {
        id: `evt_${Date.now()}`,
        time: new Date().toLocaleTimeString(),
        lap: 31,
        type: 'STRATEGY_SHIFT',
        title: 'Reset to Championship Decider Scenario',
        description: 'Restored baseline: Lap 31/53, P3, accelerating wear, Safety Car active, rain in 4 laps.',
        severity: 'INFO'
      },
      ...prev
    ]);
  };

  // Scenario updates handler
  const handleUpdateScenario = (updates: Partial<RaceScenario>) => {
    soundFx.playTelemetryClick();
    setScenario((prev) => {
      const next = { ...prev, ...updates };

      // Generate context events if critical parameters moved
      if (updates.rainForecastLap && updates.rainForecastLap !== prev.rainForecastLap) {
        setEvents((evts) => [
          {
            id: `evt_${Date.now()}`,
            time: new Date().toLocaleTimeString(),
            lap: prev.currentLap,
            type: 'WEATHER',
            title: `Weather Forecast Updated: Rain at Lap ${updates.rainForecastLap}`,
            description: `Precipitation arrival shift from L${prev.rainForecastLap} to L${updates.rainForecastLap}. Crossover threshold adjusting.`,
            severity: 'INFO'
          },
          ...evts
        ]);
      }

      if (updates.safetyCarStatus && updates.safetyCarStatus !== prev.safetyCarStatus) {
        if (updates.safetyCarStatus === 'FULL_SC') soundFx.playSafetyCarAlert();
        setEvents((evts) => [
          {
            id: `evt_${Date.now()}`,
            time: new Date().toLocaleTimeString(),
            lap: prev.currentLap,
            type: 'SAFETY_CAR',
            title: `Safety Car Status: ${updates.safetyCarStatus}`,
            description: updates.safetyCarStatus === 'FULL_SC' ? 'Neutralization active. Pit delta discounted.' : 'Track green flag racing resumed.',
            severity: updates.safetyCarStatus === 'FULL_SC' ? 'WARNING' : 'SUCCESS'
          },
          ...evts
        ]);
      }

      return next;
    });
  };

  // Step simulation forward by 1 lap
  const handleStepLap = () => {
    if (scenario.currentLap >= scenario.totalLaps) return;
    soundFx.playTelemetryClick();

    setScenario((prev) => {
      const nextLap = prev.currentLap + 1;
      const nextScLaps = Math.max(0, prev.safetyCarLapsRemaining - 1);
      const nextScStatus = nextScLaps === 0 ? 'NONE' : prev.safetyCarStatus;
      const nextWear = Math.min(100, prev.tireWearPercent + (3.2 * prev.degMultiplier));
      const nextFuel = Math.max(0, prev.fuelRemainingKg - prev.fuelConsumptionPerLapKg);

      return {
        ...prev,
        currentLap: nextLap,
        tireAgeLaps: prev.tireAgeLaps + 1,
        tireWearPercent: Number(nextWear.toFixed(1)),
        fuelRemainingKg: Number(nextFuel.toFixed(1)),
        safetyCarLapsRemaining: nextScLaps,
        safetyCarStatus: nextScStatus
      };
    });
  };

  // Rival update handler
  const handleUpdateRival = (updatedRival: RivalCar) => {
    soundFx.playTelemetryClick();
    setScenario((prev) => ({
      ...prev,
      rivals: prev.rivals.map((r) => (r.id === updatedRival.id ? updatedRival : r))
    }));

    setEvents((prev) => [
      {
        id: `evt_${Date.now()}`,
        time: new Date().toLocaleTimeString(),
        lap: scenario.currentLap,
        type: 'RIVAL_ACTION',
        title: `Rival Strategy Updated: ${updatedRival.name}`,
        description: updatedRival.plannedPitLap
          ? `Planned pit stop set for Lap ${updatedRival.plannedPitLap} for ${updatedRival.plannedPitCompound}.`
          : 'Committed to staying out on current set.',
        severity: 'INFO'
      },
      ...prev
    ]);
  };

  // What-If Snapshot A saver
  const handleSaveSnapshotA = () => {
    soundFx.playRadioBeep();
    setSnapshotA({
      scenarioName: `${currentCircuit.name} (L${scenario.currentLap})`,
      scenario: JSON.parse(JSON.stringify(scenario)),
      evaluation: JSON.parse(JSON.stringify(evaluation))
    });
  };

  // Revert back to Snapshot A
  const handleRevertToA = (scenarioA: RaceScenario) => {
    soundFx.playRadioBeep();
    setScenario(JSON.parse(JSON.stringify(scenarioA)));
  };

  // Sound toggle
  const handleToggleAudio = () => {
    const nextMuted = !isAudioMuted;
    setIsAudioMuted(nextMuted);
    soundFx.setMuted(nextMuted);
    if (!nextMuted) soundFx.playRadioBeep();
  };

  // Keyboard shortcut navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.key === 'r' || e.key === 'R') {
        handleResetScenario();
      } else if (e.key === 'w' || e.key === 'W') {
        setIsWhatIfOpen((prev) => !prev);
      } else if (e.key === 'm' || e.key === 'M') {
        setIsModelAssumptionsOpen((prev) => !prev);
      } else if (e.key === 's' || e.key === 'S') {
        handleToggleAudio();
      } else if (e.code === 'Space') {
        e.preventDefault();
        handleStepLap();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [scenario.currentLap, scenario.totalLaps, isAudioMuted]);

  return (
    <div className="min-h-screen bg-[#080b12] text-slate-100 flex flex-col font-mono selection:bg-cyan-500 selection:text-slate-950">
      {/* 1. Header with Circuit & Preset Selectors */}
      <Header
        currentCircuit={currentCircuit}
        scenario={scenario}
        onSelectCircuit={handleSelectCircuit}
        onSelectPreset={handleSelectPreset}
        onResetScenario={handleResetScenario}
        onOpenWhatIf={() => setIsWhatIfOpen(true)}
        onOpenModelAssumptions={() => setIsModelAssumptionsOpen(true)}
        isAudioMuted={isAudioMuted}
        onToggleAudio={handleToggleAudio}
      />

      {/* Main Pitwall Control Center Body */}
      <main className="flex-1 w-full max-w-[1720px] mx-auto p-3 sm:p-4.5 flex flex-col gap-4">
        {/* 2. Real-time Telemetry Bar */}
        <TelemetryBar scenario={scenario} evaluation={evaluation} />

        {/* 3. Row: 3D Interactive Circuit View & Strategy Recommendation Cards */}
        <div className="w-full grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
          {/* Left Column (7 cols): Interactive 3D Circuit / Overhead Map View */}
          <div className="xl:col-span-7 flex flex-col gap-2">
            <CircuitViewer3D
              circuit={currentCircuit}
              scenario={scenario}
              selectedCarId={selectedCarId}
              onSelectCar={(id) => {
                soundFx.playTelemetryClick();
                setSelectedCarId(id);
              }}
            />

            {/* Quick Simulation Advancement Bar */}
            <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800 p-2.5 rounded-xl text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">RACE PROGRESS:</span>
                <span className="font-bold text-white">
                  LAP {scenario.currentLap} / {scenario.totalLaps}
                </span>
                <span className="text-slate-500">
                  ({Math.round((scenario.currentLap / scenario.totalLaps) * 100)}%)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleStepLap}
                  disabled={scenario.currentLap >= scenario.totalLaps}
                  className="flex items-center gap-1.5 px-3 py-1 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-slate-950 font-bold rounded-lg transition-all shadow-md shadow-cyan-600/20"
                  title="Simulate Next Lap [Space]"
                >
                  <FastForward className="w-3.5 h-3.5" />
                  STEP LAP (+1)
                </button>

                <button
                  onClick={handleResetScenario}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white rounded-lg transition-colors border border-slate-700"
                  title="Reset to Opening Scenario [R]"
                >
                  <RotateCcw className="w-3 h-3" />
                  RESET [R]
                </button>
              </div>
            </div>
          </div>

          {/* Right Column (5 cols): Strategy Decision Cards Ranked by Math Model */}
          <div className="xl:col-span-5">
            <StrategyCards
              evaluation={evaluation}
              selectedStrategyId={selectedStrategyId}
              onSelectStrategy={(id) => {
                soundFx.playTelemetryClick();
                setSelectedStrategyId(id);
              }}
            />
          </div>
        </div>

        {/* 4. Strategy Charts (Lap Pace, Tire Wear, Wet Crossover, Time Delta) */}
        <StrategyCharts evaluation={evaluation} scenario={scenario} />

        {/* 5. Trigger Matrix & Fallback Plan */}
        <TriggerMatrix evaluation={evaluation} />

        {/* 6. Row: Rival Grid Monitor & Real-Time Incident Timeline */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          <div className="lg:col-span-8">
            <RivalMonitor rivals={scenario.rivals} onUpdateRival={handleUpdateRival} />
          </div>
          <div className="lg:col-span-4">
            <EventTimeline events={events} />
          </div>
        </div>

        {/* 7. Pitwall Scenario Parameter Lab (Live tuning sliders) */}
        <ScenarioControls
          scenario={scenario}
          onUpdateScenario={handleUpdateScenario}
          onResetScenario={handleResetScenario}
        />

        {/* 8. Decision Log (Audit History & CSV Export) */}
        <DecisionLog
          logEntries={logEntries}
          onClearLog={() => {
            soundFx.playTelemetryClick();
            setLogEntries([]);
          }}
        />
      </main>

      {/* Footer & Data Demarcation Disclaimer */}
      <footer className="w-full bg-[#06080e] border-t border-slate-800/80 px-4 py-3 text-[11px] font-mono text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <strong className="text-slate-300">APEX PITWALL DECISION SYSTEM</strong>
          <span>— Hackathon Prototype</span>
        </div>

        <div className="text-center sm:text-right text-slate-400">
          Independent predictive prototype. Not affiliated with Formula 1 or the FIA. Model calculations based on synthetic simulation parameters.
        </div>
      </footer>

      {/* Modals */}
      <WhatIfModal
        isOpen={isWhatIfOpen}
        onClose={() => setIsWhatIfOpen(false)}
        snapshotA={snapshotA}
        currentScenario={scenario}
        onSaveSnapshotA={handleSaveSnapshotA}
        onRevertToA={handleRevertToA}
      />

      <ModelAssumptionsModal
        isOpen={isModelAssumptionsOpen}
        onClose={() => setIsModelAssumptionsOpen(false)}
      />
    </div>
  );
}

export default App;
