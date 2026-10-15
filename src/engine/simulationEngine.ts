import {
  CandidateStrategy,
  CircuitInfo,
  LapSimulationPoint,
  RaceScenario,
  StrategyEvaluationResult,
  TireCompound,
  RivalCar
} from '../types/strategy';
import { CIRCUITS } from './circuitsData';

// Tire pace baseline deltas (seconds relative to reference Medium)
const TIRE_BASE_PACE_DELTA: Record<TireCompound, number> = {
  SOFT: -0.65,
  MEDIUM: 0.0,
  HARD: +0.45,
  INTERMEDIATE: +3.2, // Reference wet tire pace offset
  WET: +7.5
};

// Base wear rate per lap (% wear)
const TIRE_BASE_WEAR_RATE: Record<TireCompound, number> = {
  SOFT: 4.8,
  MEDIUM: 3.2,
  HARD: 2.1,
  INTERMEDIATE: 3.4,
  WET: 3.0
};

// Wetness thresholds
const SLICK_WET_GRIP_LOSS_THRESHOLD = 18; // % wetness where slicks start slipping
const INTER_OPTIMAL_MIN_WETNESS = 25; // % wetness where Inters become faster than Slicks
const INTER_OPTIMAL_MAX_WETNESS = 68; // % wetness above which Full Wets are faster
const SLICK_MANDATORY_BOX_WETNESS = 42; // % wetness where slicks are dangerously slow / forced to box

/**
 * Calculates track wetness percentage for a given lap
 */
export function calculateLapWetness(scenario: RaceScenario, lap: number): number {
  const { currentLap, currentTrackWetnessPercent, rainForecastLap, rainPeakIntensityPercent, rainDurationLaps } = scenario;

  if (lap < rainForecastLap) {
    // Before forecast rain lap: slow drying or holding current track wetness
    const dryingFactor = Math.max(0, currentTrackWetnessPercent - (lap - currentLap) * 1.5);
    return Math.round(dryingFactor);
  }

  // Rain in progress
  const lapIntoRain = lap - rainForecastLap + 1;
  const rampUpLaps = Math.max(1, Math.min(3, Math.floor(rainDurationLaps * 0.35)));

  if (lapIntoRain <= rampUpLaps) {
    // Ramp up phase
    const progress = lapIntoRain / rampUpLaps;
    const wetness = currentTrackWetnessPercent + (rainPeakIntensityPercent - currentTrackWetnessPercent) * progress;
    return Math.round(Math.min(100, Math.max(0, wetness)));
  }

  if (lapIntoRain <= rainDurationLaps) {
    // Peak rain phase
    return Math.round(Math.min(100, rainPeakIntensityPercent));
  }

  // Post-rain drying phase
  const lapsAfterRain = lapIntoRain - rainDurationLaps;
  const driedWetness = rainPeakIntensityPercent - lapsAfterRain * 6.5; // ~6.5% dry per lap
  return Math.round(Math.max(0, driedWetness));
}

/**
 * Calculates tire degradation pace penalty in seconds for a single lap
 */
function calculateTireDegradationPenalty(compound: TireCompound, wearPercent: number): number {
  if (compound === 'INTERMEDIATE' || compound === 'WET') {
    if (wearPercent < 50) return wearPercent * 0.015;
    return 0.75 + Math.pow((wearPercent - 50) / 10, 1.8) * 0.35;
  }

  // Dry compounds
  if (wearPercent < 60) {
    return wearPercent * 0.018; // Linear early wear
  }
  // The 'Cliff': exponential time loss
  const cliffFactor = (wearPercent - 60) / 10;
  return 1.08 + Math.pow(cliffFactor, 2.1) * 0.45;
}

/**
 * Calculates surface mismatch penalty (e.g. slicks on standing water or inters on dry tarmac)
 */
