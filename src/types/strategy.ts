export type TireCompound = 'SOFT' | 'MEDIUM' | 'HARD' | 'INTERMEDIATE' | 'WET';

export type WeatherCondition = 'DRY' | 'DAMP' | 'LIGHT_RAIN' | 'HEAVY_RAIN' | 'MONSOON';

export type SafetyCarStatus = 'NONE' | 'VIRTUAL' | 'FULL_SC';

export interface CircuitInfo {
  id: string;
  name: string;
  location: string;
  lengthKm: number;
  totalLaps: number;
  baseLapTimeSec: number;
  pitLaneDeltaSec: number; // Regular green-flag pit loss
  scPitLaneDeltaSec: number; // Pit loss under SC (~50-55% of green flag)
  overtakingDifficulty: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
  turnsCount: number;
  drsZones: number;
  schematicNotice: string;
  trackPath2D: [number, number][]; // Normalized schematic coordinates
}

export interface RivalCar {
  id: string;
  name: string;
  team: string;
  color: string;
  position: number;
  gapSec: number; // relative to leader or us
  currentCompound: TireCompound;
  tireAgeLaps: number;
  tireWearPercent: number;
  plannedPitLap: number | null; // null = staying out
  plannedPitCompound: TireCompound | null;
  isInPit: boolean;
  paceOffsetSec: number; // driver pace relative to base (+0.2s or -0.2s)
}

export interface RaceScenario {
  id: string;
  title: string;
  circuitId: string;
  currentLap: number;
  totalLaps: number;
  ourPosition: number;
  
  // Our car state
  currentCompound: TireCompound;
  tireAgeLaps: number;
  tireWearPercent: number;
  fuelRemainingKg: number;
  fuelConsumptionPerLapKg: number;
  minFuelBufferKg: number;
  
  // Weather & track
  currentWeather: WeatherCondition;
  currentTrackWetnessPercent: number; // 0 to 100
  rainForecastLap: number; // Lap when rain begins
  rainPeakIntensityPercent: number; // 0 to 100
  rainDurationLaps: number;
  
  // Safety car
  safetyCarStatus: SafetyCarStatus;
  safetyCarLapsRemaining: number;
  
  // Pit parameters
  pitDelayLaps: number; // For Strategy 5: Delay pit stop by X laps
  
  // Rivals
  rivals: RivalCar[];
  
  // Degradation sensitivity multiplier (1.0 = normal, 1.5 = high deg)
  degMultiplier: number;
}

export interface LapSimulationPoint {
  lap: number;
  lapTimeSec: number;
  cumulativeTimeSec: number;
  tireWearPercent: number;
  trackWetnessPercent: number;
  compound: TireCompound;
  isPitLap: boolean;
  isSafetyCarLap: boolean;
  fuelRemainingKg: number;
  riskPenaltySec: number;
}

export interface CandidateStrategy {
  id: string;
  name: string;
  shortLabel: string;
  code: string;
  description: string;
  targetCompound: TireCompound;
  pitLap: number | null; // null = stay out
  stopsCount: number;
  totalRemainingTimeSec: number;
  timeDeltaToBestSec: number;
  projectedPosition: number;
  tireWearAtFinishPercent: number;
  fuelAtFinishKg: number;
  feasibility: 'OPTIMAL' | 'VIABLE' | 'HIGH_RISK' | 'INFEASIBLE';
  confidenceScore: number; // 0 to 100%
  uncertaintyRangeSec: [number, number]; // e.g. [-2.5, +3.8]
  primaryPros: string[];
  primaryCons: string[];
  whyItWinsOrLoses: string;
  switchTriggers: string[];
  lapBreakdown: LapSimulationPoint[];
}

export interface StrategyEvaluationResult {
  recommendedStrategyId: string;
  fallbackStrategyId: string;
  rankedStrategies: CandidateStrategy[];
  modelSummary: {
    scDeltaAdvantageSec: number;
    wetCrossoverLap: number | null;
    estimatedFuelDeficit: boolean;
    weatherShiftRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  };
  keyDecisiveFactor: string;
  triggerMatrix: {
    condition: string;
    action: string;
    impact: string;
  }[];
}

export interface DecisionLogEntry {
  id: string;
  timestamp: string;
  circuitName: string;
  currentLap: number;
  weatherState: string;
  safetyCarState: string;
  recommendedStrategy: string;
  recommendedCompound: string;
  pitLap: number | string;
  projectedPosition: number;
  advantageOverStayOutSec: number;
  confidenceScore: number;
  decisiveReason: string;
}

export interface WhatIfSnapshot {
  scenarioName: string;
  scenario: RaceScenario;
  evaluation: StrategyEvaluationResult;
}
