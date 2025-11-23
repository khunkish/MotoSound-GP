import { BikeConfig, EngineType } from './types';

export const BIKES: BikeConfig[] = [
  {
    id: 's1000',
    name: 'Super Sport RR (1000cc)',
    engineType: EngineType.INLINE_4,
    baseFreq: 120,
    maxFreq: 800,
    roughness: 0.1,
    description: 'เสียงหวานๆ รอบจัด สไตล์รถสนาม',
    // 0=N, 1=120kmh, 2=160... 6=299
    gearRatios: [0, 110, 150, 190, 230, 260, 320] 
  },
  {
    id: 'diavel',
    name: 'Power Cruiser (1260cc)',
    engineType: EngineType.V_TWIN,
    baseFreq: 60,
    maxFreq: 400,
    roughness: 0.8,
    description: 'ดุดัน ทอร์คหนัก เสียงลูกโต',
    gearRatios: [0, 90, 130, 170, 210, 240, 280]
  },
  {
    id: 'crf',
    name: 'Dirt Track (300cc)',
    engineType: EngineType.SINGLE,
    baseFreq: 50,
    maxFreq: 300,
    roughness: 0.9,
    description: 'สูบเดียว แน่นๆ ตั๊บๆๆ',
    gearRatios: [0, 50, 80, 105, 125, 140, 160]
  }
];