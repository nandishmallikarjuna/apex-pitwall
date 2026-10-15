import { describe, it, expect } from 'vitest';
import { calculateLapWetness, evaluateScenario, simulateStrategy } from './simulationEngine';
import { SCENARIO_PRESETS } from './presets';
import { CIRCUITS } from './circuitsData';

describe('Apex Pitwall Simulation Engine', () => {
  describe('calculateLapWetness', () => {
    it('returns low wetness before the rain forecast lap', () => {
      const scenario = SCENARIO_PRESETS.championship_decider;
      // Rain forecast is lap 35, current lap is 31
      const wetness31 = calculateLapWetness(scenario, 31);
      const wetness33 = calculateLapWetness(scenario, 33);
      expect(wetness31).toBe(8);
      expect(wetness33).toBeLessThanOrEqual(wetness31);
    });

    it('ramps up track wetness when rain arrives and hits peak', () => {
      const scenario = SCENARIO_PRESETS.championship_decider;
      const wetness35 = calculateLapWetness(scenario, 35);
      const wetness38 = calculateLapWetness(scenario, 38);
      expect(wetness35).toBeGreaterThan(8);
      expect(wetness38).toBe(scenario.rainPeakIntensityPercent);
    });

    it('dries out after rain duration concludes', () => {
      const scenario = {
        ...SCENARIO_PRESETS.championship_decider,
        rainForecastLap: 35,
        rainDurationLaps: 5,
        rainPeakIntensityPercent: 60
      };
      const peakWetness = calculateLapWetness(scenario, 38);
      const postRainWetness = calculateLapWetness(scenario, 44);
      expect(peakWetness).toBe(60);
      expect(postRainWetness).toBeLessThan(peakWetness);
    });
  });

  describe('evaluateScenario', () => {
    it('evaluates all 5 candidate strategies for the default Championship Decider scenario', () => {
      const scenario = SCENARIO_PRESETS.championship_decider;
      const result = evaluateScenario(scenario);

      expect(result.rankedStrategies).toHaveLength(5);
      expect(result.recommendedStrategyId).toBeDefined();
      expect(result.fallbackStrategyId).toBeDefined();
      expect(result.rankedStrategies[0].timeDeltaToBestSec).toBe(0);
      expect(result.modelSummary.scDeltaAdvantageSec).toBeGreaterThan(10);
      expect(result.triggerMatrix.length).toBeGreaterThan(0);
    });

    it('recommends Plan B (Pit NOW for Inters) when rain arrives within 2 laps during SC', () => {
      const scenario = {
        ...SCENARIO_PRESETS.championship_decider,
        rainForecastLap: 32 // Rain arrives immediately during SC
      };
      const result = evaluateScenario(scenario);
      expect(result.recommendedStrategyId).toBe('strat_pit_inters_now');
    });

    it('dynamically adapts when rain is pushed far away (dry race)', () => {
      const scenario = {
        ...SCENARIO_PRESETS.championship_decider,
        rainForecastLap: 99, // No rain
        rainPeakIntensityPercent: 0,
        rainDurationLaps: 0,
        currentTrackWetnessPercent: 0
      };
      const result = evaluateScenario(scenario);
      // With no rain, putting on Inters or Wets should NOT be recommended
      expect(result.recommendedStrategyId).not.toBe('strat_pit_inters_now');
      expect(result.recommendedStrategyId).not.toBe('strat_pit_wet_now');
      // Should favor fresh dry tires or staying out
      expect(['strat_pit_dry_now', 'strat_stay_out']).toContain(result.recommendedStrategyId);
    });

    it('dynamically adapts in a sudden monsoon deluge to heavy wet tires', () => {
      const scenario = SCENARIO_PRESETS.heavy_deluge;
      const result = evaluateScenario(scenario);
      // In sudden heavy deluge with 92% peak rain hitting next lap, wet options dominate
      expect(['strat_pit_inters_now', 'strat_pit_wet_now']).toContain(result.recommendedStrategyId);
      const dryStrat = result.rankedStrategies.find(s => s.id === 'strat_pit_dry_now');
      // Slicks in deluge must have worse total time
      expect(dryStrat?.totalRemainingTimeSec).toBeGreaterThan(result.rankedStrategies[0].totalRemainingTimeSec);
    });

    it('flags infeasibility when fuel reserve is critically low', () => {
      const scenario = {
        ...SCENARIO_PRESETS.low_fuel_reserve,
        fuelRemainingKg: 10.0 // Critically insufficient for 22 laps
      };
      const result = evaluateScenario(scenario);
      expect(result.rankedStrategies.some(s => s.feasibility === 'INFEASIBLE')).toBe(true);
    });

    it('correctly uses circuit specific SC and pit lane deltas', () => {
      const singaporeScenario = {
        ...SCENARIO_PRESETS.championship_decider,
        circuitId: 'singapore'
      };
      const bakuScenario = {
        ...SCENARIO_PRESETS.championship_decider,
        circuitId: 'baku'
      };

      const singaporeResult = evaluateScenario(singaporeScenario);
      const bakuResult = evaluateScenario(bakuScenario);

      expect(singaporeResult.modelSummary.scDeltaAdvantageSec).toBe(
        Number((CIRCUITS.singapore.pitLaneDeltaSec - CIRCUITS.singapore.scPitLaneDeltaSec).toFixed(1))
      );
      expect(bakuResult.modelSummary.scDeltaAdvantageSec).toBe(
        Number((CIRCUITS.baku.pitLaneDeltaSec - CIRCUITS.baku.scPitLaneDeltaSec).toFixed(1))
      );
    });
  });
});
