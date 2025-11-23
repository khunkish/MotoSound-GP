export enum EngineType {
  INLINE_4 = 'INLINE_4', // Smooth, high pitch (Sport bike)
  V_TWIN = 'V_TWIN',     // Rumble, low pitch (Cruiser/Ducati style)
  SINGLE = 'SINGLE',     // Thumpy (Dirt bike/Motard)
}

export enum ExhaustType {
  STOCK = 'STOCK',         // Quiet, muffled
  SLIP_ON = 'SLIP_ON',     // Louder, clearer
  FULL_RACE = 'FULL_RACE', // Very loud, raw
  SC_PROJECT = 'SC_PROJECT', // Screamer, high pitch
  TITANIUM = 'TITANIUM',   // Metallic resonance
  SHORT_PIPE = 'SHORT_PIPE' // Extremely loud, raw noise
}

export interface BikeConfig {
  id: string;
  name: string;
  engineType: EngineType;
  baseFreq: number; // Hz at idle
  maxFreq: number;  // Hz at redline
  roughness: number; // For jitter/texture
  description: string;
  gearRatios: number[]; // Max speed per gear [Neutral, 1, 2, 3, 4, 5, 6]
}

export interface AppState {
  isEngineOn: boolean;
  speed: number; // km/h
  rpm: number; // 0 - 10000+
  gear: number; // 0 = N, 1-6
  isSimulationMode: boolean;
  selectedBikeId: string;
  selectedExhaust: ExhaustType;
}