function calculateSurfaceMismatchPenalty(compound: TireCompound, wetnessPercent: number): { penaltySec: number; extraWearPercent: number } {
  const isSlick = compound === 'SOFT' || compound === 'MEDIUM' || compound === 'HARD';

  if (isSlick) {
    if (wetnessPercent <= SLICK_WET_GRIP_LOSS_THRESHOLD) {
      return { penaltySec: 0, extraWearPercent: 0 };
    }
    // Severe grip loss when track gets wet
    const excess = wetnessPercent - SLICK_WET_GRIP_LOSS_THRESHOLD;
    const penaltySec = Math.pow(excess / 6.5, 2.0) * 1.1;
    return { penaltySec, extraWearPercent: 0 };
  }

  if (compound === 'INTERMEDIATE') {
    if (wetnessPercent < INTER_OPTIMAL_MIN_WETNESS) {
      // Overheating on dry tarmac
      const dryDeficit = INTER_OPTIMAL_MIN_WETNESS - wetnessPercent;
      const penaltySec = (dryDeficit / 5) * 0.85; // up to +4.2s on dry track
      const extraWearPercent = (dryDeficit / 5) * 1.2; // Inters shred on dry track
      return { penaltySec, extraWearPercent };
    }
    if (wetnessPercent > INTER_OPTIMAL_MAX_WETNESS) {
      // Hydroplaning in standing water
      const floodExcess = wetnessPercent - INTER_OPTIMAL_MAX_WETNESS;
      const penaltySec = Math.pow(floodExcess / 8, 1.7) * 1.5;
      return { penaltySec, extraWearPercent: 0 };
    }
    return { penaltySec: 0, extraWearPercent: 0 };
  }

  // FULL WET
  if (wetnessPercent < 50) {
    // Massive thermal destruction on dry/damp
    const deficit = 50 - wetnessPercent;
    const penaltySec = Math.pow(deficit / 7, 1.8) * 1.4; // up to +10s
    const extraWearPercent = (deficit / 6) * 1.6;
    return { penaltySec, extraWearPercent };
  }
  return { penaltySec: 0, extraWearPercent: 0 };
}

/**
 * Simulates the remaining laps for a specific candidate strategy
 */
