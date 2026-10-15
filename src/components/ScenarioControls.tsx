import React from 'react';
import { RaceScenario, SafetyCarStatus, TireCompound, WeatherCondition } from '../types/strategy';
import { Sliders, RotateCcw, CloudRain, ShieldAlert, Fuel, Gauge, Layers, RefreshCw } from 'lucide-react';

interface ScenarioControlsProps {
  scenario: RaceScenario;
  onUpdateScenario: (updated: Partial<RaceScenario>) => void;
  onResetScenario: () => void;
}

const COMPOUNDS: TireCompound[] = ['SOFT', 'MEDIUM', 'HARD', 'INTERMEDIATE', 'WET'];
const WEATHER_TYPES: WeatherCondition[] = ['DRY', 'DAMP', 'LIGHT_RAIN', 'HEAVY_RAIN', 'MONSOON'];
const SC_STATUSES: SafetyCarStatus[] = ['NONE', 'VIRTUAL', 'FULL_SC'];

export const ScenarioControls: React.FC<ScenarioControlsProps> = ({
  scenario,
  onUpdateScenario,
  onResetScenario
}) => {
  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 shadow-lg">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2.5 mb-3">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
            Pitwall Scenario Parameter Lab (Live Tuning)
          </h2>
          <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
            DYNAMIC RECALC
          </span>
        </div>

        <button
          onClick={onResetScenario}
          className="flex items-center gap-1.5 px-3 py-1 text-xs font-mono font-bold rounded bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-750 transition-colors border border-slate-700"
          title="Reset to Opening Scenario (Lap 31, P3, SC Active, Rain Approaching)"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          RESET TO DEFAULT SCENARIO
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Section 1: Weather & Rain Timing */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3 flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-blue-400 mb-2">
            <CloudRain className="w-3.5 h-3.5" />
            WEATHER & PRECIPITATION
          </div>

          <div className="space-y-2.5 text-xs font-mono">
            {/* Rain Forecast Lap */}
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Rain Forecast Lap:</span>
                <strong className="text-blue-400">Lap {scenario.rainForecastLap}</strong>
              </div>
              <input
                type="range"
                min={scenario.currentLap}
                max={scenario.totalLaps + 5}
                step={1}
                value={scenario.rainForecastLap}
                onChange={(e) => onUpdateScenario({ rainForecastLap: parseInt(e.target.value, 10) })}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <span className="text-[10px] text-slate-500 block mt-0.5">
                Current lap is L{scenario.currentLap}. Move closer to trigger immediate wet calls.
              </span>
            </div>

            {/* Peak Wetness Intensity */}
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Peak Rain Intensity:</span>
                <strong className="text-blue-400">{scenario.rainPeakIntensityPercent}%</strong>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={scenario.rainPeakIntensityPercent}
                onChange={(e) => onUpdateScenario({ rainPeakIntensityPercent: parseInt(e.target.value, 10) })}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>

            {/* Current Track Wetness */}
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Current Track Wetness:</span>
                <strong className="text-white">{scenario.currentTrackWetnessPercent}%</strong>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={2}
                value={scenario.currentTrackWetnessPercent}
                onChange={(e) => onUpdateScenario({ currentTrackWetnessPercent: parseInt(e.target.value, 10) })}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Safety Car State */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3 flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-amber-400 mb-2">
            <ShieldAlert className="w-3.5 h-3.5" />
            SAFETY CAR / NEUTRALIZATION
          </div>

          <div className="space-y-2.5 text-xs font-mono">
            {/* SC Status dropdown */}
            <div>
              <label className="text-slate-300 block mb-1">Neutralization Status:</label>
              <div className="grid grid-cols-3 gap-1">
                {SC_STATUSES.map((status) => (
                  <button
                    key={status}
                    onClick={() => onUpdateScenario({
                      safetyCarStatus: status,
                      safetyCarLapsRemaining: status === 'FULL_SC' ? Math.max(1, scenario.safetyCarLapsRemaining) : 0
                    })}
                    className={`py-1 text-[11px] font-bold rounded border transition-colors ${
                      scenario.safetyCarStatus === status
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    {status === 'FULL_SC' ? 'FULL SC' : status}
                  </button>
                ))}
              </div>
            </div>

            {/* SC Laps Remaining */}
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>SC Duration Estimate:</span>
                <strong className="text-amber-400">{scenario.safetyCarLapsRemaining} Laps</strong>
              </div>
              <input
                type="range"
                min={0}
                max={8}
                step={1}
                disabled={scenario.safetyCarStatus !== 'FULL_SC'}
                value={scenario.safetyCarLapsRemaining}
                onChange={(e) => onUpdateScenario({ safetyCarLapsRemaining: parseInt(e.target.value, 10) })}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500 disabled:opacity-30"
              />
              <span className="text-[10px] text-slate-500 block mt-0.5">
                SC pit loss discount (~11-14s saved) applies during active SC laps.
              </span>
            </div>

            {/* Strategy 5 Delay Laps */}
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Plan E Delay Laps:</span>
                <strong className="text-purple-400">+{scenario.pitDelayLaps} Laps (L{scenario.currentLap + scenario.pitDelayLaps})</strong>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                step={1}
                value={scenario.pitDelayLaps}
                onChange={(e) => onUpdateScenario({ pitDelayLaps: parseInt(e.target.value, 10) })}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Car & Tire Telemetry */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3 flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-400 mb-2">
            <Gauge className="w-3.5 h-3.5" />
            CAR RUBBER & DEGRADATION
          </div>

          <div className="space-y-2.5 text-xs font-mono">
            {/* Active Compound */}
            <div>
              <label className="text-slate-300 block mb-1">Current Tire Compound:</label>
              <select
                value={scenario.currentCompound}
                onChange={(e) => onUpdateScenario({ currentCompound: e.target.value as TireCompound })}
                className="w-full bg-slate-900 text-white rounded px-2.5 py-1 border border-slate-700 focus:outline-none focus:border-cyan-500 text-xs font-mono"
              >
                {COMPOUNDS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Current Tire Wear % */}
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Current Wear Level:</span>
                <strong className={scenario.tireWearPercent > 65 ? 'text-amber-400' : 'text-emerald-400'}>
                  {scenario.tireWearPercent}%
                </strong>
              </div>
              <input
                type="range"
                min={0}
                max={95}
                step={2}
                value={scenario.tireWearPercent}
                onChange={(e) => onUpdateScenario({ tireWearPercent: parseInt(e.target.value, 10) })}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>

            {/* Deg Multiplier */}
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Thermal Deg Multiplier:</span>
                <strong className="text-white">{scenario.degMultiplier}x</strong>
              </div>
              <input
                type="range"
                min={0.8}
                max={2.5}
                step={0.1}
                value={scenario.degMultiplier}
                onChange={(e) => onUpdateScenario({ degMultiplier: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Fuel & Race Progress */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3 flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-cyan-400 mb-2">
            <Fuel className="w-3.5 h-3.5" />
            FUEL & RACE DISTANCE
          </div>

          <div className="space-y-2.5 text-xs font-mono">
            {/* Current Lap */}
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Current Lap:</span>
                <strong className="text-cyan-400">Lap {scenario.currentLap} of {scenario.totalLaps}</strong>
              </div>
              <input
                type="range"
                min={1}
                max={scenario.totalLaps - 1}
                step={1}
                value={scenario.currentLap}
                onChange={(e) => onUpdateScenario({ currentLap: parseInt(e.target.value, 10) })}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
            </div>

            {/* Fuel Remaining */}
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Fuel In Tank (kg):</span>
                <strong className="text-white">{scenario.fuelRemainingKg.toFixed(1)} kg</strong>
              </div>
              <input
                type="range"
                min={8}
                max={80}
                step={0.5}
                value={scenario.fuelRemainingKg}
                onChange={(e) => onUpdateScenario({ fuelRemainingKg: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
              <span className="text-[10px] text-slate-500 block mt-0.5">
                Reduce under 28kg to test fuel starvation infeasibility alert.
              </span>
            </div>

            {/* Fuel Burn Rate */}
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Burn Rate per Lap:</span>
                <strong className="text-white">{scenario.fuelConsumptionPerLapKg.toFixed(2)} kg/L</strong>
              </div>
              <input
                type="range"
                min={1.2}
                max={2.2}
                step={0.05}
                value={scenario.fuelConsumptionPerLapKg}
                onChange={(e) => onUpdateScenario({ fuelConsumptionPerLapKg: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
