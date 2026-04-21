import { useState, useEffect } from 'react';
import { Zap } from 'lucide-react';

function getTimeLeft(targetHours: number) {
  const now = new Date();
  const end = new Date();
  end.setHours(targetHours, 0, 0, 0);
  if (now >= end) end.setDate(end.getDate() + 1);
  const diff = end.getTime() - now.getTime();
  return {
    hours: Math.floor(diff / (1000 * 60 * 60)),
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((diff % (1000 * 60)) / 1000),
  };
}

export function CountdownTimer() {
  const [time, setTime] = useState(() => getTimeLeft(23));

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(getTimeLeft(23));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <div className="bg-gradient-to-r from-destructive to-orange-600 text-white rounded-2xl p-5 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
          <Zap size={20} className="text-white" />
        </div>
        <div>
          <p className="font-black text-lg leading-none uppercase tracking-wide">Flash Sale Ends In</p>
          <p className="text-white/70 text-xs mt-1">Prices go back up after timer ends</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {[
          { label: 'HRS', value: pad(time.hours) },
          { label: 'MIN', value: pad(time.minutes) },
          { label: 'SEC', value: pad(time.seconds) },
        ].map((unit, i) => (
          <div key={unit.label} className="flex items-center gap-2">
            <div className="flex flex-col items-center">
              <div className="bg-white/20 backdrop-blur rounded-lg w-14 h-14 flex items-center justify-center">
                <span className="text-2xl font-black tabular-nums">{unit.value}</span>
              </div>
              <span className="text-[9px] font-bold uppercase tracking-widest mt-1 text-white/70">{unit.label}</span>
            </div>
            {i < 2 && <span className="text-2xl font-black mb-4 text-white/60">:</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
