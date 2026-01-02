
import React, { useState } from 'react';
import { TimelineItem, Shot } from '../types';
import { Camera, Clock, Clapperboard, Sparkles, Copy, Video, ArrowLeft, ImagePlus, RefreshCw, Film, Settings } from 'lucide-react';

interface ShotDetailsProps {
  item: TimelineItem | null;
  onClose?: () => void;
  onGenerateImage?: (aspectRatio: string, resolution: string) => void;
  onUpdateShot?: (updates: Partial<Shot>) => void;
}

export const ShotDetails: React.FC<ShotDetailsProps> = ({ item, onClose, onGenerateImage, onUpdateShot }) => {
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [resolution, setResolution] = useState("1K");

  if (!item) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-zinc-700 p-8 text-center bg-zinc-900">
        <Clapperboard size={48} className="mb-4 opacity-10" />
        <h3 className="text-sm font-bold text-zinc-600 uppercase tracking-widest">Shot Details</h3>
        <p className="text-xs mt-2">Chọn một phân cảnh để bắt đầu chỉnh sửa</p>
      </div>
    );
  }

  const { data, sceneHeader } = item;

  return (
    <div className="h-full flex flex-col bg-zinc-900 text-zinc-300">
      <div className="p-4 border-b border-zinc-800 bg-zinc-900/50 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
             <span className="text-[9px] font-black text-orange-500 uppercase tracking-[0.2em] border border-orange-500/20 px-2 py-0.5 rounded bg-orange-500/5">Properties</span>
             {onClose && (
                <button onClick={onClose} className="text-zinc-500 hover:text-white"><ArrowLeft size={16} /></button>
             )}
        </div>
        <h2 className="text-sm font-bold text-white leading-tight" title={sceneHeader}>{sceneHeader}</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
        <div className="grid grid-cols-2 gap-2">
            <div className="bg-black/40 p-3 rounded-xl border border-zinc-800">
                <div className="text-zinc-500 text-[9px] uppercase font-black mb-1">Duration</div>
                <div className="text-xl font-mono text-orange-500 font-bold">{data.duration}s</div>
            </div>
            <div className="bg-black/40 p-3 rounded-xl border border-zinc-800">
                <div className="text-zinc-500 text-[9px] uppercase font-black mb-1">Cỡ cảnh</div>
                <div className="text-sm font-bold text-zinc-100 truncate">{data.type}</div>
            </div>
        </div>

        <div className="bg-black/40 p-3 rounded-xl border border-zinc-800 space-y-4">
            <div className="flex items-center text-[9px] font-black text-zinc-500 uppercase tracking-widest border-b border-zinc-800 pb-2">
                <Settings size={10} className="mr-2 text-orange-500"/> Sketch Config
            </div>
            <div>
                <span className="text-[10px] text-zinc-600 block mb-2 uppercase font-bold">Tỉ lệ khung hình</span>
                <div className="flex gap-1">
                    {["16:9", "1:1", "9:16"].map(r => (
                        <button key={r} onClick={() => setAspectRatio(r)} className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg border transition-all ${aspectRatio === r ? 'bg-orange-600 text-white border-orange-500' : 'bg-zinc-800 text-zinc-500 border-zinc-700 hover:text-zinc-300'}`}>{r}</button>
                    ))}
                </div>
            </div>
            <div>
                <span className="text-[10px] text-zinc-600 block mb-2 uppercase font-bold">Độ phân giải</span>
                <div className="flex gap-1">
                    {["1K", "2K", "4K"].map(res => (
                        <button key={res} onClick={() => setResolution(res)} className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg border transition-all ${resolution === res ? 'bg-zinc-100 text-black border-white' : 'bg-zinc-800 text-zinc-500 border-zinc-700 hover:text-zinc-300'}`}>{res}</button>
                    ))}
                </div>
            </div>
        </div>

        <div className="space-y-4">
            <div>
                <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-2 block">Chuyển động máy</label>
                <div className="bg-black/20 px-3 py-2 rounded-lg text-xs border border-zinc-800 text-zinc-400">{data.camera_movement || 'Static'}</div>
            </div>

            <div>
                <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-2 block">Visual Prompt (AI)</label>
                <textarea
                    value={data.prompt_en}
                    onChange={(e) => onUpdateShot?.({ prompt_en: e.target.value })}
                    className="w-full h-32 bg-black/40 p-3 rounded-xl border border-zinc-800 text-zinc-300 text-xs leading-relaxed font-mono focus:border-orange-500/50 outline-none resize-none"
                />
            </div>

            <div>
                <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-2 block">Video Prompt</label>
                <textarea
                    value={data.prompt_video_en || ''}
                    onChange={(e) => onUpdateShot?.({ prompt_video_en: e.target.value })}
                    className="w-full h-24 bg-black/40 p-3 rounded-xl border border-zinc-800 text-zinc-400 text-[10px] font-mono focus:border-orange-500/50 outline-none resize-none"
                />
            </div>
        </div>
      </div>

      <div className="p-4 border-t border-zinc-800 bg-zinc-900/80">
          <button 
            onClick={() => onGenerateImage?.(aspectRatio, resolution)}
            className="w-full py-3.5 rounded-xl font-black text-xs uppercase tracking-widest bg-orange-600 hover:bg-orange-500 text-white shadow-xl shadow-orange-600/20 transition-all flex items-center justify-center"
          >
            {data.imageUrl ? <RefreshCw size={14} className="mr-2"/> : <ImagePlus size={14} className="mr-2"/>}
            {data.imageUrl ? 'Vẽ lại phác thảo' : 'Vẽ phác thảo ngay'}
          </button>
      </div>
    </div>
  );
};
