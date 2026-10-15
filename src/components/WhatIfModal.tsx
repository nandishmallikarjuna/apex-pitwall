import React from 'react';
import { RaceScenario, StrategyEvaluationResult, WhatIfSnapshot } from '../types/strategy';
import { evaluateScenario } from '../engine/simulationEngine';
import { X, GitCompare, ArrowRight, CheckCircle2, AlertTriangle, RotateCcw, Copy } from 'lucide-react';

interface WhatIfModalProps {
  isOpen: boolean;
  onClose: () => void;
  snapshotA: WhatIfSnapshot | null;
  currentScenario: RaceScenario;
  onSaveSnapshotA: () => void;
  onRevertToA: (scenarioA: RaceScenario) => void;
}

export const WhatIfModal: React.FC<WhatIfModalProps> = ({
  isOpen,
  onClose,
  snapshotA,
  currentScenario,
  onSaveSnapshotA,
  onRevertToA
}) => {
  if (!isOpen) return null;

  const currentEval = evaluateScenario(currentScenario);
  const scenarioA = snapshotA?.scenario;
  const evalA = snapshotA?.evaluation;

  const stratA = evalA?.rankedStrategies[0];
  const stratB = currentEval.rankedStrategies[0];

  // Calculate deltas if snapshot A exists
  const isDifferent = stratA && stratB && stratA.id !== stratB.id;
  const timeDiffSec = stratA && stratB ? (stratB.totalRemainingTimeSec - stratA.totalRemainingTimeSec) : 0;

  // Root cause diff detection
  const diffs: string[] = [];
  if (scenarioA) {
    if (scenarioA.rainForecastLap !== currentScenario.rainForecastLap) {
      diffs.push(`Rain arrival moved from L${scenarioA.rainForecastLap} to L${currentScenario.rainForecastLap} (${currentScenario.rainForecastLap - scenarioA.rainForecastLap > 0 ? '+' : ''}${currentScenario.rainForecastLap - scenarioA.rainForecastLap} laps)`);
    }
    if (scenarioA.safetyCarStatus !== currentScenario.safetyCarStatus) {
      diffs.push(`Safety car changed from ${scenarioA.safetyCarStatus} to ${currentScenario.safetyCarStatus}`);
    }
    if (scenarioA.tireWearPercent !== currentScenario.tireWearPercent) {
      diffs.push(`Initial tire wear adjusted from ${scenarioA.tireWearPercent}% to ${currentScenario.tireWearPercent}%`);
    }
    if (scenarioA.degMultiplier !== currentScenario.degMultiplier) {
      diffs.push(`Deg multiplier changed from ${scenarioA.degMultiplier}x to ${currentScenario.degMultiplier}x`);
    }
    if (scenarioA.currentTrackWetnessPercent !== currentScenario.currentTrackWetnessPercent) {
      diffs.push(`Current wetness changed from ${scenarioA.currentTrackWetnessPercent}% to ${currentScenario.currentTrackWetnessPercent}%`);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden font-mono text-slate-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <GitCompare className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="text-base font-bold text-white tracking-wide uppercase">
                What-If Strategic Branch Analysis (Scenario A vs Scenario B)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Compare diverging race trajectories and understand what inputs flip the pit-call.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-5">
          {/* Action Bar to snapshot */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/70 p-3 rounded-xl border border-slate-800">
            <div>
              <span className="text-xs font-bold text-cyan-400 block">
                {snapshotA ? `Baseline Snapshot A: "${snapshotA.scenarioName}"` : 'No Snapshot A Stored Yet'}
              </span>
              <span className="text-[11px] text-slate-400">
                {snapshotA
                  ? `Saved with recommendation: ${evalA?.rankedStrategies[0]?.name}`
                  : 'Capture the current scenario state as Scenario A to benchmark against subsequent edits.'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onSaveSnapshotA}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs rounded-lg transition-all shadow-md shadow-cyan-600/20"
              >
                <Copy className="w-3.5 h-3.5" />
                {snapshotA ? 'OVERWRITE SNAPSHOT A' : 'SAVE CURRENT AS SCENARIO A'}
              </button>

              {snapshotA && (
                <button
                  onClick={() => onRevertToA(snapshotA.scenario)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-lg transition-colors border border-slate-700"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  REVERT TO A
                </button>
              )}
            </div>
          </div>

          {snapshotA && evalA && stratA && stratB ? (
            <>
              {/* Diff Diagnostic Banner */}
              <div className={`p-3.5 rounded-xl border ${
                isDifferent
                  ? 'bg-amber-950/20 border-amber-500/60 text-amber-200'
                  : 'bg-emerald-950/20 border-emerald-500/60 text-emerald-200'
              }`}>
                <div className="flex items-center gap-2 font-bold text-xs">
                  {isDifferent ? (
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  )}
                  <span>
                    {isDifferent
                      ? `RECOMMENDATION FLIPPED: Scenario A favored ${stratA.code} (${stratA.targetCompound}), while Scenario B favors ${stratB.code} (${stratB.targetCompound})!`
                      : `RECOMMENDATION STABLE: Both scenarios favor ${stratA.code} (${stratA.targetCompound}).`}
                  </span>
                </div>

                {diffs.length > 0 && (
                  <div className="mt-2 text-[11px] text-slate-300 border-t border-slate-800/80 pt-2">
                    <strong className="text-cyan-400 font-bold block mb-1">Key Divergent Inputs:</strong>
                    <ul className="list-disc list-inside space-y-0.5 text-slate-400">
                      {diffs.map((d, idx) => (
                        <li key={idx}>{d}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Side by side comparison table */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Scenario A Card */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="text-xs font-bold text-cyan-400">SCENARIO A (BASELINE)</span>
                    <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-300">
                      CONFIDENCE: {stratA.confidenceScore}%
                    </span>
                  </div>

                  <div className="mt-3 space-y-2 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Call:</span>
                      <strong className="text-base text-white">{stratA.name}</strong>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                      <div>Compound: <strong className="text-cyan-300">{stratA.targetCompound}</strong></div>
                      <div>Pit Lap: <strong className="text-white">{stratA.pitLap ? `Lap ${stratA.pitLap}` : 'Stay Out'}</strong></div>
                      <div>Projected: <strong className="text-emerald-400">P{stratA.projectedPosition}</strong></div>
                      <div>Finish Wear: <strong className="text-slate-200">{stratA.tireWearAtFinishPercent}%</strong></div>
                    </div>

                    <div className="p-2 bg-slate-900 rounded border border-slate-800 text-[10px] text-slate-400 mt-2">
                      <strong className="text-slate-200">Decisive Reason:</strong> {stratA.whyItWinsOrLoses}
                    </div>
                  </div>
                </div>

                {/* Scenario B Card */}
                <div className="bg-slate-950/80 border border-cyan-500/50 rounded-xl p-4 shadow-lg shadow-cyan-950/30">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="text-xs font-bold text-emerald-400">SCENARIO B (ACTIVE STATE)</span>
                    <span className="text-[10px] bg-cyan-950 border border-cyan-700 px-2 py-0.5 rounded text-cyan-300 font-bold">
                      CONFIDENCE: {stratB.confidenceScore}%
                    </span>
                  </div>

                  <div className="mt-3 space-y-2 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Call:</span>
                      <strong className="text-base text-white">{stratB.name}</strong>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                      <div>Compound: <strong className="text-cyan-300">{stratB.targetCompound}</strong></div>
                      <div>Pit Lap: <strong className="text-white">{stratB.pitLap ? `Lap ${stratB.pitLap}` : 'Stay Out'}</strong></div>
                      <div>Projected: <strong className="text-emerald-400">P{stratB.projectedPosition}</strong></div>
                      <div>Finish Wear: <strong className="text-slate-200">{stratB.tireWearAtFinishPercent}%</strong></div>
                    </div>

                    <div className="p-2 bg-slate-900 rounded border border-slate-800 text-[10px] text-slate-400 mt-2">
                      <strong className="text-slate-200">Decisive Reason:</strong> {stratB.whyItWinsOrLoses}
                    </div>
                  </div>
                </div>
              </div>

              {/* Time Difference Summary */}
              <div className="bg-slate-950/90 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">Total Race Time Impact (B vs A):</span>
                <span className={`text-sm font-bold font-mono ${
                  timeDiffSec < 0 ? 'text-emerald-400' : timeDiffSec > 0 ? 'text-amber-400' : 'text-slate-300'
                }`}>
                  {timeDiffSec < 0 ? `${timeDiffSec.toFixed(2)}s faster in B` : timeDiffSec > 0 ? `+${timeDiffSec.toFixed(2)}s slower in B` : 'Identical (0.00s delta)'}
                </span>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-slate-400 text-xs">
              <GitCompare className="w-10 h-10 mx-auto text-slate-600 mb-2" />
              Click <strong>"Save Current As Scenario A"</strong> above to store your baseline, then alter scenario inputs in the main dashboard to view the comparative delta.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-slate-800 bg-slate-950/80 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-colors border border-slate-700"
          >
            CLOSE COMPARISON
          </button>
        </div>
      </div>
    </div>
  );
};
