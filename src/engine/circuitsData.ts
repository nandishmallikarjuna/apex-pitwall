import { CircuitInfo } from '../types/strategy';

export const CIRCUITS: Record<string, CircuitInfo> = {
  baku: {
    id: 'baku',
    name: 'Baku City Circuit',
    location: 'Azerbaijan',
    lengthKm: 6.003,
    totalLaps: 53,
    baseLapTimeSec: 103.2,
    pitLaneDeltaSec: 21.0,
    scPitLaneDeltaSec: 11.2,
    overtakingDifficulty: 'MEDIUM',
    turnsCount: 20,
    drsZones: 2,
    schematicNotice: 'Schematic approximation of Baku 6.003km street layout (Old City castle section & Neftchilar Avenue straight).',
    trackPath2D: [
      [100, 480], [250, 480], [450, 480], [750, 480], [860, 480], // Main straight to T1
      [880, 450], [880, 390], // T1-T2 90-degree left
      [840, 370], [700, 370], // T2 short burst
      [680, 330], [680, 270], // T3 left
      [720, 250], [820, 250], // T4 right
      [840, 220], [840, 160], // T5-T6 chicane
      [800, 140], [680, 140], // Approach to Castle
      [640, 120], [610, 110], [580, 120], [560, 150], // T8-T11 Castle section (narrow!)
      [520, 180], [450, 220], [380, 240], // T12-T14 downhill
      [320, 270], [250, 310], // T15 downhill braking
      [220, 350], [180, 410], // T16 left onto high-speed kinks
      [140, 440], [110, 465], [100, 480]  // T18-T20 flat out back to line
    ]
  },
  madrid: {
    id: 'madrid',
    name: 'Madring (IFEMA)',
    location: 'Madrid, Spain',
    lengthKm: 5.474,
    totalLaps: 53,
    baseLapTimeSec: 91.5,
    pitLaneDeltaSec: 22.0,
    scPitLaneDeltaSec: 11.8,
    overtakingDifficulty: 'MEDIUM',
    turnsCount: 20,
    drsZones: 3,
    schematicNotice: 'Schematic concept based on official IFEMA Valdebebas hybrid circuit proposal (steep banked turn & M-40 tunnel).',
    trackPath2D: [
      [150, 460], [350, 460], [550, 460], // Pit straight
      [620, 440], [680, 400], [710, 340], // T1-T3 sweeping right
      [700, 280], [650, 240], // T4 switchback
      [660, 180], [720, 140], [820, 140], // T5-T7 Valdebebas fast sector
      [880, 180], [890, 250], [870, 320], // The Great Banked Turn (Curva Monumental)
      [820, 360], [740, 380], // Banked exit
      [630, 370], [520, 350], // M-40 underground tunnel section
      [420, 320], [350, 270], [280, 220], // IFEMA Pavilion chicane T13-T15
      [220, 190], [160, 220], [140, 290], // T16-T18 technical complex
      [130, 370], [140, 430], [150, 460]  // Final curve back to grid
    ]
  },
  monaco: {
    id: 'monaco',
    name: 'Circuit de Monaco',
    location: 'Monte Carlo, Monaco',
    lengthKm: 3.337,
    totalLaps: 53, // Scaled scenario distance
    baseLapTimeSec: 74.2,
    pitLaneDeltaSec: 23.5,
    scPitLaneDeltaSec: 12.2,
    overtakingDifficulty: 'EXTREME',
    turnsCount: 19,
    drsZones: 1,
    schematicNotice: 'Schematic recreation of the historic Monte Carlo harbor circuit (Sainte-Dévote, Casino, Hairpin, Tunnel, Swimming Pool, Rascasse).',
    trackPath2D: [
      [400, 490], [540, 490], // Boulevard Albert 1er (pit straight)
      [600, 460], [610, 410], // T1 Sainte-Dévote
      [580, 330], [540, 260], // Beau Rivage uphill
      [510, 220], [480, 200], // Massenet
      [430, 190], [390, 210], // Casino Square
      [360, 250], [350, 280], // Mirabeau Haute
      [320, 290], [300, 320], [330, 330], // Fairmont Hairpin (T6 - slowest turn in F1)
      [360, 340], [380, 360], // Mirabeau Bas & Portier (T7-T8)
      [440, 380], [550, 400], [670, 410], // The Tunnel (T9 high speed right)
      [690, 430], [670, 440], // Nouvelle Chicane (T10-T11)
      [630, 430], [580, 430], // Tabac (T12)
      [530, 410], [480, 420], [450, 440], // Louis Chiron & Piscine Swimming Pool complex
      [420, 460], [380, 470], // La Rascasse (T18)
      [370, 490], [400, 490]  // Anthony Noghès (T19) & start/finish
    ]
  },
  singapore: {
    id: 'singapore',
    name: 'Marina Bay Street Circuit',
    location: 'Singapore',
    lengthKm: 4.940,
    totalLaps: 53,
    baseLapTimeSec: 95.8,
    pitLaneDeltaSec: 29.5, // Exceptionally long pit lane
    scPitLaneDeltaSec: 15.2,
    overtakingDifficulty: 'HIGH',
    turnsCount: 19,
    drsZones: 3,
    schematicNotice: 'Schematic recreation of Marina Bay street circuit (Sheares, Republic Blvd, Padang straight, Anderson Bridge, Bay chicane).',
    trackPath2D: [
      [220, 470], [380, 470], [520, 470], // Pit straight
      [570, 450], [580, 400], [540, 370], // T1-T3 Sheares complex
      [500, 340], [420, 310], [330, 280], // Republic Boulevard straight (T4-T5)
      [270, 250], [220, 220], // Turn 6-7 high speed kink to Nicoll Highway
      [200, 170], [240, 140], [320, 140], // Turn 8-9 Padang
      [440, 150], [560, 160], // St Andrew’s Road straight
      [640, 180], [660, 230], // T10-T11 Fullerton hotel hairpin
      [630, 270], [580, 290], // Anderson Bridge (T12-T13)
      [530, 330], [600, 360], // Esplanade drive
      [680, 380], [740, 400], // Bay straight (modified layout avoiding old floating grandstand)
      [760, 440], [720, 460], // Final chicane T16-T17
      [650, 470], [450, 470], [220, 470]  // T18-T19 onto pit straight
    ]
  }
};
