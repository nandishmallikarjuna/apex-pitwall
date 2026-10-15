import React from 'react';
import { X, BookOpen, AlertTriangle, Cpu, CheckCircle, Database } from 'lucide-react';

interface ModelAssumptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ModelAssumptionsModal: React.FC<ModelAssumptionsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden font-mono text-slate-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <Cpu className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="text-base font-bold text-white tracking-wide uppercase">
                Apex Model Specification & Data Integrity
              </h2>
              <span className="text-xs text-amber-400">
                SYNTHETIC STRATEGY ENGINE // TRANSPARENT HEURISTICS
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Data Category Demarcation */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Database className="w-4 h-4 text-cyan-400" />
              Data Source Classification (Strict Transparency)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-[11px]">
              <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                <span className="text-cyan-400 font-bold block mb-1">1. CALIBRATED BENCHMARKS</span>
                <p className="text-slate-400">
                  Track length, turn counts, baseline dry lap times, pit lane transit times (green flag vs SC), and FIA 1.0kg fuel sample buffer compliance.
                </p>
              </div>

              <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                <span className="text-amber-400 font-bold block mb-1">2. USER / STRATEGIST ESTIMATES</span>
                <p className="text-slate-400">
                  Precipitation arrival lap, peak rainfall wetness %, Safety Car duration laps, degradation multiplier, and pit stop delay parameters.
                </p>
              </div>

              <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                <span className="text-purple-400 font-bold block mb-1">3. GENERATED DEMO DATA</span>
                <p className="text-slate-400">
                  Simulated rival pace offsets, procedural 3D circuit elevation splines, and synthetic sensor noise. Never presented as official live telemetry.
                </p>
              </div>
            </div>
          </div>

          {/* Mathematical Model */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-2">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-cyan-400" />
              Core Simulation Mechanics
            </h3>

            <div className="space-y-2 text-slate-300">
              <div>
                <strong className="text-cyan-300">Lap Pace Formula:</strong>
                <p className="font-mono text-slate-400 mt-0.5 bg-slate-900 p-2 rounded border border-slate-800">
                  T_lap = T_base + Δ_compound + DegPenalty(wear%) + MismatchPenalty(compound, wetness%) - FuelWeightAdvantage
                </p>
              </div>

              <div>
                <strong className="text-cyan-300">Safety Car Delta Advantage:</strong>
                <p className="text-slate-400 mt-0.5">
                  Pit stops taken during an active Safety Car lap cost ~52% of the green-flag pit loss (~11.2s-14.5s saved depending on circuit). No double counting is applied: the car pays only the neutralized pit delta.
                </p>
              </div>

              <div>
                <strong className="text-cyan-300">Tire Performance & Wetness Crossover:</strong>
                <p className="text-slate-400 mt-0.5">
                  Dry slicks incur quadratic grip loss once track wetness exceeds 18%. The empirical crossover where Intermediates become faster than Slicks occurs at ~25% track wetness. Full Wets become superior when surface standing water exceeds 68%.
                </p>
              </div>

              <div>
                <strong className="text-cyan-300">Fuel Compliance:</strong>
                <p className="text-slate-400 mt-0.5">
                  Any strategy that finishes with less than 1.0kg fuel is marked <strong>INFEASIBLE</strong> due to mandatory FIA Article 6.5.2 post-race fuel inspection disqualification risk.
                </p>
              </div>
            </div>
          </div>

          {/* Known Limitations */}
          <div className="bg-amber-950/20 border border-amber-900/50 rounded-xl p-3.5 text-slate-300">
            <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Known Heuristic Assumptions & Limitations
            </h3>
            <ul className="list-disc list-inside space-y-1 text-slate-400 mt-1 text-[11px]">
              <li>Circuit paths are rendered as schematic approximations to protect intellectual property and maintain lightweight browser performance.</li>
              <li>Aero slipstream (tow) and DRS trains are simplified to pace offsets rather than micro-physical CFD turbulence.</li>
              <li>Rival pit decisions are modeled based on predefined strategic archetypes (aggressive, conservative, reactive).</li>
              <li>Independent design demo; no affiliation with Formula 1, FIA, or racing teams.</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-slate-800 bg-slate-950/80 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 transition-colors shadow-sm"
          >
            ACKNOWLEDGE & RETURN
          </button>
        </div>
      </div>
    </div>
  );
};
