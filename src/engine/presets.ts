import { RaceScenario, RivalCar } from '../types/strategy';

const DEFAULT_RIVALS: RivalCar[] = [
  {
    id: 'rival_p1',
    name: 'C. Sterling #1',
    team: 'Apex Velocity',
    color: '#3b82f6', // Electric blue
    position: 1,
    gapSec: -2.8, // 2.8s ahead of our car
    currentCompound: 'HARD',
    tireAgeLaps: 24,
    tireWearPercent: 64,
    plannedPitLap: null, // Staying out!
    plannedPitCompound: null,
    isInPit: false,
    paceOffsetSec: -0.15
  },
  {
    id: 'rival_p2',
    name: 'M. Keller #4',
    team: 'Krypton Motorsport',
    color: '#f97316', // Bright orange
    position: 2,
    gapSec: -1.2, // 1.2s ahead of our car
    currentCompound: 'MEDIUM',
    tireAgeLaps: 20,
    tireWearPercent: 71,
    plannedPitLap: 31, // Pitting unexpectedly now!
    plannedPitCompound: 'SOFT',
    isInPit: true,
    paceOffsetSec: 0.05
  },
  {
    id: 'rival_p4',
    name: 'L. Rossi #55',
    team: 'Scuderia Modena',
    color: '#ef4444', // Red
    position: 4,
    gapSec: +1.9, // 1.9s behind our car
    currentCompound: 'HARD',
    tireAgeLaps: 18,
    tireWearPercent: 52,
    plannedPitLap: 31, // Splitting strategy
    plannedPitCompound: 'INTERMEDIATE',
    isInPit: true,
    paceOffsetSec: -0.05
  },
  {
    id: 'rival_p5',
    name: 'F. Moreau #31',
    team: 'Nordic Alpine',
    color: '#06b6d4', // Cyan
    position: 5,
    gapSec: +4.6,
    currentCompound: 'MEDIUM',
    tireAgeLaps: 22,
    tireWearPercent: 68,
    plannedPitLap: null,
    plannedPitCompound: null,
    isInPit: false,
    paceOffsetSec: +0.25
  }
];

