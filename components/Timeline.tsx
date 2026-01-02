
import React, { useRef, useState, useEffect } from 'react';
import { TimelineItem } from '../types';
import { Film, Clock, ZoomIn, ZoomOut } from 'lucide-react';

interface TimelineProps {
  items: TimelineItem[];
  onSelectItem: (item: TimelineItem) => void;
  selectedItemId?: string;
}

export const Timeline: React.FC<TimelineProps> = ({ items, onSelectItem, selectedItemId }) => {
  const [zoom, setZoom] = useState(20);
  const containerRef = useRef<HTMLDivElement>(null);
  const [totalDuration, setTotalDuration] = useState(0);
  const [hoveredItem, setHoveredItem] = useState<TimelineItem | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (items.length > 0) {
      const lastItem = items[items.length - 1];
      setTotalDuration(lastItem.start + lastItem.duration);
    }
  }, [items]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const rulerMarkers = [];
  const markerInterval = zoom < 10 ? 30 : zoom < 40 ? 10 : 1; 
  for (let i = 0; i <= totalDuration + 60; i += markerInterval) {
    const isMinute = i % 60 === 0 && i !== 0;
    const isMajor = i % 10 === 0;
    rulerMarkers.push(
      <div key={i} className="absolute bottom-0 flex flex-col items-start justify-end pb-1" style={{ left: i * zoom, height: '100%' }}>
        <div className={`w-px ${isMinute ? 'bg-orange-500 h-full opacity-40' : isMajor ? 'bg-zinc-700 h-3' : 'bg-zinc-800 h-1.5'}`}></div>
        {(isMajor || isMinute) && (
            <span className={`ml-1 select-none font-mono leading-none ${isMinute ? 'text-orange-500 text-[10px] font-bold' : 'text-[9px] text-zinc-600'}`}>
            {formatTime(i)}
            </span>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-zinc-950 border-t border-zinc-900 relative w-full">
      {hoveredItem && (
          <div className="fixed z-[100] bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl p-3 pointer-events-none w-64 backdrop-blur-md bg-opacity-95" style={{ top: tooltipPos.y, left: tooltipPos.x }}>
              <div className="text-[10px] font-bold text-orange-500 uppercase mb-1">{hoveredItem.sceneHeader}</div>
              <div className="flex items-center text-xs font-bold text-zinc-100 space-x-2 mb-2">
                  <span className="bg-zinc-800 border border-zinc-700 px-1.5 py-0.5 rounded uppercase text-[10px]">{hoveredItem.data.type}</span>
                  <span className="font-mono text-zinc-400">{hoveredItem.duration}s</span>
              </div>
              <div className="text-[11px] text-zinc-400 leading-normal line-clamp-2 italic">"{hoveredItem.data.description_vi}"</div>
          </div>
      )}

      <div className="h-9 bg-zinc-900 flex items-center px-4 justify-between border-b border-black shrink-0">
        <div className="flex items-center space-x-2 text-zinc-500">
            <Clock size={12} className="text-orange-500" />
            <span className="text-[10px] font-mono tracking-tighter uppercase">{formatTime(totalDuration)} Total</span>
        </div>
        <div className="flex items-center space-x-3">
            <button onClick={() => setZoom(prev => Math.max(prev / 1.5, 5))} className="p-1 hover:bg-zinc-800 rounded text-zinc-500"><ZoomOut size={14} /></button>
            <span className="text-[10px] font-bold text-zinc-600 w-8 text-center">{Math.round(zoom/20*100)}%</span>
            <button onClick={() => setZoom(prev => Math.min(prev * 1.5, 150))} className="p-1 hover:bg-zinc-800 rounded text-zinc-500"><ZoomIn size={14} /></button>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden relative timeline-scroll bg-black" ref={containerRef}>
        <div className="relative h-full" style={{ width: (totalDuration * zoom) + 400 }}>
            <div className="h-7 w-full bg-zinc-900/50 border-b border-zinc-800 sticky top-0 z-10">{rulerMarkers}</div>
            <div className="pt-4 pb-4 relative h-32">
                <div className="fixed left-2 mt-2 text-[9px] font-black text-zinc-600 bg-black/80 px-1.5 py-0.5 border border-zinc-800 rounded z-20 uppercase tracking-widest">Visual Track V1</div>
                {items.map((item) => (
                    <div
                        key={item.id}
                        onClick={() => onSelectItem(item)}
                        onMouseEnter={() => setHoveredItem(item)}
                        onMouseLeave={() => setHoveredItem(null)}
                        onMouseMove={(e) => setTooltipPos({ x: e.clientX + 15, y: e.clientY + 15 })}
                        className={`absolute top-1 h-20 rounded border overflow-hidden cursor-pointer transition-all select-none
                            ${selectedItemId === item.id 
                                ? 'border-orange-500 ring-2 ring-orange-500/30 z-10 brightness-110' 
                                : 'border-zinc-800 hover:border-zinc-600 brightness-75 hover:brightness-100'
                            }
                            ${!item.data.imageUrl ? 'bg-zinc-900' : 'bg-black'}
                        `}
                        style={{ left: item.start * zoom, width: Math.max(item.duration * zoom, 2) }}
                    >
                        {item.data.imageUrl && <img src={item.data.imageUrl} className="absolute inset-0 w-full h-full object-cover opacity-50 grayscale hover:opacity-80 transition-opacity" alt="clip" />}
                        <div className="p-1.5 h-full flex flex-col justify-between relative z-10 bg-gradient-to-t from-black/80 to-transparent">
                            <span className="text-[8px] font-black truncate text-zinc-300 uppercase">{item.sceneHeader}</span>
                            <div className="flex items-center justify-between">
                                <span className="text-[8px] font-mono text-orange-500 font-bold">{item.data.type}</span>
                                <span className="text-[8px] font-mono text-zinc-500">{item.duration}s</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};
