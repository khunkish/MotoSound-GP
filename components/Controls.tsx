import React from 'react';
import { Power, Settings, Navigation, ChevronUp, ChevronDown, PlayCircle, Zap } from 'lucide-react';

interface ControlsProps {
  isEngineOn: boolean;
  onToggleEngine: () => void;
  isSimulationMode: boolean;
  onToggleSimulation: () => void;
  onThrottleChange: (val: number) => void;
  throttleValue: number;
  onOpenSettings: () => void;
  // Gear props
  gear: number;
  onShiftUp: () => void;
  onShiftDown: () => void;
  isManualGear: boolean;
  onToggleManualGear: () => void;
  // Virtual Trip
  onVirtualTrip: () => void;
  isVirtualTripRunning: boolean;
}

const Controls: React.FC<ControlsProps> = ({
  isEngineOn,
  onToggleEngine,
  isSimulationMode,
  onToggleSimulation,
  onThrottleChange,
  throttleValue,
  onOpenSettings,
  gear,
  onShiftUp,
  onShiftDown,
  isManualGear,
  onToggleManualGear,
  onVirtualTrip,
  isVirtualTripRunning
}) => {
  return (
    <div className="w-full max-w-md px-6 flex flex-col gap-6">
      
      {/* Simulation Slider (Only visible if enabled) */}
      <div className={`transition-all duration-500 overflow-hidden ${isSimulationMode ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
        
        {/* Virtual Ride Button */}
        <button 
          onClick={onVirtualTrip}
          disabled={!isEngineOn}
          className={`w-full mb-4 py-2 rounded-lg flex items-center justify-center gap-2 text-sm font-bold uppercase tracking-wider transition-all ${
            isVirtualTripRunning 
            ? 'bg-orange-500 text-white animate-pulse' 
            : 'bg-slate-800 text-emerald-400 border border-emerald-500/30 hover:bg-slate-700'
          } ${!isEngineOn ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <PlayCircle size={18} />
          {isVirtualTripRunning ? 'Simulating Trip...' : 'Test Ride (Auto)'}
        </button>

        <div className="flex justify-between mb-2">
          <span className="text-xs uppercase tracking-widest text-slate-400">Manual Throttle</span>
          <span className="text-xs text-emerald-400 font-mono">{(throttleValue * 300).toFixed(0)} km/h</span>
        </div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={throttleValue}
          onChange={(e) => onThrottleChange(parseFloat(e.target.value))}
          className="w-full h-8 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 active:accent-emerald-400 touch-none"
        />
      </div>

      {/* Gearbox Controls (Only if Manual Gear is ON) */}
      <div className={`transition-all duration-300 ${isManualGear ? 'opacity-100' : 'opacity-50 grayscale'}`}>
        <div className="flex items-center justify-between gap-4 bg-slate-900/50 p-2 rounded-xl border border-slate-800">
          <div className="flex items-center gap-2" onClick={onToggleManualGear}>
             <div className={`w-4 h-4 rounded-full ${isManualGear ? 'bg-emerald-500' : 'bg-slate-600'}`}></div>
             <span className="text-xs font-bold text-slate-400 uppercase">Manual Gear</span>
          </div>
          
          <div className="flex gap-2">
             <button 
               onClick={onShiftDown}
               disabled={!isManualGear || gear === 0}
               className="p-3 bg-slate-800 rounded-lg active:bg-slate-700 disabled:opacity-30 border border-slate-700"
             >
               <ChevronDown size={20} />
             </button>
             <button 
               onClick={onShiftUp}
               disabled={!isManualGear || gear === 6}
               className="p-3 bg-slate-800 rounded-lg active:bg-slate-700 disabled:opacity-30 border border-slate-700"
             >
               <ChevronUp size={20} />
             </button>
          </div>
        </div>
      </div>

      {/* Main Buttons Grid */}
      <div className="grid grid-cols-3 gap-4">
        
        {/* Mode Toggle */}
        <button
          onClick={onToggleSimulation}
          className={`flex flex-col items-center justify-center py-4 rounded-xl border border-slate-700 transition-all ${
            isSimulationMode ? 'bg-blue-900/40 text-blue-400 border-blue-500' : 'bg-slate-800/50 text-slate-500'
          }`}
        >
          <Navigation size={24} className={isSimulationMode ? 'opacity-50' : ''} />
          <span className="text-[10px] mt-2 font-bold uppercase">{isSimulationMode ? 'MANUAL' : 'GPS MODE'}</span>
        </button>

        {/* Start/Stop Engine */}
        <button
          onClick={onToggleEngine}
          className={`flex flex-col items-center justify-center py-4 rounded-xl border-2 shadow-lg transition-all transform active:scale-95 ${
            isEngineOn 
              ? 'bg-red-500/20 border-red-500 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.3)]' 
              : 'bg-emerald-500 text-black border-emerald-400 hover:bg-emerald-400'
          }`}
        >
          <Power size={32} />
          <span className="text-[10px] mt-2 font-black uppercase tracking-wider">{isEngineOn ? 'STOP' : 'START'}</span>
        </button>

        {/* Settings */}
        <button
          onClick={onOpenSettings}
          className="flex flex-col items-center justify-center py-4 rounded-xl bg-slate-800/50 border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
        >
          <Settings size={24} />
          <span className="text-[10px] mt-2 font-bold uppercase">TUNING</span>
        </button>
      </div>

      {!isSimulationMode && (
         <div className="text-center">
            <p className="text-xs text-slate-500 animate-pulse">
               {isEngineOn ? "Listening for GPS movement..." : "Start engine to begin"}
            </p>
         </div>
      )}
    </div>
  );
};

export default Controls;