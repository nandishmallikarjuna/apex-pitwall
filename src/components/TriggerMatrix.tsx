import React from 'react';
import { CandidateStrategy, StrategyEvaluationResult } from '../types/strategy';
import { ShieldCheck, AlertCircle, ArrowRight, CornerDownRight, CheckCircle2, RotateCw } from 'lucide-react';

interface TriggerMatrixProps {
  evaluation: StrategyEvaluationResult;
  onApplyAction?: (actionText: string) => void;
}

export const TriggerMatrix: React.FC<TriggerMatrixProps> = ({ evaluation, onApplyAction }) => {
  const fallback = evaluation.rankedStrategies.find(s => s.id === evaluation.fallbackStrategyId);
  const winner = evaluation.rankedStrategies[0];

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-3">
      {/* 1. Contingency Fallback Plan Card */}
      <div className="bg-slate-900/90 border border-amber-500/40 rounded-xl p-3.5 shadow-lg flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              Fallback Plan (Plan B-2)
            </span>
            <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold rounded bg-amber-950 text-amber-300 border border-amber-600">
              CONTINGENCY
            </span>
          </div>

          {fallback ? (
            <div className="mt-2">
              <h3 className="text-base font-extrabold text-white font-mono">
                {fallback.code}: {fallback.name}
              </h3>
              <p className="text-xs text-slate-300 font-mono mt-1">
                {fallback.description}
              </p>

              <div className="mt-2.5 p-2 bg-slate-950/80 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-300">
                <span className="text-amber-400 font-bold block mb-0.5">FALLBACK ADVANTAGE:</span>
                Delta vs Leader: <strong className="text-white">+{fallback.timeDeltaToBestSec.toFixed(1)}s</strong> • Projected: <strong className="text-emerald-400">P{fallback.projectedPosition}</strong>
                <div className="mt-1 text-slate-400">
                  Target Compound: <strong className="text-slate-200">{fallback.targetCompound}</strong> • Stop on <strong className="text-slate-200">{fallback.pitLap ? `Lap ${fallback.pitLap}` : 'Stay Out'}</strong>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-xs font-mono text-slate-400 mt-2">No fallback plan available.</div>
          )}
        </div>

        <div className="text-[10px] font-mono text-slate-400 border-t border-slate-800/80 pt-2 mt-3 flex items-center justify-between">
          <span>Switch condition: Immediate weather divergence</span>
          <span className="text-amber-400 font-semibold">Ready on Standby</span>
        </div>
      </div>

      {/* 2 & 3. Concrete Trigger Matrix (Switch Strategy If...) */}
      <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 shadow-lg flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-cyan-400" />
              Real-Time Decision Matrix: "Switch Strategy If..."
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              DYNAMIC DECISION BRANCHES
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2.5">
            {evaluation.triggerMatrix.map((trigger, idx) => (
              <div
                key={idx}
                className="bg-slate-950/70 border border-slate-800/90 rounded-lg p-2.5 hover:border-slate-700 transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="text-[11px] font-mono font-bold text-amber-300 flex items-start gap-1.5">
                    <span className="text-cyan-400 mt-0.5">▶</span>
                    <span>IF: {trigger.condition}</span>
                  </div>
                  <div className="text-xs font-mono font-extrabold text-white mt-1 pl-4 flex items-center gap-1 text-emerald-400">
                    <CornerDownRight className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>THEN: {trigger.action}</span>
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 mt-1 pl-4">
                    Impact: {trigger.impact}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-[10px] font-mono text-slate-400 border-t border-slate-800/80 pt-2 mt-2 flex items-center justify-between">
          <span>Triggers monitor telemetry deltas, weather radar shifts, and rival pit lane entries.</span>
          <span className="text-cyan-400 font-semibold">Active Monitoring</span>
        </div>
      </div>
    </div>
  );
};
