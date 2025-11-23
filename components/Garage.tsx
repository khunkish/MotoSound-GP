import React from 'react';
import { X, Check } from 'lucide-react';
import { BIKES } from '../constants';
import { ExhaustType } from '../types';

interface GarageProps {
  isOpen: boolean;
  onClose: () => void;
  selectedBikeId: string;
  onSelectBike: (id: string) => void;
  selectedExhaust: ExhaustType;
  onSelectExhaust: (type: ExhaustType) => void;
}

const Garage: React.FC<GarageProps> = ({
  isOpen,
  onClose,
  selectedBikeId,
  onSelectBike,
  selectedExhaust,
  onSelectExhaust
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex flex-col h-full animate-in fade-in slide-in-from-bottom-10 duration-200">
      
      {/* Header */}
      <div className="p-6 flex justify-between items-center border-b border-slate-800">
        <h2 className="text-2xl font-bold font-digital tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
          GARAGE
        </h2>
        <button onClick={onClose} className="p-2 bg-slate-800 rounded-full text-white hover:bg-slate-700">
          <X size={24} />
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-20">
        
        {/* Bike Selection */}
        <section>
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Select Motorcycle</h3>
          <div className="space-y-3">
            {BIKES.map((bike) => (
              <div
                key={bike.id}
                onClick={() => onSelectBike(bike.id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex justify-between items-center ${
                  selectedBikeId === bike.id
                    ? 'bg-slate-800 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-600'
                }`}
              >
                <div>
                  <div className="font-bold text-lg text-white">{bike.name}</div>
                  <div className="text-sm text-slate-400">{bike.description}</div>
                </div>
                {selectedBikeId === bike.id && <Check className="text-emerald-500" />}
              </div>
            ))}
          </div>
        </section>

        {/* Exhaust Selection */}
        <section>
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Exhaust System</h3>
          <div className="grid grid-cols-1 gap-3">
            {(Object.keys(ExhaustType) as Array<keyof typeof ExhaustType>).map((key) => {
              const type = ExhaustType[key];
              let label = '';
              let desc = '';
              let colorClass = 'text-white';

              switch(type) {
                  case ExhaustType.STOCK: 
                    label = 'Stock Original'; 
                    desc='เงียบ นุ่ม ผู้ดี (Standard)'; 
                    break;
                  case ExhaustType.SLIP_ON: 
                    label = 'Slip-On Street'; 
                    desc='ทุ้มขึ้น มีสไตล์ (Legal)'; 
                    break;
                  case ExhaustType.FULL_RACE: 
                    label = 'Full System Racing'; 
                    desc='ดัง ลั่นทุ่ง มาเต็ม (Racing)'; 
                    break;
                  case ExhaustType.SC_PROJECT: 
                    label = 'SC-Project Style'; 
                    desc='ลั่นๆ แสบหู แหลม (CRT)'; 
                    colorClass = 'text-yellow-400';
                    break;
                  case ExhaustType.TITANIUM: 
                    label = 'Titanium Grade'; 
                    desc='เสียงใส กังวานหวาน (Premium)'; 
                    colorClass = 'text-cyan-400';
                    break;
                  case ExhaustType.SHORT_PIPE: 
                    label = 'Shorty Pipe'; 
                    desc='ท่อกระป๋อง ยิงสด (Raw)'; 
                    colorClass = 'text-red-400';
                    break;
              }

              return (
                <button
                  key={type}
                  onClick={() => onSelectExhaust(type)}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    selectedExhaust === type
                      ? 'bg-slate-800 border-orange-500'
                      : 'bg-slate-900 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex justify-between items-center w-full">
                    <span className={`font-bold ${selectedExhaust === type ? colorClass : 'text-slate-200'}`}>{label}</span>
                    {selectedExhaust === type && <Check className="text-orange-500" size={18} />}
                  </div>
                  <span className="text-xs opacity-60 text-slate-400">{desc}</span>
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Garage;