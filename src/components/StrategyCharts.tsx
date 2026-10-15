import React, { useState } from 'react';
import { CandidateStrategy, StrategyEvaluationResult, RaceScenario } from '../types/strategy';
import { BarChart3, LineChart, Activity, CloudRain, Clock, Layers } from 'lucide-react';

interface StrategyChartsProps {
  evaluation: StrategyEvaluationResult;
  scenario: RaceScenario;
}

const STRATEGY_COLORS: Record<string, string> = {
  strat_stay_out: '#94a3b8', // Slate
  strat_pit_inters_now: '#10b981', // Emerald
  strat_pit_dry_now: '#f59e0b', // Amber
  strat_pit_wet_now: '#3b82f6', // Blue
  strat_delay_pit: '#a855f7' // Purple
};

export const StrategyCharts: React.FC<StrategyChartsProps> = ({ evaluation, scenario }) => {
  const [activeTab, setActiveTab] = useState<'all' | 'pace' | 'wear' | 'weather' | 'time'>('all');
  const strategies = evaluation.rankedStrategies;
  const referenceLaps = strategies[0]?.lapBreakdown || [];

  if (referenceLaps.length === 0) return null;

  const minLap = referenceLaps[0].lap;
  const maxLap = referenceLaps[referenceLaps.length - 1].lap;
  const lapSpan = Math.max(1, maxLap - minLap);

  // SVG dimensions
  const width = 640;
  const height = 210;
  const padding = { top: 20, right: 30, bottom: 30, left: 45 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  // Chart 1: Lap Times range
  let minPace = Infinity, maxPace = -Infinity;
  strategies.forEach((strat) => {
    strat.lapBreakdown.forEach((pt) => {
      if (pt.lapTimeSec < minPace) minPace = pt.lapTimeSec;
      if (pt.lapTimeSec > maxPace) maxPace = pt.lapTimeSec;
    });
  });
  minPace = Math.floor(minPace - 2);
  maxPace = Math.ceil(maxPace + 4);

  // Helper to map lap to X
  const getX = (lap: number) => padding.left + ((lap - minLap) / lapSpan) * plotWidth;

  // Helper to map pace to Y
  const getPaceY = (pace: number) => {
    const norm = (pace - minPace) / Math.max(1, maxPace - minPace);
    return padding.top + (1 - norm) * plotHeight;
  };

  // Helper to map wear (0-100) to Y
  const getWearY = (wear: number) => {
    const norm = Math.min(100, Math.max(0, wear)) / 100;
    return padding.top + (1 - norm) * plotHeight;
  };

  return (
    <div className="w-full flex flex-col gap-3 bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 shadow-lg">
      {/* Chart Nav Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
            Strategy Simulation Charts (Live Model Output)
          </h2>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-mono">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-2.5 py-1 rounded transition-colors ${activeTab === 'all' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
          >
            ALL 4 CHARTS
          </button>
          <button
            onClick={() => setActiveTab('pace')}
            className={`px-2.5 py-1 rounded transition-colors ${activeTab === 'pace' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
          >
            LAP PACE
          </button>
          <button
            onClick={() => setActiveTab('wear')}
            className={`px-2.5 py-1 rounded transition-colors ${activeTab === 'wear' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
          >
            TIRE WEAR %
          </button>
          <button
            onClick={() => setActiveTab('weather')}
            className={`px-2.5 py-1 rounded transition-colors ${activeTab === 'weather' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
          >
            WET CROSSOVER
          </button>
          <button
            onClick={() => setActiveTab('time')}
            className={`px-2.5 py-1 rounded transition-colors ${activeTab === 'time' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
          >
            RACE TIME DELTA
          </button>
        </div>
      </div>

      {/* Charts Grid */}
      <div className={`grid gap-3.5 ${activeTab === 'all' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
        {/* 1. Lap Pace Forecast */}
        {(activeTab === 'all' || activeTab === 'pace') && (
          <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-mono font-bold text-slate-200 flex items-center gap-1.5">
                <LineChart className="w-3.5 h-3.5 text-cyan-400" />
                Lap-by-Lap Estimated Pace (s)
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                Spikes = Pit stops | Plateau = Safety Car
              </span>
            </div>

            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible select-none">
              {/* Grid Lines */}
              {[minPace, (minPace + maxPace) / 2, maxPace].map((val, idx) => {
                const y = getPaceY(val);
                return (
                  <g key={idx}>
                    <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#1e293b" strokeDasharray="3 3" />
                    <text x={padding.left - 6} y={y + 3} textAnchor="end" fill="#64748b" fontSize="9" fontFamily="monospace">
                      {Math.round(val)}s
                    </text>
                  </g>
                );
              })}

              {/* Laps on X axis */}
              {[minLap, Math.round((minLap + maxLap) / 2), maxLap].map((lap) => {
                const x = getX(lap);
                return (
                  <g key={lap}>
                    <line x1={x} y1={padding.top} x2={x} y2={height - padding.bottom} stroke="#1e293b" strokeDasharray="2 2" />
                    <text x={x} y={height - padding.bottom + 14} textAnchor="middle" fill="#64748b" fontSize="9" fontFamily="monospace">
                      L{lap}
                    </text>
                  </g>
                );
              })}

              {/* Safety Car Shaded Region */}
              {scenario.safetyCarStatus === 'FULL_SC' && (
                <rect
                  x={getX(scenario.currentLap)}
                  y={padding.top}
                  width={Math.max(0, getX(scenario.currentLap + scenario.safetyCarLapsRemaining) - getX(scenario.currentLap))}
                  height={plotHeight}
                  fill="#f59e0b"
                  fillOpacity="0.08"
                />
              )}

              {/* Strategy Pace Lines */}
              {strategies.map((strat) => {
                const color = STRATEGY_COLORS[strat.id] || '#00f0ff';
                const points = strat.lapBreakdown
                  .map((pt) => `${getX(pt.lap)},${getPaceY(pt.lapTimeSec)}`)
                  .join(' ');
                const isWinner = strat.id === evaluation.recommendedStrategyId;

                return (
                  <polyline
                    key={strat.id}
                    fill="none"
                    stroke={color}
                    strokeWidth={isWinner ? 2.8 : 1.4}
                    strokeOpacity={isWinner ? 1 : 0.65}
                    points={points}
                  />
                );
              })}
            </svg>

            {/* Legend */}
            <div className="flex items-center justify-center gap-3 flex-wrap mt-2 pt-1 border-t border-slate-900 text-[10px] font-mono">
              {strategies.map((strat) => (
                <div key={strat.id} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-0.5 rounded" style={{ backgroundColor: STRATEGY_COLORS[strat.id] || '#00f0ff' }} />
                  <span className={strat.id === evaluation.recommendedStrategyId ? 'text-white font-bold' : 'text-slate-400'}>
                    {strat.code}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 2. Tire Wear % Timeline */}
        {(activeTab === 'all' || activeTab === 'wear') && (
          <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-mono font-bold text-slate-200 flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5 text-amber-400" />
                Tire Degradation Curve (%)
              </span>
              <span className="text-[10px] font-mono text-amber-400">
                70% Cliff | 100% Failure Limit
              </span>
            </div>

            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible select-none">
              {/* 70% Cliff Line */}
              <line x1={padding.left} y1={getWearY(70)} x2={width - padding.right} y2={getWearY(70)} stroke="#f59e0b" strokeDasharray="4 4" strokeWidth="1" />
              <text x={width - padding.right} y={getWearY(70) - 4} textAnchor="end" fill="#f59e0b" fontSize="8" fontFamily="monospace">
                70% PERFORMANCE CLIFF
              </text>

              {/* 100% Boundary */}
              <line x1={padding.left} y1={getWearY(100)} x2={width - padding.right} y2={getWearY(100)} stroke="#ef4444" strokeDasharray="2 2" strokeWidth="1" />

              {/* Y Axis Grid */}
              {[0, 50, 100].map((val) => {
                const y = getWearY(val);
                return (
                  <g key={val}>
                    <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#1e293b" />
                    <text x={padding.left - 6} y={y + 3} textAnchor="end" fill="#64748b" fontSize="9" fontFamily="monospace">
                      {val}%
                    </text>
                  </g>
                );
              })}

              {/* Wear Lines */}
              {strategies.map((strat) => {
                const color = STRATEGY_COLORS[strat.id] || '#00f0ff';
                const points = strat.lapBreakdown
                  .map((pt) => `${getX(pt.lap)},${getWearY(pt.tireWearPercent)}`)
                  .join(' ');
                const isWinner = strat.id === evaluation.recommendedStrategyId;

                return (
                  <polyline
                    key={strat.id}
                    fill="none"
                    stroke={color}
                    strokeWidth={isWinner ? 2.6 : 1.4}
                    strokeOpacity={isWinner ? 1 : 0.65}
                    points={points}
                  />
                );
              })}
            </svg>

            <div className="text-[10px] font-mono text-slate-400 text-center mt-2 pt-1 border-t border-slate-900">
              Steeper slope indicates accelerated wear on dry/wet mismatched surface or high deg multiplier ({scenario.degMultiplier}x).
            </div>
          </div>
        )}

        {/* 3. Weather Radar & Track Wetness Timeline */}
        {(activeTab === 'all' || activeTab === 'weather') && (
          <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-mono font-bold text-slate-200 flex items-center gap-1.5">
                <CloudRain className="w-3.5 h-3.5 text-blue-400" />
                Track Wetness & Tire Crossover Window
              </span>
              <span className="text-[10px] font-mono text-cyan-400">
                Inter Crossover = 25% | Full Wet = 68%
              </span>
            </div>

            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible select-none">
              {/* Crossover threshold lines */}
              <line x1={padding.left} y1={getWearY(25)} x2={width - padding.right} y2={getWearY(25)} stroke="#10b981" strokeDasharray="3 3" />
              <text x={width - padding.right} y={getWearY(25) - 3} textAnchor="end" fill="#10b981" fontSize="8" fontFamily="monospace">
                SLICK / INTER CROSSOVER (25%)
              </text>

              <line x1={padding.left} y1={getWearY(68)} x2={width - padding.right} y2={getWearY(68)} stroke="#3b82f6" strokeDasharray="3 3" />
              <text x={width - padding.right} y={getWearY(68) - 3} textAnchor="end" fill="#3b82f6" fontSize="8" fontFamily="monospace">
                INTER / FULL WET CROSSOVER (68%)
              </text>

              {/* Rain forecast marker line */}
              <line
                x1={getX(scenario.rainForecastLap)}
                y1={padding.top}
                x2={getX(scenario.rainForecastLap)}
                y2={height - padding.bottom}
                stroke="#60a5fa"
                strokeWidth="1.5"
                strokeDasharray="2 2"
              />
              <text x={getX(scenario.rainForecastLap) + 4} y={padding.top + 10} fill="#93c5fd" fontSize="8" fontFamily="monospace">
                RAIN ON RADAR (L{scenario.rainForecastLap})
              </text>

              {/* Track Wetness Area Fill */}
              {referenceLaps.length > 0 && (
                <path
                  d={`M ${getX(referenceLaps[0].lap)} ${height - padding.bottom} ` +
                    referenceLaps.map(pt => `L ${getX(pt.lap)} ${getWearY(pt.trackWetnessPercent)}`).join(' ') +
                    ` L ${getX(referenceLaps[referenceLaps.length - 1].lap)} ${height - padding.bottom} Z`}
                  fill="url(#rainGradient)"
                  opacity="0.35"
                />
              )}

              {/* Track Wetness Line */}
              <polyline
                fill="none"
                stroke="#38bdf8"
                strokeWidth="2.4"
                points={referenceLaps.map(pt => `${getX(pt.lap)},${getWearY(pt.trackWetnessPercent)}`).join(' ')}
              />

              <defs>
                <linearGradient id="rainGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#0c4a6e" stopOpacity="0.0" />
                </linearGradient>
              </defs>
            </svg>

            <div className="text-[10px] font-mono text-slate-400 text-center mt-2 pt-1 border-t border-slate-900">
              When blue track wetness line exceeds 25%, Intermediates gain grip advantage over slicks.
            </div>
          </div>
        )}

        {/* 4. Total Remaining Race Time Delta Comparison Bar Chart */}
        {(activeTab === 'all' || activeTab === 'time') && (
          <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono font-bold text-slate-200 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                Total Remaining Time Delta vs Winner (seconds)
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                Shorter bar is faster | Bounds show ±σ
              </span>
            </div>

            <div className="flex flex-col gap-2.5 mt-2">
              {strategies.map((strat) => {
                const isWinner = strat.id === evaluation.recommendedStrategyId;
                const maxDelta = Math.max(30, Math.min(180, ...strategies.map(s => s.timeDeltaToBestSec)));
                const barWidthPct = isWinner ? 3 : Math.min(100, Math.max(4, (strat.timeDeltaToBestSec / maxDelta) * 100));

                return (
                  <div key={strat.id} className="flex items-center gap-2 text-xs font-mono">
                    <span className="w-20 truncate text-slate-300 font-bold">
                      {strat.code}
                    </span>

                    <div className="flex-1 bg-slate-900 h-6 rounded-md overflow-hidden relative border border-slate-800 flex items-center">
                      <div
                        className={`h-full transition-all duration-300 flex items-center px-2 ${
                          isWinner
                            ? 'bg-emerald-500/80 text-slate-950 font-black'
                            : strat.feasibility === 'INFEASIBLE'
                            ? 'bg-red-950/90 text-red-300 border-r-2 border-red-500'
                            : 'bg-slate-700/80 text-white'
                        }`}
                        style={{ width: `${barWidthPct}%` }}
                      >
                        {isWinner && <span className="text-[10px] tracking-wider uppercase">0.0s (BEST)</span>}
                      </div>

                      {!isWinner && (
                        <span className="absolute left-3 text-[10px] text-slate-300 font-semibold">
                          +{strat.timeDeltaToBestSec.toFixed(1)}s (±{Math.abs(strat.uncertaintyRangeSec[1]).toFixed(1)}s)
                        </span>
                      )}
                    </div>

                    <span className={`w-8 text-center font-bold font-mono ${
                      strat.projectedPosition === 1 ? 'text-emerald-400' : 'text-slate-400'
                    }`}>
                      P{strat.projectedPosition}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="text-[10px] font-mono text-slate-500 text-center mt-3 pt-1 border-t border-slate-900">
              Computed deterministically from lap-by-lap simulation including fuel burn, tire wear, and SC pit delta.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
