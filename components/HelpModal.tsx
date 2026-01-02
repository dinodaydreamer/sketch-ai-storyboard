
import React, { useState } from 'react';
import { X, Globe, Key, FileText, Wand2, MousePointer, Image as ImageIcon } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  const [lang, setLang] = useState<'vi' | 'en'>('vi');
  if (!isOpen) return null;

  const content = {
    vi: {
      title: "HƯỚNG DẪN SỬ DỤNG",
      subtitle: "Sketch AI Storyboard - Quy trình tiền kỳ 4.0",
      steps: [
        { icon: <Key className="text-orange-500" size={24} />, title: "1. Nhập API Key", desc: "Sử dụng Gemini API Key để kích hoạt trí tuệ nhân tạo." },
        { icon: <FileText className="text-zinc-400" size={24} />, title: "2. Soạn Thảo", desc: "Dán kịch bản hoặc tải file kịch bản của bạn lên hệ thống." },
        { icon: <Wand2 className="text-orange-500" size={24} />, title: "3. Phân Tích", desc: "Nhấn nút 'Tạo Storyboard' để AI tự động chia shot và timeline." },
        { icon: <ImageIcon className="text-zinc-100" size={24} />, title: "4. Vẽ Sketch", desc: "Chọn từng shot để AI vẽ phác thảo minh họa phong cách điện ảnh." }
      ],
      close: "Bắt đầu ngay"
    },
    en: {
      title: "USER GUIDE",
      subtitle: "Sketch AI Storyboard - Workflow 4.0",
      steps: [
        { icon: <Key className="text-orange-500" size={24} />, title: "1. Enter API Key", desc: "Use Gemini API Key to activate AI features." },
        { icon: <FileText className="text-zinc-400" size={24} />, title: "2. Input Script", desc: "Paste your script or upload a .txt file." },
        { icon: <Wand2 className="text-orange-500" size={24} />, title: "3. Analyze", desc: "Click 'Generate Storyboard' to auto-breakdown shots." },
        { icon: <ImageIcon className="text-zinc-100" size={24} />, title: "4. Draw Sketches", desc: "Select shots for AI to generate cinematic sketches." }
      ],
      close: "Let's Go"
    }
  };

  const t = content[lang];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onClose}></div>
      <div className="relative bg-zinc-900 w-full max-w-xl rounded-2xl border border-zinc-800 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <div>
            <h2 className="text-xl font-black text-white tracking-tighter">{t.title}</h2>
            <p className="text-zinc-500 text-xs font-bold uppercase mt-1">{t.subtitle}</p>
          </div>
          <button onClick={() => setLang(prev => prev === 'vi' ? 'en' : 'vi')} className="px-3 py-1 rounded-full bg-zinc-800 border border-zinc-700 text-[10px] font-black text-orange-500">{lang.toUpperCase()}</button>
        </div>
        <div className="overflow-y-auto p-6 space-y-8">
          {t.steps.map((step, idx) => (
            <div key={idx} className="flex items-start space-x-5">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-black border border-zinc-800 flex items-center justify-center">{step.icon}</div>
              <div>
                <h3 className="text-white font-bold text-base mb-1">{step.title}</h3>
                <p className="text-zinc-500 text-sm leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="p-6 bg-zinc-900/50 flex justify-end">
          <button onClick={onClose} className="px-8 py-3 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all">{t.close}</button>
        </div>
      </div>
    </div>
  );
};
