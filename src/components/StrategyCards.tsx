import React, { useState } from 'react';
import { CandidateStrategy, StrategyEvaluationResult, TireCompound } from '../types/strategy';
import {
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Flame,
  ShieldCheck,
  TrendingUp,
  XCircle,
  HelpCircle,
  Zap
} from 'lucide-react';

interface StrategyCardsProps {
  evaluation: StrategyEvaluationResult;
  onSelectStrategy?: (strategyId: string) => void;
  selectedStrategyId?: string;
}

const COMPOUND_BADGES: Record<TireCompound, { bg: string; text: string; border: string }> = {
  SOFT: { bg: 'bg-red-950/80', text: 'text-red-400', border: 'border-red-600' },
  MEDIUM: { bg: 'bg-yellow-950/80', text: 'text-yellow-400', border: 'border-yellow-500' },
  HARD: { bg: 'bg-slate-800', text: 'text-slate-100', border: 'border-slate-400' },
  INTERMEDIATE: { bg: 'bg-emerald-950/80', text: 'text-emerald-400', border: 'border-emerald-500' },
  WET: { bg: 'bg-blue-950/80', text: 'text-blue-400', border: 'border-blue-500' }
};

export const StrategyCards: React.FC<StrategyCardsProps> = ({
  evaluation,
  onSelectStrategy,
  selectedStrategyId
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Header bar with Model Explanation Callout */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-900/90 border border-slate-800 p-3 rounded-xl shadow-md">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-white tracking-wider uppercase font-mono flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-cyan-400" />
              Candidate Strategies Comparison (Ranked by Total Remaining Time)
            </h2>
            <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
              5 MODEL PATHS
            </span>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Decisive factor: <strong className="text-slate-200">{evaluation.keyDecisiveFactor}</strong>
          </p>
        </div>

        <div className="text-[11px] font-mono text-slate-400 flex items-center gap-3">
          <span>SC Pit Delta Saving: <strong className="text-emerald-400">+{evaluation.modelSummary.scDeltaAdvantageSec}s</strong></span>
          <span>Rain Crossover: <strong className="text-blue-400">L{evaluation.modelSummary.wetCrossoverLap || '35'}</strong></span>
        </div>
      </div>

      {/* Ranked Candidate Strategy Cards */}
      <div className="grid grid-cols-1 gap-2.5">
        {evaluation.rankedStrategies.map((strat: CandidateStrategy, index: number) => {
          const isWinner = index === 0;
          const isFallback = strat.id === evaluation.fallbackStrategyId && !isWinner;
          const isExpanded = expandedId === strat.id;
          const isSelected = selectedStrategyId === strat.id || (isWinner && !selectedStrategyId);
          const compoundBadge = COMPOUND_BADGES[strat.targetCompound] || COMPOUND_BADGES.HARD;

          return (
            <div
              key={strat.id}
              onClick={() => onSelectStrategy && onSelectStrategy(strat.id)}
              className={`w-full rounded-xl border transition-all duration-200 cursor-pointer overflow-hidden ${
                isWinner
                  ? 'bg-gradient-to-r from-cyan-950/40 via-slate-900/95 to-slate-900/90 border-cyan-500/80 shadow-lg shadow-cyan-950/50 ring-1 ring-cyan-500/30'
                  : isFallback
                  ? 'bg-slate-900/85 border-amber-500/50 hover:border-amber-400/80'
                  : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
              } ${isSelected && !isWinner ? 'ring-1 ring-cyan-500/60' : ''}`}
            >
              {/* Card Banner */}
              <div className="p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
                {/* Left: Rank, Code, Name, Compound */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {/* Rank Badge */}
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono font-black text-sm shrink-0 shadow-sm ${
                    isWinner
                      ? 'bg-cyan-500 text-slate-950 shadow-cyan-500/40'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}>
                    #{index + 1}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-cyan-400">
                        {strat.code}
                      </span>
                      <h3 className="font-bold text-white text-sm tracking-wide truncate">
                        {strat.name}
                      </h3>
                      {isWinner && (
                        <span className="px-2 py-0.5 text-[10px] font-mono font-extrabold rounded bg-emerald-950 text-emerald-400 border border-emerald-500 flex items-center gap-1 shadow-sm">
                          <CheckCircle2 className="w-3 h-3" /> RECOMMENDED CALL
                        </span>
                      )}
                      {isFallback && (
                        <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-amber-950 text-amber-300 border border-amber-600 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" /> FALLBACK PLAN
                        </span>
                      )}
                      {strat.feasibility === 'HIGH_RISK' && (
                        <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-orange-950 text-orange-400 border border-orange-600 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> HIGH DEGRADATION RISK
                        </span>
                      )}
                      {strat.feasibility === 'INFEASIBLE' && (
                        <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-red-950 text-red-400 border border-red-600 flex items-center gap-1">
                          <XCircle className="w-3 h-3" /> INFEASIBLE
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-400 font-mono mt-1 flex items-center gap-3 flex-wrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${compoundBadge.bg} ${compoundBadge.text} ${compoundBadge.border}`}>
                        {strat.targetCompound}
                      </span>
                      <span>Pit: <strong className="text-white">{strat.pitLap ? `Lap ${strat.pitLap}` : 'Stay Out'}</strong></span>
                      <span>Stops: <strong className="text-white">{strat.stopsCount}</strong></span>
                      <span>Finish Wear: <strong className={strat.tireWearAtFinishPercent > 85 ? 'text-amber-400' : 'text-slate-200'}>{strat.tireWearAtFinishPercent}%</strong></span>
                      <span>Fuel Finish: <strong className={strat.fuelAtFinishKg < 1.0 ? 'text-red-400' : 'text-slate-200'}>{strat.fuelAtFinishKg.toFixed(1)}kg</strong></span>
                    </div>
                  </div>
                </div>

                {/* Right: Projected Position, Delta, Confidence & Expand */}
                <div className="flex items-center justify-between md:justify-end gap-4 shrink-0 border-t md:border-t-0 border-slate-800 pt-2 md:pt-0">
                  {/* Position */}
                  <div className="text-center">
                    <span className="text-[10px] font-mono text-slate-400 uppercase block">Projected</span>
                    <span className={`text-xl font-mono font-extrabold ${
                      strat.projectedPosition === 1 ? 'text-emerald-400' : strat.projectedPosition <= 3 ? 'text-cyan-400' : 'text-slate-300'
                    }`}>
                      P{strat.projectedPosition}
                    </span>
                  </div>

                  {/* Time Delta to Best */}
                  <div className="text-center">
                    <span className="text-[10px] font-mono text-slate-400 uppercase block">Delta to Best</span>
                    <span className={`text-xl font-mono font-extrabold ${
                      strat.timeDeltaToBestSec === 0 ? 'text-emerald-400' : 'text-amber-400'
                    }`}>
                      {strat.timeDeltaToBestSec === 0 ? 'LEADER (+0.0s)' : `+${strat.timeDeltaToBestSec.toFixed(1)}s`}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500 block">
                      ±{Math.abs(strat.uncertaintyRangeSec[1]).toFixed(1)}s
                    </span>
                  </div>

                  {/* Confidence */}
                  <div className="text-center">
                    <span className="text-[10px] font-mono text-slate-400 uppercase block">Confidence</span>
                    <span className="text-base font-mono font-bold text-white">
                      {strat.confidenceScore}%
                    </span>
                  </div>

                  {/* Expand Breakdown Toggle */}
                  <button
                    onClick={(e) => toggleExpand(strat.id, e)}
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                    title="Toggle Lap Breakdown Details"
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Strategy Rationale & Switch Triggers Section */}
              <div className="px-3.5 pb-3 pt-1 border-t border-slate-800/80 bg-slate-950/40">
                <div className="text-xs font-mono text-slate-300">
                  <strong className="text-cyan-400 font-bold">Why: </strong>
                  {strat.whyItWinsOrLoses}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2 text-[11px] font-mono">
                  {/* Pros */}
                  <div className="bg-emerald-950/20 border border-emerald-900/40 rounded-lg p-2">
                    <span className="text-emerald-400 font-bold block mb-1">PROS:</span>
                    <ul className="space-y-0.5 text-slate-300 list-disc list-inside">
                      {strat.primaryPros.map((pro, pIdx) => (
                        <li key={pIdx}>{pro}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Cons / Triggers */}
                  <div className="bg-amber-950/20 border border-amber-900/40 rounded-lg p-2">
                    <span className="text-amber-400 font-bold block mb-1">CONCERNS & ABORT TRIGGERS:</span>
                    <ul className="space-y-0.5 text-slate-300 list-disc list-inside">
                      {strat.primaryCons.concat(strat.switchTriggers).slice(0, 3).map((con, cIdx) => (
                        <li key={cIdx}>{con}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Expanded Lap-by-Lap Telemetry Breakdown Table */}
              {isExpanded && (
                <div className="p-3 bg-slate-950 border-t border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold text-slate-300 uppercase">
                      Lap-by-Lap Progression Forecast (L{strat.lapBreakdown[0]?.lap} to L{strat.lapBreakdown[strat.lapBreakdown.length - 1]?.lap})
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      Total Remaining Race Time: {strat.totalRemainingTimeSec.toFixed(2)}s
                    </span>
                  </div>

                  <div className="max-h-56 overflow-y-auto rounded-lg border border-slate-800">
                    <table className="w-full text-left font-mono text-[11px]">
                      <thead className="bg-slate-900 text-slate-400 sticky top-0 border-b border-slate-800">
                        <tr>
                          <th className="py-1 px-2.5">Lap</th>
                          <th className="py-1 px-2.5">Flag / Mode</th>
                          <th className="py-1 px-2.5">Tire</th>
                          <th className="py-1 px-2.5">Tire Wear</th>
                          <th className="py-1 px-2.5">Track Wetness</th>
                          <th className="py-1 px-2.5">Lap Time</th>
                          <th className="py-1 px-2.5">Cumulative</th>
                          <th className="py-1 px-2.5">Fuel</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850 text-slate-300">
                        {strat.lapBreakdown.map((pt) => (
                          <tr
                            key={pt.lap}
                            className={`hover:bg-slate-900/80 ${pt.isPitLap ? 'bg-cyan-950/40 text-cyan-200 font-bold' : ''}`}
                          >
                            <td className="py-1 px-2.5">{pt.lap}</td>
                            <td className="py-1 px-2.5">
                              {pt.isPitLap ? (
                                <span className="px-1.5 py-0.2 text-[9px] bg-cyan-500 text-slate-950 font-black rounded">
                                  PIT STOP
                                </span>
                              ) : pt.isSafetyCarLap ? (
                                <span className="text-amber-400 font-bold">SAFETY CAR</span>
                              ) : (
                                <span className="text-emerald-400">RACING</span>
                              )}
                            </td>
                            <td className="py-1 px-2.5">{pt.compound}</td>
                            <td className="py-1 px-2.5">
                              <span className={pt.tireWearPercent > 80 ? 'text-amber-400 font-bold' : 'text-slate-300'}>
                                {pt.tireWearPercent}%
                              </span>
                            </td>
                            <td className="py-1 px-2.5">
                              <span className={pt.trackWetnessPercent > 20 ? 'text-blue-400' : 'text-slate-400'}>
                                {pt.trackWetnessPercent}%
                              </span>
                            </td>
                            <td className="py-1 px-2.5">{pt.lapTimeSec.toFixed(2)}s</td>
                            <td className="py-1 px-2.5">{pt.cumulativeTimeSec.toFixed(1)}s</td>
                            <td className="py-1 px-2.5">{pt.fuelRemainingKg.toFixed(1)}kg</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