export function simulateStrategy(
  scenario: RaceScenario,
  circuit: CircuitInfo,
  targetCompound: TireCompound,
  initialPitLap: number | null,
  strategyId: string,
  strategyName: string,
  code: string,
  description: string
): CandidateStrategy {
  const {
    currentLap,
    totalLaps,
    currentCompound,
    tireAgeLaps,
    tireWearPercent,
    fuelRemainingKg,
    fuelConsumptionPerLapKg,
    minFuelBufferKg,
    safetyCarStatus,
    safetyCarLapsRemaining,
    degMultiplier
  } = scenario;

  let activeCompound = currentCompound;
  let activeWear = tireWearPercent;
  let activeFuel = fuelRemainingKg;
  let cumulativeTime = 0;
  let stopsCount = 0;
  const lapBreakdown: LapSimulationPoint[] = [];

  // Track reactive emergency stops if conditions radically invert
  let hasEmergencyBoxed = false;

  for (let lap = currentLap; lap <= totalLaps; lap++) {
    const wetness = calculateLapWetness(scenario, lap);
    const lapsUnderSC = Math.max(0, safetyCarLapsRemaining - (lap - currentLap));
    const isSafetyCar = safetyCarStatus === 'FULL_SC' && lapsUnderSC > 0;

    let isPitLap = false;
    let pitTimeCostSec = 0;

    // Check scheduled pit stop
    if (initialPitLap !== null && lap === initialPitLap) {
      isPitLap = true;
      stopsCount++;
      activeCompound = targetCompound;
      activeWear = 0; // Fresh set
      // SC pit stop vs regular pit stop
      pitTimeCostSec = isSafetyCar ? circuit.scPitLaneDeltaSec : circuit.pitLaneDeltaSec;
      pitTimeCostSec += 1.2; // Cold tire out-lap warm-up penalty
    }

    // Check emergency reactive pit stop:
    // If running slicks and wetness crosses mandatory safety threshold, car must pit for Inters
    const isSlick = activeCompound === 'SOFT' || activeCompound === 'MEDIUM' || activeCompound === 'HARD';
    if (!isPitLap && isSlick && wetness >= SLICK_MANDATORY_BOX_WETNESS && !hasEmergencyBoxed && lap < totalLaps - 1) {
      isPitLap = true;
      stopsCount++;
      hasEmergencyBoxed = true;
      activeCompound = 'INTERMEDIATE';
      activeWear = 0;
      pitTimeCostSec = isSafetyCar ? circuit.scPitLaneDeltaSec : circuit.pitLaneDeltaSec;
      pitTimeCostSec += 2.0; // In-lap aquaplaning loss + tire warm up
    }

    // Calculate base lap pace
    let lapTimeSec: number;

    if (isSafetyCar) {
      // Under Safety Car, delta pace is ~138% of base lap time
      lapTimeSec = circuit.baseLapTimeSec * 1.38 + (isPitLap ? pitTimeCostSec : 0);
      // Under SC, tire degradation is reduced by 65% and fuel consumption by 45%
      activeWear += (TIRE_BASE_WEAR_RATE[activeCompound] * 0.35 * degMultiplier);
      activeFuel -= (fuelConsumptionPerLapKg * 0.55);
    } else {
      // Green flag racing
      const compoundDelta = TIRE_BASE_PACE_DELTA[activeCompound];
      const degPenalty = calculateTireDegradationPenalty(activeCompound, activeWear);
      const surface = calculateSurfaceMismatchPenalty(activeCompound, wetness);

      // Weight reduction effect: burning ~1.6kg fuel makes car ~0.035s faster per lap
      const fuelWeightAdvantage = ((scenario.totalLaps - lap) * 0.032);

      // Total lap time
      lapTimeSec = circuit.baseLapTimeSec + compoundDelta + degPenalty + surface.penaltySec - fuelWeightAdvantage;
      if (isPitLap) {
        lapTimeSec += pitTimeCostSec;
      }

      // Update tire wear
      const baseWear = TIRE_BASE_WEAR_RATE[activeCompound] * degMultiplier;
      activeWear += (baseWear + surface.extraWearPercent);

      // Update fuel
      activeFuel -= fuelConsumptionPerLapKg;
    }

    // Cap wear at 100%
    activeWear = Math.min(100, Math.max(0, activeWear));
    cumulativeTime += lapTimeSec;

    lapBreakdown.push({
      lap,
      lapTimeSec: Number(lapTimeSec.toFixed(2)),
      cumulativeTimeSec: Number(cumulativeTime.toFixed(2)),
      tireWearPercent: Number(activeWear.toFixed(1)),
      trackWetnessPercent: wetness,
      compound: activeCompound,
      isPitLap,
      isSafetyCarLap: isSafetyCar,
      fuelRemainingKg: Number(activeFuel.toFixed(2)),
      riskPenaltySec: 0
    });
  }

  // Assess feasibility
  let feasibility: CandidateStrategy['feasibility'] = 'VIABLE';
  if (activeFuel < minFuelBufferKg) {
    feasibility = 'INFEASIBLE';
  } else if (activeWear >= 96) {
    feasibility = 'HIGH_RISK';
  } else {
    feasibility = 'OPTIMAL';
  }

  // Pros, cons & why-it-wins analysis
  const { pros, cons, whyText, triggers } = generateStrategyRationales(
    strategyId,
    scenario,
    circuit,
    targetCompound,
    initialPitLap,
    stopsCount,
    hasEmergencyBoxed,
    activeWear,
    activeFuel < minFuelBufferKg
  );

  return {
    id: strategyId,
    name: strategyName,
    shortLabel: targetCompound,
    code,
    description,
    targetCompound,
    pitLap: initialPitLap,
    stopsCount,
    totalRemainingTimeSec: Number(cumulativeTime.toFixed(2)),
    timeDeltaToBestSec: 0, // Computed later against best
    projectedPosition: scenario.ourPosition, // Updated in ranking
    tireWearAtFinishPercent: Number(activeWear.toFixed(1)),
    fuelAtFinishKg: Number(activeFuel.toFixed(2)),
    feasibility,
    confidenceScore: 0, // Calculated in evaluateScenario
    uncertaintyRangeSec: [0, 0],
    primaryPros: pros,
    primaryCons: cons,
    whyItWinsOrLoses: whyText,
    switchTriggers: triggers,
    lapBreakdown
  };
}

