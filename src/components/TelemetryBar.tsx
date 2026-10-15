import React from 'react';
import { RaceScenario, StrategyEvaluationResult, TireCompound } from '../types/strategy';
import {
  Gauge,
  Fuel,
  CloudRain,
  ShieldAlert,
  TrendingDown,
  AlertTriangle,
  Clock,
  Compass
} from 'lucide-react';

interface TelemetryBarProps {
  scenario: RaceScenario;
  evaluation: StrategyEvaluationResult;
}

const COMPOUND_COLORS: Record<TireCompound, { bg: string; text: string; border: string; label: string }> = {
  SOFT: { bg: 'bg-red-950/70', text: 'text-red-400', border: 'border-red-600', label: 'SOFT (C5)' },
  MEDIUM: { bg: 'bg-yellow-950/70', text: 'text-yellow-400', border: 'border-yellow-500', label: 'MEDIUM (C3)' },
  HARD: { bg: 'bg-slate-800/80', text: 'text-slate-100', border: 'border-slate-300', label: 'HARD (C1)' },
  INTERMEDIATE: { bg: 'bg-emerald-950/70', text: 'text-emerald-400', border: 'border-emerald-500', label: 'INTERMEDIATE' },
  WET: { bg: 'bg-blue-950/70', text: 'text-blue-400', border: 'border-blue-500', label: 'FULL WET' }
};

