import React, { useState, useEffect, useRef, useCallback } from 'react';
import { audioEngine } from './services/audioEngine';
import { BIKES } from './constants';
import { ExhaustType } from './types';
import Gauge from './components/Gauge';
import Controls from './components/Controls';
import Garage from './components/Garage';

const App: React.FC = () => {
  // --- State ---
  const [isEngineOn, setIsEngineOn] = useState(false);
  const [speed, setSpeed] = useState(0); // km/h
  const [rpm, setRpm] = useState(1000); // Idle RPM
  const [gear, setGear] = useState(0); // 0=Neutral, 1-6
  const [isManualGear, setIsManualGear] = useState(false);
  
  // Simulation States
  const [isSimulationMode, setIsSimulationMode] = useState(true);
  const [throttleSim, setThrottleSim] = useState(0); // 0 to 1
  const [isVirtualTripRunning, setIsVirtualTripRunning] = useState(false);
  
  // Settings
  const [selectedBikeId, setSelectedBikeId] = useState(BIKES[0].id);
  const [selectedExhaust, setSelectedExhaust] = useState<ExhaustType>(ExhaustType.STOCK);
  const [isGarageOpen, setIsGarageOpen] = useState(false);
  const [isRedline, setIsRedline] = useState(false);

  // --- Refs ---
  const watchIdRef = useRef<number | null>(null);
  const animationRef = useRef<number | null>(null);
  const tripIntervalRef = useRef<number | null>(null);
  const prevThrottleRef = useRef<number>(0);
  const prevGearRef = useRef<number>(0);
  const prevSpeedRef = useRef<number>(0); // For calculating real acceleration/load

  const currentBike = BIKES.find(b => b.id === selectedBikeId) || BIKES[0];

  // --- Sound FX: Gear Shift ---
  useEffect(() => {
    if (isEngineOn && gear !== prevGearRef.current) {
      if (gear !== 0 && prevGearRef.current !== 0) {
        audioEngine.triggerShiftSound();
      } else if (gear === 1 && prevGearRef.current === 0) {
         audioEngine.triggerShiftSound();
      }
      prevGearRef.current = gear;
    }
  }, [gear, isEngineOn]);

  // --- Logic: Gear & RPM Calculation ---
  const calculateRpm = useCallback((currentSpeed: number, currentGear: number) => {
    const idleRpm = 1000 + (Math.random() * 50); 
    const redlineRpm = 14000;

    if (currentGear === 0) {
      if (isSimulationMode) {
         return idleRpm + (throttleSim * 10000);
      }
      return idleRpm; 
    }

    const maxSpeedForGear = currentBike.gearRatios[currentGear];
    let calculatedRpm = (currentSpeed / maxSpeedForGear) * redlineRpm;
    calculatedRpm = Math.max(idleRpm, calculatedRpm);

    if (calculatedRpm > redlineRpm) {
      if (Math.random() > 0.5) return redlineRpm - 500;
      return redlineRpm;
    }
    
    // Add grit
    return calculatedRpm + (Math.random() * currentBike.roughness * 20);
  }, [currentBike, throttleSim, isSimulationMode]);


  // --- Logic: Audio Loop & Physics ---
  useEffect(() => {
    const loop = () => {
      let currentSpeed = speed;

      // 1. Determine LOAD (0 to 1)
      // Load affects the "grunt" and intake noise. 
      // In Sim mode, it's just throttle. In GPS mode, it's acceleration.
      let currentLoad = 0;

      if (isSimulationMode) {
        // Physics: Speed tries to catch up to Throttle Target
        const maxSpeedPossible = isManualGear && gear > 0 
          ? currentBike.gearRatios[gear] 
          : 299; 
        
        const targetSpeed = throttleSim * maxSpeedPossible;
        const accel = 0.5; // Acceleration Rate
        const decel = 0.8; // Engine Braking Rate

        if (currentSpeed < targetSpeed) {
          currentSpeed += accel;
        } else if (currentSpeed > targetSpeed) {
          currentSpeed -= decel;
        }
        currentSpeed = Math.max(0, currentSpeed);
        setSpeed(currentSpeed);
        
        currentLoad = throttleSim;

      } else {
         // GPS Mode: Calculate Load from Acceleration
         // If speed is increasing -> High Load.
         // If speed is constant -> Low Load (Cruising).
         // If speed is decreasing -> Zero Load.
         const deltaSpeed = currentSpeed - prevSpeedRef.current;
         if (deltaSpeed > 0.1) currentLoad = Math.min(1, deltaSpeed * 2); // Accelerating
         else if (deltaSpeed < -0.1) currentLoad = 0; // Decelerating
         else currentLoad = 0.1; // Cruising maintains slight load
         
         prevSpeedRef.current = currentSpeed;
      }

      // Backfire Logic (Pops & Bangs)
      if (isEngineOn) {
        // Trigger backfire if load drops suddenly at high RPM
        // For Sim: throttleDrop. For GPS: negative acceleration (decel)
        let isDecelerating = false;
        
        if (isSimulationMode) {
            if (prevThrottleRef.current - throttleSim > 0.1) isDecelerating = true;
        } else {
            // In GPS mode, if we were going fast and now stopped accelerating
            if (rpm > 5000 && currentLoad === 0) isDecelerating = true; 
        }

        if (isDecelerating && rpm > 5000) {
           let chance = 0.02; // 2% chance per frame
           if (selectedExhaust === ExhaustType.SC_PROJECT) chance = 0.08;
           if (selectedExhaust === ExhaustType.SHORT_PIPE) chance = 0.1;
           
           if (Math.random() < chance) {
             audioEngine.triggerBackfire();
           }
        }
        prevThrottleRef.current = throttleSim;
      }

      // Auto Shift Logic
      if (!isManualGear && isEngineOn && isSimulationMode) {
        if (gear < 6 && rpm > 11000) setGear(g => g + 1);
        else if (gear > 1 && rpm < 4000 && currentSpeed > 10) setGear(g => g - 1);
        else if (gear === 0 && throttleSim > 0.1) setGear(1);
        else if (currentSpeed < 2 && throttleSim === 0) setGear(0);
      }

      const newRpm = calculateRpm(currentSpeed, gear);
      setRpm(newRpm);
      setIsRedline(newRpm >= 13500);

      if (isEngineOn) {
        audioEngine.updateSound(newRpm, currentLoad, currentBike.engineType, currentBike.baseFreq, selectedExhaust);
      }

      animationRef.current = requestAnimationFrame(loop);
    };

    animationRef.current = requestAnimationFrame(loop);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isEngineOn, isSimulationMode, throttleSim, speed, currentBike, selectedExhaust, calculateRpm, gear, isManualGear, rpm]);


  // --- Logic: Virtual Trip ---
  const startVirtualTrip = () => {
    if (!isEngineOn) return;
    setIsVirtualTripRunning(true);
    setIsManualGear(false);
    setThrottleSim(0);
    setGear(1);

    const sequence = [
      { t: 0, val: 0.5 },   
      { t: 3000, val: 0.8 }, 
      { t: 8000, val: 0.0 }, // Decel -> Pops likely here
      { t: 10000, val: 1.0 }, 
      { t: 16000, val: 0 }    
    ];

    let step = 0;
    const interval = setInterval(() => {
       if (step >= sequence.length) {
         clearInterval(interval);
         setIsVirtualTripRunning(false);
         setThrottleSim(0);
         return;
       }
       setThrottleSim(sequence[step].val);
       step++;
    }, 2000);
    
    tripIntervalRef.current = interval as any;
  };

  const stopVirtualTrip = () => {
    if (tripIntervalRef.current) clearInterval(tripIntervalRef.current);
    setIsVirtualTripRunning(false);
    setThrottleSim(0);
  };


  // --- Logic: GPS ---
  useEffect(() => {
    if (!isSimulationMode && isEngineOn) {
      if ('geolocation' in navigator) {
        watchIdRef.current = navigator.geolocation.watchPosition(
          (position) => {
            const speedKmh = (position.coords.speed || 0) * 3.6;
            setSpeed(Math.max(0, speedKmh));
            
            const idealGear = currentBike.gearRatios.findIndex(max => speedKmh < max);
            if (idealGear !== -1) setGear(Math.max(1, idealGear));
            else setGear(6);
          },
          (error) => console.error('GPS Error:', error),
          { enableHighAccuracy: true, maximumAge: 0, timeout: 1000 }
        );
      }
    } else {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (!isSimulationMode) setSpeed(0);
    }
    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, [isSimulationMode, isEngineOn, currentBike.gearRatios]);


  // --- Handlers ---
  const handleToggleEngine = async () => {
    if (isEngineOn) {
      audioEngine.stopEngine();
      setIsEngineOn(false);
      setSpeed(0);
      setThrottleSim(0);
      setGear(0);
      stopVirtualTrip();
    } else {
      await audioEngine.init();
      audioEngine.startEngine(currentBike.engineType);
      setIsEngineOn(true);
      setGear(0);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-between py-4 relative overflow-hidden">
      
      {/* Moving Road Visual */}
      <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden opacity-20">
         <div 
            className="absolute left-0 -bottom-1/2 w-full h-full bg-[linear-gradient(0deg,transparent_48%,#10b981_49%,#10b981_51%,transparent_52%)]"
            style={{ 
               backgroundSize: '100% 100px',
               transform: 'perspective(500px) rotateX(60deg)',
               transformOrigin: 'bottom',
               animation: speed > 1 ? `roadMove ${Math.max(0.1, 200/speed)}s linear infinite` : 'none'
            }}
         ></div>
         <style>{`
            @keyframes roadMove {
               from { background-position: 0 0; }
               to { background-position: 0 100px; }
            }
         `}</style>
      </div>

      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-slate-900 to-transparent pointer-events-none"></div>

      {/* Top Header */}
      <header className="z-10 flex flex-col items-center mt-4">
        <h1 className="text-3xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
          MOTO<span className="text-emerald-500">GP</span> SOUND
        </h1>
        <div className="flex items-center gap-2 mt-1">
           <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400 border border-slate-700 uppercase tracking-wider">
              {currentBike.name}
           </span>
        </div>
      </header>

      {/* Main Gauge */}
      <main className="z-10 flex-1 flex flex-col items-center justify-center scale-90 sm:scale-100">
        <Gauge speed={speed} rpm={rpm} gear={gear} redline={isRedline} />
      </main>

      {/* Controls */}
      <footer className="z-10 w-full flex justify-center pb-6">
        <Controls 
          isEngineOn={isEngineOn}
          onToggleEngine={handleToggleEngine}
          isSimulationMode={isSimulationMode}
          onToggleSimulation={() => {
              setIsSimulationMode(!isSimulationMode);
              setSpeed(0);
              setThrottleSim(0);
              stopVirtualTrip();
          }}
          throttleValue={throttleSim}
          onThrottleChange={(val) => {
            setThrottleSim(val);
            if(isVirtualTripRunning) stopVirtualTrip(); 
          }}
          onOpenSettings={() => setIsGarageOpen(true)}
          
          gear={gear}
          isManualGear={isManualGear}
          onToggleManualGear={() => setIsManualGear(!isManualGear)}
          onShiftUp={() => setGear(g => Math.min(6, g + 1))}
          onShiftDown={() => setGear(g => Math.max(0, g - 1))}
          
          onVirtualTrip={startVirtualTrip}
          isVirtualTripRunning={isVirtualTripRunning}
        />
      </footer>

      {/* Garage Modal */}
      <Garage 
        isOpen={isGarageOpen}
        onClose={() => setIsGarageOpen(false)}
        selectedBikeId={selectedBikeId}
        onSelectBike={(id) => {
           setSelectedBikeId(id);
           if (isEngineOn) {
              const bike = BIKES.find(b => b.id === id);
              if (bike) audioEngine.startEngine(bike.engineType);
           }
        }}
        selectedExhaust={selectedExhaust}
        onSelectExhaust={(t) => setSelectedExhaust(t)}
      />

    </div>
  );
};

export default App;