/**
 * Generates human-readable rationales and actionable triggers
 */
function generateStrategyRationales(
  strategyId: string,
  scenario: RaceScenario,
  circuit: CircuitInfo,
  targetCompound: TireCompound,
  pitLap: number | null,
  stopsCount: number,
  hasEmergencyBoxed: boolean,
  finalWear: number,
  isFuelDeficit: boolean
): { pros: string[]; cons: string[]; whyText: string; triggers: string[] } {
  const pros: string[] = [];
  const cons: string[] = [];
  let whyText = '';
  const triggers: string[] = [];

  const scDeltaSavings = (circuit.pitLaneDeltaSec - circuit.scPitLaneDeltaSec).toFixed(1);
  const rainDeltaLaps = scenario.rainForecastLap - scenario.currentLap;

  if (isFuelDeficit) {
    cons.push('Fails FIA 1.0L fuel compliance sample buffer at race finish.');
    whyText = 'Infeasible due to calculated fuel starvation before finish.';
    return { pros, cons, whyText, triggers };
  }

  switch (strategyId) {
    case 'strat_pit_inters_now':
      pros.push(`Capitalizes on Safety Car pit window, saving ${scDeltaSavings}s in pit delta.`);
      pros.push('Directly prepped for approaching precipitation window.');
      if (rainDeltaLaps <= 3) {
        whyText = `Recommended because rain arrives within ${rainDeltaLaps} laps. Pitting now exploits the cheap ${circuit.scPitLaneDeltaSec.toFixed(1)}s SC pit delta and transitions seamlessly to Inters without needing an expensive green-flag stop.`;
      } else {
        cons.push(`Rain is ${rainDeltaLaps} laps away; Intermediates will overheat and degrade on damp/dry asphalt.`);
        whyText = `High tire degradation on dry track while waiting for rain across ${rainDeltaLaps} laps offset SC pit savings.`;
      }
      triggers.push(`Switch to DRY SLICKS if radar delays rain beyond Lap ${scenario.rainForecastLap + 3}.`);
      triggers.push(`Hold track position if Safety Car is called in on Lap ${scenario.currentLap + 1}.`);
      break;

    case 'strat_stay_out':
      pros.push('Preserves track position with zero immediate pit loss.');
      pros.push('Maintains strategic flexibility until rain visually manifests on track.');
      if (hasEmergencyBoxed) {
        cons.push(`Forced emergency pit stop later under green flag, conceding full ${circuit.pitLaneDeltaSec.toFixed(1)}s pit loss.`);
        whyText = `Staying out loses time when rain arrives because boxing under green flag forfeits the ${scDeltaSavings}s SC pit discount.`;
      } else {
        whyText = 'Viable if rain completely misses the circuit or tire degradation remains manageable to the flag.';
      }
      if (finalWear > 85) {
        cons.push(`Critical tire degradation (${finalWear.toFixed(0)}%) in final 5 laps; high puncture risk.`);
      }
      triggers.push(`BOX IMMEDIATELY for Inters if rainfall rate crosses 25% track wetness.`);
      triggers.push(`BOX for fresh Mediums if rival behind initiates successful undercut.`);
      break;

    case 'strat_pit_dry_now':
      pros.push(`Banks the cheap ${circuit.scPitLaneDeltaSec.toFixed(1)}s SC pit delta.`);
      pros.push('Maximum dry-pace capability if rain clouds dissipate.');
      if (hasEmergencyBoxed) {
        cons.push('Guarantees an expensive two-stop race once rain arrives.');
        whyText = 'Fails to win because subsequent rain necessitates a second pit stop under green flag conditions.';
      } else {
        whyText = 'Dominates dry scenarios by refreshing worn rubber at half the customary pit time cost.';
      }
      triggers.push('Switch to Intermediates if radar shows rain intensity > 50%.');
      triggers.push('Push maximum out-lap to undercut P2 before SC restart.');
      break;

    case 'strat_pit_wet_now':
      pros.push('Safe harbor if immediate torrential cloudburst hits.');
      cons.push('Full Wets severely overheat and shred on any track wetness under 65%.');
      cons.push('Loses +4.0s to +8.0s per lap on moderate dampness.');
      whyText = 'Suboptimal unless an extreme monsoon event forces red-flag-level track inundation.';
      triggers.push('Deploy only if FIA race control declares extreme wet track conditions.');
      break;

    case 'strat_delay_pit':
      pros.push(`Pits precisely on Lap ${pitLap} at the verified rain crossover point.`);
      pros.push('Avoids cooking Intermediates during the dry SC laps.');
      if (scenario.safetyCarStatus === 'FULL_SC') {
        cons.push(`Forfeits ${scDeltaSavings}s SC discount by pitting after green flag restart.`);
      }
      whyText = `Delays pit stop to Lap ${pitLap} to match empirical tire crossover, balancing rubber life against pit delta loss.`;
      triggers.push(`Box early if Safety Car stays out until Lap ${pitLap}.`);
      triggers.push(`Extend stint if rain forecast keeps pushing back.`);
      break;
  }

  return { pros, cons, whyText, triggers };
}

