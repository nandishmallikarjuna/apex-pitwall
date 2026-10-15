import React from 'react';
import { RaceScenario, StrategyEvaluationResult } from '../types/strategy';
import { Bell, ShieldAlert, CloudRain, AlertTriangle, CheckCircle, Disc, UserCheck } from 'lucide-react';

export interface SimulationEvent {
  id: string;
  time: string;
  lap: number;
  type: 'SAFETY_CAR' | 'WEATHER' | 'RIVAL_ACTION' | 'TIRE_WARNING' | 'STRATEGY_SHIFT';
  title: string;
  description: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL' | 'SUCCESS';
}

interface EventTimelineProps {
  events: SimulationEvent[];
}

export const EventTimeline: React.FC<EventTimelineProps> = ({ events }) => {
  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 shadow-lg">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
            Race Event & Telemetry Incident Feed
          </h2>
        </div>
        <span className="text-[10px] font-mono text-slate-400">
          State-driven simulation triggers
        </span>
      </div>

      <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
        {events.length === 0 ? (
          <div className="py-6 text-center text-xs font-mono text-slate-500">
            No active incidents. Green flag racing conditions.
          </div>
        ) : (
          events.map((evt) => {
            const isCrit = evt.severity === 'CRITICAL';
            const isWarn = evt.severity === 'WARNING';
            const isSucc = evt.severity === 'SUCCESS';

            return (
              <div
                key={evt.id}
                className={`p-2.5 rounded-lg border flex items-start gap-2.5 transition-colors font-mono text-xs ${
                  isCrit
                    ? 'bg-red-950/30 border-red-800/80 text-red-200'
                    : isWarn
                    ? 'bg-amber-950/30 border-amber-800/80 text-amber-200'
                    : isSucc
                    ? 'bg-emerald-950/30 border-emerald-800/80 text-emerald-200'
                    : 'bg-slate-950/70 border-slate-800 text-slate-300'
                }`}
              >
                {/* Icon */}
                <div className="mt-0.5 shrink-0">
                  {evt.type === 'SAFETY_CAR' && <ShieldAlert className="w-4 h-4 text-amber-400" />}
                  {evt.type === 'WEATHER' && <CloudRain className="w-4 h-4 text-blue-400" />}
                  {evt.type === 'RIVAL_ACTION' && <UserCheck className="w-4 h-4 text-purple-400" />}
                  {evt.type === 'TIRE_WARNING' && <AlertTriangle className="w-4 h-4 text-orange-400" />}
                  {evt.type === 'STRATEGY_SHIFT' && <CheckCircle className="w-4 h-4 text-cyan-400" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-white truncate text-[11px]">
                      {evt.title}
                    </span>
                    <span className="text-[10px] text-slate-400 shrink-0">
                      L{evt.lap} • {evt.time}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                    {evt.description}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
