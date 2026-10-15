import React from 'react';
import { RivalCar, TireCompound } from '../types/strategy';
import { Users, AlertCircle, ArrowUpRight, Gauge, Disc } from 'lucide-react';

interface RivalMonitorProps {
  rivals: RivalCar[];
  onUpdateRival: (updatedRival: RivalCar) => void;
}

const TIRE_OPTIONS: TireCompound[] = ['SOFT', 'MEDIUM', 'HARD', 'INTERMEDIATE', 'WET'];

export const RivalMonitor: React.FC<RivalMonitorProps> = ({ rivals, onUpdateRival }) => {
  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 shadow-lg">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2.5 mb-3">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
            Rival Pitwall Monitor (Simulated Grid & Actions)
          </h2>
          <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold rounded bg-slate-800 text-slate-300">
            EDITABLE INTENT
          </span>
        </div>
        <span className="text-[10px] font-mono text-slate-400">
          Modify rival strategy to simulate undercut / overcut reactions
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        {rivals.map((rival) => {
          const isAhead = rival.gapSec < 0;

          return (
            <div
              key={rival.id}
              className={`rounded-lg border p-3 flex flex-col justify-between transition-colors ${
                rival.isInPit
                  ? 'bg-amber-950/20 border-amber-600/70 shadow-sm shadow-amber-950/40'
                  : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                {/* Header: Position, Name, Team */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: rival.color }}
                    />
                    <span className="text-xs font-mono font-bold text-white">
                      P{rival.position} {rival.name}
                    </span>
                  </div>
                  <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                    rival.isInPit
                      ? 'bg-amber-500 text-slate-950 animate-pulse'
                      : 'bg-slate-800 text-slate-300'
                  }`}>
                    {rival.isInPit ? 'BOXING NOW' : 'ON TRACK'}
                  </span>
                </div>

                <div className="text-[11px] font-mono text-slate-400 mt-1 flex items-center justify-between">
                  <span>{rival.team}</span>
                  <span className={isAhead ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'}>
                    Gap: {isAhead ? `${rival.gapSec.toFixed(1)}s` : `+${rival.gapSec.toFixed(1)}s`}
                  </span>
                </div>

                {/* Current Tire Stats */}
                <div className="mt-2.5 p-2 bg-slate-900/90 rounded border border-slate-800 text-[11px] font-mono">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Current Tire:</span>
                    <span className="font-bold text-white">{rival.currentCompound} ({rival.tireAgeLaps}L)</span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-slate-400">Estimated Wear:</span>
                    <span className={rival.tireWearPercent > 70 ? 'text-amber-400 font-bold' : 'text-slate-300'}>
                      {rival.tireWearPercent}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-slate-400">Pace Offset:</span>
                    <span className="text-slate-300">{rival.paceOffsetSec >= 0 ? `+${rival.paceOffsetSec.toFixed(2)}s` : `${rival.paceOffsetSec.toFixed(2)}s`}/L</span>
                  </div>
                </div>

                {/* Editable Pit Stop Action */}
                <div className="mt-3 pt-2 border-t border-slate-800/80">
                  <label className="text-[10px] font-mono text-cyan-400 uppercase font-bold block mb-1">
                    Simulated Pit Decision:
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {/* Pit Lap toggle */}
                    <select
                      value={rival.plannedPitLap === null ? 'stay' : rival.plannedPitLap}
                      onChange={(e) => {
                        const val = e.target.value;
                        onUpdateRival({
                          ...rival,
                          plannedPitLap: val === 'stay' ? null : parseInt(val, 10),
                          isInPit: val === '31'
                        });
                      }}
                      className="bg-slate-900 text-white text-xs font-mono rounded px-2 py-1 border border-slate-700 focus:outline-none focus:border-cyan-500"
                    >
                      <option value="stay">Stay Out</option>
                      <option value="31">Box Lap 31 (SC)</option>
                      <option value="33">Box Lap 33</option>
                      <option value="35">Box Lap 35 (Rain)</option>
                    </select>

                    {/* Pit Compound selector */}
                    <select
                      value={rival.plannedPitCompound || 'MEDIUM'}
                      disabled={rival.plannedPitLap === null}
                      onChange={(e) => {
                        onUpdateRival({
                          ...rival,
                          plannedPitCompound: e.target.value as TireCompound
                        });
                      }}
                      className={`text-xs font-mono rounded px-2 py-1 border focus:outline-none ${
                        rival.plannedPitLap === null
                          ? 'bg-slate-950 text-slate-600 border-slate-850 cursor-not-allowed'
                          : 'bg-slate-900 text-white border-slate-700 focus:border-cyan-500'
                      }`}
                    >
                      {TIRE_OPTIONS.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Status Note */}
              <div className="mt-2 text-[10px] font-mono text-slate-500">
                {rival.plannedPitLap === null
                  ? 'Guarding on-track position'
                  : `Committing to stop on L${rival.plannedPitLap} for ${rival.plannedPitCompound}`}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