/**
 * Simulates simulated rivals' finishing times based on their choices
 */
function simulateRivals(scenario: RaceScenario, circuit: CircuitInfo): Record<string, number> {
  const rivalFinishTimes: Record<string, number> = {};

  scenario.rivals.forEach((rival: RivalCar) => {
    let activeCompound = rival.currentCompound;
    let activeWear = rival.tireWearPercent;
    let totalTime = rival.gapSec; // Relative to baseline

    for (let lap = scenario.currentLap; lap <= scenario.totalLaps; lap++) {
      const wetness = calculateLapWetness(scenario, lap);
      const isSC = scenario.safetyCarStatus === 'FULL_SC' && (lap - scenario.currentLap) < scenario.safetyCarLapsRemaining;

      let isPit = false;
      let pitCost = 0;

      if (rival.plannedPitLap === lap && rival.plannedPitCompound) {
        isPit = true;
        activeCompound = rival.plannedPitCompound;
        activeWear = 0;
        pitCost = isSC ? circuit.scPitLaneDeltaSec : circuit.pitLaneDeltaSec;
      }

      // Slicks emergency box for rivals too
      const isSlick = activeCompound === 'SOFT' || activeCompound === 'MEDIUM' || activeCompound === 'HARD';
      if (!isPit && isSlick && wetness >= SLICK_MANDATORY_BOX_WETNESS && lap < scenario.totalLaps - 1) {
        isPit = true;
        activeCompound = 'INTERMEDIATE';
        activeWear = 0;
        pitCost = isSC ? circuit.scPitLaneDeltaSec : circuit.pitLaneDeltaSec;
      }

      if (isSC) {
        totalTime += circuit.baseLapTimeSec * 1.38 + (isPit ? pitCost : 0);
        activeWear += (TIRE_BASE_WEAR_RATE[activeCompound] * 0.35);
      } else {
        const compoundDelta = TIRE_BASE_PACE_DELTA[activeCompound];
        const degPenalty = calculateTireDegradationPenalty(activeCompound, activeWear);
        const surface = calculateSurfaceMismatchPenalty(activeCompound, wetness);
        totalTime += circuit.baseLapTimeSec + compoundDelta + degPenalty + surface.penaltySec + rival.paceOffsetSec + (isPit ? pitCost : 0);
        activeWear += (TIRE_BASE_WEAR_RATE[activeCompound] + surface.extraWearPercent);
      }
    }

    rivalFinishTimes[rival.id] = totalTime;
  });

  return rivalFinishTimes;
}

/**
 * Evaluates all 5 candidate strategies, calculates ranking, position projections, and uncertainty
 */
