
import React, { useState } from 'react';
import { X, Globe, Key, FileText, Wand2, MousePointer, Image as ImageIcon, CheckCircle2, Info, Lightbulb, Zap } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: 'dark' | 'light';
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose, theme }) => {
  const [lang, setLang] = useState<'vi' | 'en'>('vi');
  if (!isOpen) return null;

  const content = {
    vi: {
      title: "HƯỚNG DẪN SỬ DỤNG CHI TIẾT",
      subtitle: "Sketch AI Storyboard - Workflow Tiền Kỳ Chuyên Nghiệp",
      sections: [
        {
          title: "1. Kích hoạt Hệ thống",
          icon: <Key className="text-orange-500" size={20} />,
          steps: [
            "Lấy API Key từ Google AI Studio (Gemini).",
            "Dán Key vào ô nhập liệu ở Header. Hệ thống sẽ tự động kiểm tra tính hợp lệ.",
            "Trạng thái 'Hợp lệ' (Màu xanh) cho phép bạn sử dụng toàn bộ tính năng AI."
          ]
        },
        {
          title: "2. Cấu trúc Kịch bản chuẩn",
          icon: <FileText className="text-zinc-500 dark:text-zinc-400" size={20} />,
          steps: [
            "Sử dụng định dạng: 'CẢNH [Số] - [Địa điểm] - [Thời gian]'.",
            "Nên bao gồm các từ khóa chỉ cỡ cảnh như: TOÀN CẢNH, TRUNG CẢNH, CẬN CẢNH, ĐẶC TẢ.",
            "Mô tả hành động cụ thể để AI nhận diện cú máy tốt hơn."
          ]
        },
        {
          title: "3. Quản lý Timeline & Sketch",
          icon: <ImageIcon className="text-orange-500" size={20} />,
          steps: [
            "Nhấn 'Tạo Storyboard' để AI tự động chia Act/Scene/Shot lên Timeline.",
            "Chọn Shot trên Timeline để xem chi tiết và tùy chỉnh thông số Sketch.",
            "Dùng 'Sketch All' để vẽ phác thảo hàng loạt cho toàn bộ kịch bản."
          ]
        }
      ],
      tips: [
        "Mẹo: Bạn có thể kéo thanh ngăn giữa màn hình Preview và Timeline để tối ưu không gian làm việc.",
        "Xuất PDF: Toàn bộ phác thảo và thông tin kỹ thuật sẽ được đóng gói chuyên nghiệp.",
        "Lưu dự án: Xuất file .json để có thể tiếp tục làm việc vào lúc khác."
      ],
      close: "Đã hiểu, bắt đầu thôi!"
    },
    en: {
      title: "DETAILED USER GUIDE",
      subtitle: "Sketch AI Storyboard - Professional Pre-production Workflow",
      sections: [
        {
          title: "1. System Activation",
          icon: <Key className="text-orange-500" size={20} />,
          steps: [
            "Get your API Key from Google AI Studio (Gemini).",
            "Paste the Key in the Header. Validation is automatic.",
            "A 'Valid' status (Green) enables all AI features."
          ]
        },
        {
          title: "2. Script Formatting",
          icon: <FileText className="text-zinc-500 dark:text-zinc-400" size={20} />,
          steps: [
            "Format: 'SCENE [Num] - [Location] - [Time]'.",
            "Include shot type keywords: WIDE SHOT, MEDIUM SHOT, CLOSE-UP.",
            "Describe actions clearly for better AI shot recognition."
          ]
        },
        {
          title: "3. Timeline & Sketching",
          icon: <ImageIcon className="text-orange-500" size={20} />,
          steps: [
            "Click 'Generate Storyboard' to auto-breakdown into the Timeline.",
            "Select a Shot to customize parameters and generate specific sketches.",
            "Use 'Sketch All' to batch generate illustrations for the entire script."
          ]
        }
      ],
      tips: [
        "Tip: Resize the Preview/Timeline divider to optimize your layout.",
        "PDF Export: All sketches and tech info are packed into a pro document.",
        "Save Project: Export to .json to resume work later."
      ],
      close: "Got it, let's go!"
    }
  };

  const t = content[lang];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-zinc-950/80 dark:bg-black/90 backdrop-blur-md" onClick={onClose}></div>
      <div className="relative bg-white dark:bg-zinc-900 w-full max-w-2xl rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden transition-colors">
        <div className="flex items-center justify-between p-6 border-b border-zinc-100 dark:border-zinc-800">
          <div>
            <h2 className="text-xl font-black text-zinc-900 dark:text-white tracking-tighter uppercase">{t.title}</h2>
            <p className="text-zinc-500 text-xs font-bold uppercase mt-1 tracking-wider">{t.subtitle}</p>
          </div>
          <div className="flex items-center space-x-3">
             <button onClick={() => setLang(prev => prev === 'vi' ? 'en' : 'vi')} className="px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-[10px] font-black text-orange-500 transition-colors uppercase">{lang}</button>
             <button onClick={onClose} className="p-1 text-zinc-400 hover:text-orange-500"><X size={20}/></button>
          </div>
        </div>

        <div className="overflow-y-auto p-6 space-y-8 custom-scrollbar">
          {t.sections.map((section, idx) => (
            <div key={idx} className="space-y-4">
              <div className="flex items-center space-x-2 text-zinc-900 dark:text-white font-black text-sm uppercase tracking-wide">
                <span className="p-1.5 bg-zinc-100 dark:bg-black rounded-lg border border-zinc-200 dark:border-zinc-800">{section.icon}</span>
                <span>{section.title}</span>
              </div>
              <ul className="space-y-2 ml-10">
                {section.steps.map((step, sIdx) => (
                  <li key={sIdx} className="flex items-start space-x-3 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    <CheckCircle2 size={14} className="mt-1 shrink-0 text-emerald-500"/>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="bg-orange-50 dark:bg-orange-500/5 border border-orange-200 dark:border-orange-500/20 rounded-xl p-4 space-y-2">
            <div className="flex items-center space-x-2 text-orange-600 dark:text-orange-400 font-bold text-xs uppercase mb-1">
                <Lightbulb size={14}/>
                <span>Pro Tips</span>
            </div>
            {t.tips.map((tip, idx) => (
                <p key={idx} className="text-xs text-orange-800/80 dark:text-orange-300/60 leading-relaxed">• {tip}</p>
            ))}
          </div>
        </div>

        <div className="p-6 bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
          <button onClick={onClose} className="px-8 py-3 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-orange-600/20">{t.close}</button>
        </div>
      </div>
    </div>
  );
};
