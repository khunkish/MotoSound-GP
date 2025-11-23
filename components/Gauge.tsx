import React from 'react';

interface GaugeProps {
  speed: number;
  rpm: number;
  gear: number;
  maxRpm?: number;
  redline?: boolean;
}

const Gauge: React.FC<GaugeProps> = ({ speed, rpm, gear, maxRpm = 14000, redline = false }) => {
  const rpmPercentage = Math.min((rpm / maxRpm) * 100, 100);
  
  // Calculate SVG arc
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  // Use 75% of the circle for the gauge
  const offset = circumference - (rpmPercentage / 100) * (circumference * 0.75);

  const getBarColor = () => {
    if (redline) return '#ef4444'; // Hard Red for limiter
    if (rpmPercentage > 85) return '#ef4444'; // Red
    if (rpmPercentage > 60) return '#f59e0b'; // Orange
    return '#10b981'; // Green
  };

  return (
    <div className="relative w-72 h-72 flex items-center justify-center">
      {/* RPM Circle Back */}
      <svg className="absolute w-full h-full transform rotate-[135deg]">
        <circle
          cx="50%"
          cy="50%"
          r={radius}
          stroke="#1e293b"
          strokeWidth="20"
          fill="transparent"
          strokeDasharray={circumference * 0.75 + " " + circumference}
          strokeLinecap="round"
        />
      </svg>
      
      {/* RPM Active Bar */}
      <svg className="absolute w-full h-full transform rotate-[135deg] transition-all duration-100 ease-out">
        <circle
          cx="50%"
          cy="50%"
          r={radius}
          stroke={getBarColor()}
          strokeWidth="20"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.05s linear, stroke 0.2s ease' }}
        />
      </svg>

      {/* Inner Info */}
      <div className="relative z-10 text-center flex flex-col items-center">
        
        {/* Gear Indicator */}
        <div className="absolute -top-12 bg-slate-800/80 border border-slate-700 px-3 py-1 rounded-lg shadow-lg backdrop-blur-md">
          <span className={`text-3xl font-black font-digital ${gear === 0 ? 'text-emerald-400' : 'text-white'}`}>
            {gear === 0 ? 'N' : gear}
          </span>
        </div>

        <span className="text-6xl font-digital font-black tracking-tighter text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)] mt-2">
          {Math.floor(speed)}
        </span>
        <span className="text-xl text-slate-400 font-bold tracking-widest mt-[-5px]">KM/H</span>
        
        <div className="mt-4 flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${redline ? 'bg-red-600' : (rpm > 1000 ? 'bg-green-500 animate-pulse' : 'bg-slate-700')}`}></div>
          <span className={`text-lg font-mono ${redline ? 'text-red-500 font-bold' : 'text-slate-300'}`}>
            {Math.floor(rpm).toString().padStart(5, '0')} <span className="text-xs text-slate-500">RPM</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default Gauge;