export function evaluateScenario(scenario: RaceScenario): StrategyEvaluationResult {
  const circuit = CIRCUITS[scenario.circuitId] || CIRCUITS.monaco;
  const targetDelayLap = scenario.currentLap + Math.max(1, scenario.pitDelayLaps);

  // Build the 5 core candidate strategies
  const stratStayOut = simulateStrategy(
    scenario,
    circuit,
    scenario.currentCompound,
    null,
    'strat_stay_out',
    'Stay Out (Track Position)',
    'PLAN A',
    'Stay out on current set. Gamble that rain arrives later or track remains dry; protect track position.'
  );

  const stratPitIntersNow = simulateStrategy(
    scenario,
    circuit,
    'INTERMEDIATE',
    scenario.currentLap,
    'strat_pit_inters_now',
    'Pit NOW for Intermediates (SC Window)',
    'PLAN B',
    `Pit on Lap ${scenario.currentLap} under Safety Car for Inters. Bank cheap SC pit delta (~${(circuit.pitLaneDeltaSec - circuit.scPitLaneDeltaSec).toFixed(1)}s saved) before rain hits.`
  );

  const stratPitDryNow = simulateStrategy(
    scenario,
    circuit,
    'MEDIUM',
    scenario.currentLap,
    'strat_pit_dry_now',
    'Pit NOW for Fresh Dry Tires',
    'PLAN C',
    `Pit on Lap ${scenario.currentLap} under Safety Car for fresh Mediums. Exploit cheap pit stop; prepare to defend if rain delays.`
  );

  const stratPitWetNow = simulateStrategy(
    scenario,
    circuit,
    'WET',
    scenario.currentLap,
    'strat_pit_wet_now',
    'Pit NOW for Full Wets (Deluge Contingency)',
    'PLAN D',
    'Extreme wet contingency. Equip Full Wets immediately in anticipation of an unpredicted monsoon.'
  );

  const stratDelayPit = simulateStrategy(
    scenario,
    circuit,
    'INTERMEDIATE',
    targetDelayLap,
    'strat_delay_pit',
    `Delay Pit to Lap ${targetDelayLap} (Crossover Window)`,
    'PLAN E',
    `Stay out under SC. Wait until Lap ${targetDelayLap} to confirm rain on radar and pit directly at crossover.`
  );

  const rawStrategies = [stratStayOut, stratPitIntersNow, stratPitDryNow, stratPitWetNow, stratDelayPit];

  // Simulate rivals' projected finish times
  const rivalFinishTimes = simulateRivals(scenario, circuit);

  // Sort strategies by total remaining time (ascending)
  rawStrategies.sort((a, b) => {
    // If one is infeasible, rank it last
    if (a.feasibility === 'INFEASIBLE' && b.feasibility !== 'INFEASIBLE') return 1;
    if (b.feasibility === 'INFEASIBLE' && a.feasibility !== 'INFEASIBLE') return -1;
    return a.totalRemainingTimeSec - b.totalRemainingTimeSec;
  });

  const bestTime = rawStrategies[0].totalRemainingTimeSec;

  // Compute position, delta, uncertainty, and confidence
  const rankedStrategies: CandidateStrategy[] = rawStrategies.map((strat, index) => {
    const delta = Number((strat.totalRemainingTimeSec - bestTime).toFixed(2));

    // Calculate position vs rivals
    let pos = 1;
    Object.values(rivalFinishTimes).forEach((rivalTime) => {
      if (rivalTime < strat.totalRemainingTimeSec) {
        pos++;
      }
    });

    // Uncertainty modeling based on rain forecast lap and deg multiplier
    const rainUncertaintySec = Math.abs(scenario.rainForecastLap - scenario.currentLap) * 0.45;
    const pitVarianceSec = 0.85;
    const uncertaintyRangeSec: [number, number] = [
      -Number((pitVarianceSec + rainUncertaintySec * 0.7).toFixed(1)),
      +Number((pitVarianceSec + rainUncertaintySec * 1.3).toFixed(1))
    ];

    // Confidence score (higher when delta to 2nd is substantial, lower when weather is erratic)
    let confidence = 82;
    if (index === 0) {
      const runnerUpDelta = rawStrategies[1] ? rawStrategies[1].totalRemainingTimeSec - bestTime : 5;
      confidence = Math.min(95, Math.max(62, Math.round(75 + runnerUpDelta * 1.8 - rainUncertaintySec * 2.2)));
    } else {
      confidence = Math.max(25, Math.round(80 - delta * 2.5));
    }

    if (strat.feasibility === 'INFEASIBLE') {
      confidence = 0;
      pos = 20; // DNF / Disqualified
    }

    return {
      ...strat,
      timeDeltaToBestSec: delta,
      projectedPosition: Math.min(20, Math.max(1, pos)),
      confidenceScore: confidence,
      uncertaintyRangeSec
    };
  });

  const recommended = rankedStrategies[0];
  const fallback = rankedStrategies[1] || rankedStrategies[0];

  // Wet crossover lap calculation
  let wetCrossoverLap: number | null = null;
  for (let l = scenario.currentLap; l <= scenario.totalLaps; l++) {
    const w = calculateLapWetness(scenario, l);
    if (w >= INTER_OPTIMAL_MIN_WETNESS) {
      wetCrossoverLap = l;
      break;
    }
  }

  // Key decisive factor explanation
  const scSaved = (circuit.pitLaneDeltaSec - circuit.scPitLaneDeltaSec).toFixed(1);
  let decisiveFactor = '';
  if (recommended.id === 'strat_pit_inters_now') {
    decisiveFactor = `Safety Car saves ${scSaved}s in pit loss, and rain reaches crossover (~${INTER_OPTIMAL_MIN_WETNESS}% wetness) on Lap ${wetCrossoverLap || scenario.rainForecastLap}, giving optimal tire window.`;
  } else if (recommended.id === 'strat_stay_out') {
    decisiveFactor = `Rain is delayed beyond critical window (Lap ${scenario.rainForecastLap}). Preserving track position P${scenario.ourPosition} on current rubber is faster than forfeiting track position.`;
  } else if (recommended.id === 'strat_pit_dry_now') {
    decisiveFactor = `Rain probability is low/delayed. Banking the cheap ${scSaved}s SC pit stop for fresh dry rubber yields massive pace delta against worn rivals.`;
  } else {
    decisiveFactor = `Delayed pit stop to Lap ${targetDelayLap} synchronizes with verified weather crossover without overheating Inters under early dry SC laps.`;
  }

  // Concrete trigger matrix
  const triggerMatrix = [
    {
      condition: `Rain arrives 2+ laps earlier (by Lap ${Math.max(scenario.currentLap + 1, scenario.rainForecastLap - 2)})`,
      action: 'BOX IMMEDIATELY FOR INTERMEDIATES',
      impact: 'Avoids catastrophic dry-slick grip loss of +8s to +18s/lap.'
    },
    {
      condition: `Safety Car extended by +2 laps (until Lap ${scenario.currentLap + scenario.safetyCarLapsRemaining + 2})`,
      action: 'REDUCE PUSH LEVEL & EXTEND STINT',
      impact: 'Cools tires, conserves 3.2kg fuel, and closes pit delta gap to leader.'
    },
    {
      condition: `Rival P2 (${scenario.rivals[1]?.name || 'Car #2'}) pits unexpectedly for Dry Slicks`,
      action: 'COMMIT TO OPPOSITE COMPOUND (INTERS)',
      impact: 'Creates asymmetric tire offset for easy on-track pass once rain intensifies.'
    },
    {
      condition: 'Track wetness remains below 15% past Lap 38',
      action: 'EXECUTE PLAN C (DRY MEDIUMS)',
      impact: 'Prevents blistering and graining on intermediate wet tread pattern.'
    }
  ];

  return {
    recommendedStrategyId: recommended.id,
    fallbackStrategyId: fallback.id,
    rankedStrategies,
    modelSummary: {
      scDeltaAdvantageSec: Number((circuit.pitLaneDeltaSec - circuit.scPitLaneDeltaSec).toFixed(1)),
      wetCrossoverLap,
      estimatedFuelDeficit: scenario.fuelRemainingKg < scenario.minFuelBufferKg + ((scenario.totalLaps - scenario.currentLap + 1) * scenario.fuelConsumptionPerLapKg * 0.9),
      weatherShiftRisk: Math.abs(scenario.rainForecastLap - scenario.currentLap) <= 3 ? 'HIGH' : 'MEDIUM'
    },
    keyDecisiveFactor: decisiveFactor,
    triggerMatrix
  };
}