export const SCENARIO_PRESETS: Record<string, RaceScenario> = {
  // 1. DEFAULT OPENING SCENARIO: Championship Decider
  championship_decider: {
    id: 'championship_decider',
    title: 'Championship Decider (Default)',
    circuitId: 'monaco',
    currentLap: 31,
    totalLaps: 53,
    ourPosition: 3,

    // Our car state
    currentCompound: 'HARD',
    tireAgeLaps: 22,
    tireWearPercent: 68, // Degradation accelerating!
    fuelRemainingKg: 34.2,
    fuelConsumptionPerLapKg: 1.48,
    minFuelBufferKg: 1.2,

    // Weather & track
    currentWeather: 'DAMP',
    currentTrackWetnessPercent: 8,
    rainForecastLap: 35, // Approaching rain in 4 laps
    rainPeakIntensityPercent: 58, // Inter crossover range
    rainDurationLaps: 12,

    // Safety Car
    safetyCarStatus: 'FULL_SC', // Safety Car has just been deployed!
    safetyCarLapsRemaining: 3,

    // Strategy 5 delay
    pitDelayLaps: 4,

    // Degradation
    degMultiplier: 1.25,

    rivals: JSON.parse(JSON.stringify(DEFAULT_RIVALS))
  },

  // 2. DRY HIGH-DEG SPRINT
  dry_high_deg: {
    id: 'dry_high_deg',
    title: 'Dry High-Deg Sprint',
    circuitId: 'baku',
    currentLap: 31,
    totalLaps: 53,
    ourPosition: 3,

    currentCompound: 'MEDIUM',
    tireAgeLaps: 20,
    tireWearPercent: 74,
    fuelRemainingKg: 35.0,
    fuelConsumptionPerLapKg: 1.55,
    minFuelBufferKg: 1.2,

    currentWeather: 'DRY',
    currentTrackWetnessPercent: 0,
    rainForecastLap: 99, // No rain
    rainPeakIntensityPercent: 0,
    rainDurationLaps: 0,

    safetyCarStatus: 'NONE',
    safetyCarLapsRemaining: 0,

    pitDelayLaps: 3,
    degMultiplier: 1.6, // Extreme degradation

    rivals: DEFAULT_RIVALS.map(r => ({
      ...r,
      plannedPitLap: r.position === 1 ? 34 : 31,
      plannedPitCompound: 'HARD'
    }))
  },

  // 3. SUDDEN HEAVY DELUGE
  heavy_deluge: {
    id: 'heavy_deluge',
    title: 'Sudden Heavy Deluge',
    circuitId: 'singapore',
    currentLap: 31,
    totalLaps: 53,
    ourPosition: 3,

    currentCompound: 'MEDIUM',
    tireAgeLaps: 15,
    tireWearPercent: 48,
    fuelRemainingKg: 33.5,
    fuelConsumptionPerLapKg: 1.50,
    minFuelBufferKg: 1.2,

    currentWeather: 'HEAVY_RAIN',
    currentTrackWetnessPercent: 45,
    rainForecastLap: 32, // Rain hits IMMEDIATELY next lap!
    rainPeakIntensityPercent: 92, // Extreme monsoon wetness
    rainDurationLaps: 16,

    safetyCarStatus: 'FULL_SC',
    safetyCarLapsRemaining: 4,

    pitDelayLaps: 2,
    degMultiplier: 1.1,

    rivals: DEFAULT_RIVALS.map(r => ({
      ...r,
      plannedPitLap: 31,
      plannedPitCompound: r.position === 1 ? 'INTERMEDIATE' : 'WET'
    }))
  },

  // 4. LATE SAFETY CAR WINDOW
  late_safety_car: {
    id: 'late_safety_car',
    title: 'Late Safety Car Window (Lap 44)',
    circuitId: 'madrid',
    currentLap: 44,
    totalLaps: 53,
    ourPosition: 3,

    currentCompound: 'HARD',
    tireAgeLaps: 28,
    tireWearPercent: 82, // Very worn rubber
    fuelRemainingKg: 15.0,
    fuelConsumptionPerLapKg: 1.45,
    minFuelBufferKg: 1.0,

    currentWeather: 'DRY',
    currentTrackWetnessPercent: 0,
    rainForecastLap: 99,
    rainPeakIntensityPercent: 0,
    rainDurationLaps: 0,

    safetyCarStatus: 'FULL_SC',
    safetyCarLapsRemaining: 3, // SC restarts with 6 laps to go!

    pitDelayLaps: 2,
    degMultiplier: 1.3,

    rivals: DEFAULT_RIVALS.map(r => ({
      ...r,
      plannedPitLap: r.position === 2 ? 44 : null,
      plannedPitCompound: 'SOFT'
    }))
  },

  // 5. HIGH TIRE DEGRADATION CRISIS
  high_deg_crisis: {
    id: 'high_deg_crisis',
    title: 'High Tire Degradation Crisis',
    circuitId: 'monaco',
    currentLap: 31,
    totalLaps: 53,
    ourPosition: 3,

    currentCompound: 'SOFT',
    tireAgeLaps: 18,
    tireWearPercent: 88, // In the danger zone
    fuelRemainingKg: 32.0,
    fuelConsumptionPerLapKg: 1.48,
    minFuelBufferKg: 1.2,

    currentWeather: 'DRY',
    currentTrackWetnessPercent: 0,
    rainForecastLap: 45,
    rainPeakIntensityPercent: 35,
    rainDurationLaps: 6,

    safetyCarStatus: 'NONE',
    safetyCarLapsRemaining: 0,

    pitDelayLaps: 3,
    degMultiplier: 1.9, // High thermal track temperature

    rivals: JSON.parse(JSON.stringify(DEFAULT_RIVALS))
  },

  // 6. LOW FUEL RESERVE
  low_fuel_reserve: {
    id: 'low_fuel_reserve',
    title: 'Low Fuel Reserve (Under-fueled)',
    circuitId: 'baku',
    currentLap: 31,
    totalLaps: 53,
    ourPosition: 3,

    currentCompound: 'MEDIUM',
    tireAgeLaps: 16,
    tireWearPercent: 55,
    fuelRemainingKg: 28.5, // 28.5kg for 23 laps at 1.48kg/lap = ~34kg required! Deficit!
    fuelConsumptionPerLapKg: 1.48,
    minFuelBufferKg: 1.2,

    currentWeather: 'DRY',
    currentTrackWetnessPercent: 5,
    rainForecastLap: 42,
    rainPeakIntensityPercent: 45,
    rainDurationLaps: 8,

    safetyCarStatus: 'VIRTUAL',
    safetyCarLapsRemaining: 2,

    pitDelayLaps: 4,
    degMultiplier: 1.2,

    rivals: JSON.parse(JSON.stringify(DEFAULT_RIVALS))
  }
};