export const TelemetryBar: React.FC<TelemetryBarProps> = ({ scenario, evaluation }) => {
  const currentCompound = scenario.currentCompound;
  const compoundStyle = COMPOUND_COLORS[currentCompound] || COMPOUND_COLORS.HARD;
  const isHighDeg = scenario.tireWearPercent >= 65;
  const rainDeltaLaps = scenario.rainForecastLap - scenario.currentLap;
  const scSaved = evaluation.modelSummary.scDeltaAdvantageSec;

  // Fuel calculation
  const lapsRemaining = scenario.totalLaps - scenario.currentLap + 1;
  const requiredFuelKg = lapsRemaining * scenario.fuelConsumptionPerLapKg;
  const fuelSurplusKg = scenario.fuelRemainingKg - requiredFuelKg - scenario.minFuelBufferKg;
  const isFuelLow = fuelSurplusKg < 0;

  return (
    <div className="w-full grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
      {/* 1. Track Position & Gaps */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex flex-col justify-between shadow-lg relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">Track Position</span>
          <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold rounded bg-cyan-950 text-cyan-400 border border-cyan-700">CAR #7</span>
        </div>
        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-3xl font-extrabold text-white tracking-tight font-mono">P{scenario.ourPosition}</span>
          <span className="text-xs font-mono text-emerald-400 font-semibold">CHAMPIONSHIP TARGET</span>
        </div>
        <div className="text-[11px] font-mono text-slate-400 flex items-center justify-between border-t border-slate-800/80 pt-1.5 mt-1">
          <span>Gap P2: <strong className="text-amber-400">-1.2s</strong></span>
          <span>P4: <strong className="text-slate-300">+1.9s</strong></span>
        </div>
      </div>

      {/* 2. Active Tire & Wear Gauge */}
      <div className={`bg-slate-900/90 border ${isHighDeg ? 'border-amber-500/60' : 'border-slate-800'} rounded-xl p-3 flex flex-col justify-between shadow-lg relative`}>
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold flex items-center gap-1">
            <Gauge className="w-3 h-3 text-cyan-400" />
            Tire Telemetry
          </span>
          <span className={`px-1.5 py-0.5 text-[9px] font-mono font-bold rounded border ${compoundStyle.bg} ${compoundStyle.text} ${compoundStyle.border}`}>
            {compoundStyle.label}
          </span>
        </div>
        <div className="flex items-baseline justify-between mt-1">
          <div className="flex items-baseline gap-1">
            <span className={`text-2xl font-bold font-mono ${isHighDeg ? 'text-amber-400' : 'text-slate-100'}`}>
              {scenario.tireWearPercent}%
            </span>
            <span className="text-[10px] font-mono text-slate-400">wear</span>
          </div>
          <span className="text-xs font-mono text-slate-300">
            Age: <strong className="text-white">{scenario.tireAgeLaps}L</strong>
          </span>
        </div>
        {/* Progress bar */}
        <div className="w-full mt-1.5">
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                scenario.tireWearPercent >= 85
                  ? 'bg-red-500'
                  : scenario.tireWearPercent >= 65
                  ? 'bg-amber-400'
                  : 'bg-emerald-400'
              }`}
              style={{ width: `${Math.min(100, scenario.tireWearPercent)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 mt-1">
            <span>Rate: {(3.2 * scenario.degMultiplier).toFixed(1)}%/L</span>
            {isHighDeg && <span className="text-amber-400 font-bold flex items-center gap-0.5"><TrendingDown className="w-2.5 h-2.5" /> CLIFF ACTIVE</span>}
          </div>
        </div>
      </div>

      {/* 3. Fuel Reserve Status */}
      <div className={`bg-slate-900/90 border ${isFuelLow ? 'border-red-500/60' : 'border-slate-800'} rounded-xl p-3 flex flex-col justify-between shadow-lg`}>
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold flex items-center gap-1">
            <Fuel className="w-3 h-3 text-cyan-400" />
            Fuel Level
          </span>
          <span className={`px-1.5 py-0.5 text-[9px] font-mono font-bold rounded ${
            isFuelLow ? 'bg-red-950 text-red-400 border border-red-700' : 'bg-emerald-950 text-emerald-400 border border-emerald-700'
          }`}>
            {isFuelLow ? 'DEFICIT RISK' : 'SUFFICIENT'}
          </span>
        </div>
        <div className="flex items-baseline justify-between mt-1">
          <span className="text-2xl font-bold font-mono text-white">
            {scenario.fuelRemainingKg.toFixed(1)} <span className="text-xs text-slate-400 font-normal">kg</span>
          </span>
          <span className="text-xs font-mono text-slate-300">
            {scenario.fuelConsumptionPerLapKg.toFixed(2)} kg/L
          </span>
        </div>
        <div className="text-[10px] font-mono text-slate-400 border-t border-slate-800/80 pt-1 mt-1 flex items-center justify-between">
          <span>FIA Buffer: 1.0 kg</span>
          <span className={fuelSurplusKg >= 0 ? 'text-emerald-400' : 'text-red-400 font-bold'}>
            Delta: {fuelSurplusKg >= 0 ? `+${fuelSurplusKg.toFixed(1)}kg` : `${fuelSurplusKg.toFixed(1)}kg`}
          </span>
        </div>
      </div>

      {/* 4. Weather Radar & Crossover */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex flex-col justify-between shadow-lg">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold flex items-center gap-1">
            <CloudRain className="w-3 h-3 text-cyan-400" />
            Weather Radar
          </span>
          <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold rounded bg-blue-950 text-blue-300 border border-blue-700">
            {scenario.currentWeather}
          </span>
        </div>
        <div className="flex items-baseline justify-between mt-1">
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold font-mono text-blue-400">
              {rainDeltaLaps <= 0 ? 'NOW' : `T-${rainDeltaLaps}L`}
            </span>
            <span className="text-[10px] font-mono text-slate-400">(Lap {scenario.rainForecastLap})</span>
          </div>
          <span className="text-xs font-mono text-slate-300">
            Peak: <strong className="text-blue-300">{scenario.rainPeakIntensityPercent}%</strong>
          </span>
        </div>
        <div className="text-[10px] font-mono text-slate-400 border-t border-slate-800/80 pt-1 mt-1 flex items-center justify-between">
          <span>Track Wetness: <strong className="text-white">{scenario.currentTrackWetnessPercent}%</strong></span>
          <span className="text-cyan-400 font-semibold">Crossover: ~L{evaluation.modelSummary.wetCrossoverLap || '35'}</span>
        </div>
      </div>

      {/* 5. Safety Car State & Pit Advantage */}
      <div className={`bg-slate-900/90 border ${
        scenario.safetyCarStatus === 'FULL_SC' ? 'border-amber-500/70 bg-amber-950/20' : 'border-slate-800'
      } rounded-xl p-3 flex flex-col justify-between shadow-lg`}>
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold flex items-center gap-1">
            <ShieldAlert className="w-3 h-3 text-amber-400" />
            Neutralization
          </span>
          <span className={`px-1.5 py-0.5 text-[9px] font-mono font-bold rounded ${
            scenario.safetyCarStatus === 'FULL_SC'
              ? 'bg-amber-500 text-slate-950 animate-pulse font-extrabold'
              : 'bg-slate-800 text-slate-400'
          }`}>
            {scenario.safetyCarStatus === 'FULL_SC' ? 'FULL SC' : scenario.safetyCarStatus === 'VIRTUAL' ? 'VSC' : 'GREEN FLAG'}
          </span>
        </div>
        <div className="flex items-baseline justify-between mt-1">
          <span className="text-2xl font-bold font-mono text-amber-400">
            {scenario.safetyCarStatus === 'FULL_SC' ? `${scenario.safetyCarLapsRemaining} Laps` : '0 Laps'}
          </span>
          <span className="text-xs font-mono text-emerald-400 font-semibold">
            Save: +{scSaved}s
          </span>
        </div>
        <div className="text-[10px] font-mono text-slate-400 border-t border-slate-800/80 pt-1 mt-1 flex items-center justify-between">
          <span>SC Pit Loss: <strong className="text-white">~12.2s</strong></span>
          <span>Green: <strong className="text-slate-300">~23.5s</strong></span>
        </div>
      </div>

      {/* 6. Model Recommendation Pill */}
      <div className="bg-gradient-to-br from-cyan-950/80 to-slate-900 border border-cyan-500/50 rounded-xl p-3 flex flex-col justify-between shadow-lg shadow-cyan-950/30">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono text-cyan-300 uppercase tracking-wider font-bold">
            Apex Model Call
          </span>
          <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold rounded bg-cyan-500 text-slate-950 shadow-sm shadow-cyan-500/40">
            {evaluation.rankedStrategies[0]?.confidenceScore}% CONFIDENCE
          </span>
        </div>
        <div className="mt-1">
          <span className="text-base font-extrabold text-white font-mono tracking-tight block truncate">
            {evaluation.rankedStrategies[0]?.name.split(' (')[0] || 'Plan B'}
          </span>
          <div className="text-[11px] font-mono text-cyan-300 font-semibold flex items-center gap-1.5 mt-0.5">
            <span>Compound: <strong className="text-white">{evaluation.rankedStrategies[0]?.targetCompound}</strong></span>
            <span>•</span>
            <span>Stops: <strong className="text-white">{evaluation.rankedStrategies[0]?.stopsCount}</strong></span>
          </div>
        </div>
        <div className="text-[10px] font-mono text-slate-400 border-t border-cyan-900/60 pt-1 mt-1 flex items-center justify-between">
          <span>Projected: <strong className="text-emerald-400 font-bold">P{evaluation.rankedStrategies[0]?.projectedPosition}</strong></span>
          <span className="text-cyan-400">Delta: +0.0s</span>
        </div>
      </div>
    </div>
  );
};
