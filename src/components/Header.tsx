import React from 'react';
import { CircuitInfo, RaceScenario, SafetyCarStatus } from '../types/strategy';
import { CIRCUITS } from '../engine/circuitsData';
import { SCENARIO_PRESETS } from '../engine/presets';
import { soundFx } from '../utils/audioSynth';
import {
  Flag,
  ShieldAlert,
  GitCompare,
  RotateCcw,
  BookOpen,
  Volume2,
  VolumeX,
  Sparkles,
  Zap,
  MapPin,
  Clock
} from 'lucide-react';

interface HeaderProps {
  currentCircuit: CircuitInfo;
  scenario: RaceScenario;
  onSelectCircuit: (circuitId: string) => void;
  onSelectPreset: (presetId: string) => void;
  onResetScenario: () => void;
  onOpenWhatIf: () => void;
  onOpenModelAssumptions: () => void;
  isAudioMuted: boolean;
  onToggleAudio: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentCircuit,
  scenario,
  onSelectCircuit,
  onSelectPreset,
  onResetScenario,
  onOpenWhatIf,
  onOpenModelAssumptions,
  isAudioMuted,
  onToggleAudio
}) => {
  return (
    <header className="w-full bg-[#090d16] border-b border-slate-800/80 px-4 py-2.5 shadow-2xl flex flex-col gap-2.5 font-mono select-none">
      {/* Top Banner: Brand, Status, Circuit Picker, Action Buttons */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Left: Product Brand & Synthetic Model Indicator */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-md shadow-cyan-500/20 text-slate-950 font-black text-lg">
              ▲
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black tracking-widest text-white uppercase font-sans">
                  APEX <span className="text-cyan-400 font-mono">PITWALL</span>
                </h1>
                <span className="text-[10px] font-mono px-1.5 py-0.2 bg-slate-800 text-slate-300 rounded border border-slate-700">
                  v2.4 PROTOTYPE
                </span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2">
                <span className="text-cyan-400 font-semibold">TACTICAL STRATEGY DECISION SYSTEM</span>
                <span>•</span>
                <span className="text-amber-400 font-bold bg-amber-950/60 px-1 rounded border border-amber-800/60">
                  DEMO DATA // NOT FIA TELEMETRY
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Center: Circuit Switcher (4 Required Circuits) */}
        <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-slate-800 text-xs">
          <span className="text-[10px] text-slate-500 font-bold px-2 flex items-center gap-1">
            <MapPin className="w-3 h-3 text-cyan-400" />
            CIRCUIT:
          </span>
          {Object.values(CIRCUITS).map((c) => (
            <button
              key={c.id}
              onClick={() => {
                soundFx.playTelemetryClick();
                onSelectCircuit(c.id);
              }}
              className={`px-2.5 py-1 rounded-lg font-mono transition-all text-xs ${
                currentCircuit.id === c.id
                  ? 'bg-cyan-500 text-slate-950 font-extrabold shadow-md shadow-cyan-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-850'
              }`}
            >
              {c.name.split(' (')[0]}
            </button>
          ))}
        </div>

        {/* Right: Quick Actions */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Preset Selector */}
          <select
            value={scenario.id}
            onChange={(e) => {
              soundFx.playTelemetryClick();
              onSelectPreset(e.target.value);
            }}
            className="bg-slate-900 text-white text-xs font-mono rounded-lg px-2.5 py-1.5 border border-slate-700 focus:outline-none focus:border-cyan-500"
          >
            <option value="championship_decider">Preset: Championship Decider (Default)</option>
            <option value="dry_high_deg">Preset: Dry High-Deg Sprint</option>
            <option value="heavy_deluge">Preset: Sudden Heavy Deluge</option>
            <option value="late_safety_car">Preset: Late Safety Car Window</option>
            <option value="high_deg_crisis">Preset: High Deg Crisis</option>
            <option value="low_fuel_reserve">Preset: Low Fuel Reserve</option>
          </select>

          {/* What-If Comparison Button */}
          <button
            onClick={() => {
              soundFx.playTelemetryClick();
              onOpenWhatIf();
            }}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-mono font-bold rounded-lg bg-slate-800 text-cyan-300 hover:bg-slate-750 hover:text-white transition-colors border border-slate-700 shadow-sm"
            title="Open What-If Scenario Comparator"
          >
            <GitCompare className="w-3.5 h-3.5" />
            WHAT-IF (A/B)
          </button>

          {/* Model Assumptions Button */}
          <button
            onClick={() => {
              soundFx.playTelemetryClick();
              onOpenModelAssumptions();
            }}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-mono font-bold rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-750 hover:text-white transition-colors border border-slate-700"
            title="View Model Mechanics and Data Specification"
          >
            <BookOpen className="w-3.5 h-3.5" />
            MODEL SPEC
          </button>

          {/* Reset Scenario Button */}
          <button
            onClick={() => {
              soundFx.playRadioBeep();
              onResetScenario();
            }}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors border border-slate-800"
            title="Reset to Opening Scenario"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Audio Sound FX Toggle */}
          <button
            onClick={onToggleAudio}
            className={`p-1.5 rounded-lg transition-colors border ${
              isAudioMuted
                ? 'text-slate-500 bg-slate-900 border-slate-800'
                : 'text-cyan-400 bg-cyan-950/60 border-cyan-800'
            }`}
            title={isAudioMuted ? 'Unmute Pit-Wall Radio FX' : 'Mute Pit-Wall Radio FX'}
          >
            {isAudioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Safety Car & Critical Alert Ticker */}
      {scenario.safetyCarStatus === 'FULL_SC' && (
        <div className="w-full bg-gradient-to-r from-amber-950/80 via-amber-900/60 to-amber-950/80 border border-amber-600/70 px-3 py-1.5 rounded-lg flex items-center justify-between text-xs text-amber-200">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
            <strong className="text-amber-300 tracking-wider">SAFETY CAR DEPLOYED (LAP {scenario.currentLap}):</strong>
            <span>Incident Sector 2. Delta pace active. Pit loss reduced by ~{currentCircuit.pitLaneDeltaSec - currentCircuit.scPitLaneDeltaSec}s. Expected duration: {scenario.safetyCarLapsRemaining} laps.</span>
          </div>
          <span className="text-[10px] bg-amber-500 text-slate-950 font-black px-2 py-0.5 rounded uppercase">
            CHEAP PIT WINDOW OPEN
          </span>
        </div>
      )}
    </header>
  );
};
