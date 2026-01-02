
import React, { useState, useRef, useEffect } from 'react';
import { analyzeScript, generateShotImage, validateApiKey } from './services/geminiService';
import { ScriptAnalysis, TimelineItem, SavedProject, LogEntry, Shot } from './types';
import { Timeline } from './components/Timeline';
import { ShotDetails } from './components/ShotDetails';
import { HelpModal } from './components/HelpModal';
import { Loader2, Wand2, Upload, Key, CheckCircle, AlertCircle, HelpCircle, Save, FolderOpen, FileOutput, PlusCircle, Images, Sun, Moon, Clapperboard, ShieldAlert } from 'lucide-react';

const SAMPLE_SCRIPT = `CẢNH 1
EXT. BÃI PHẾ LIỆU CÔNG NGHỆ - NGÀY
TOÀN CẢNH. Giữa những đống kim loại gỉ sét khổng lồ của thành phố tương lai, một chú robot nhỏ tên BIT (hình dáng tròn trịa, mắt led xanh) đang đào bới. Bầu trời xám xịt, bụi bặm.

CẬN CẢNH. Tay robot chạm vào một vệt xanh lá le lói dưới lớp sắt vụn. Đó là một mầm cây nhỏ đang tỏa sáng.`;

const App: React.FC = () => {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [apiKey, setApiKey] = useState('');
  const [apiStatus, setApiStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');
  const [scriptInput, setScriptInput] = useState(SAMPLE_SCRIPT);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisData, setAnalysisData] = useState<ScriptAnalysis | null>(null);
  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | undefined>(undefined);
  const [view, setView] = useState<'input' | 'timeline'>('input');
  const [previewHeight, setPreviewHeight] = useState(400); 
  const isDraggingRef = useRef(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const [showHelp, setShowHelp] = useState(false);
  const projectInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const addLog = (message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') => {
    setLogs(prev => [...prev, { timestamp: new Date().toLocaleTimeString(), message, type }]);
  };

  const handleCheckKey = async () => {
    if (!apiKey.trim()) return;
    setApiStatus('checking');
    const isValid = await validateApiKey(apiKey.trim());
    if (isValid) {
      setApiStatus('valid');
      addLog("API Key hợp lệ. Đã sẵn sàng.", "success");
    } else {
      setApiStatus('invalid');
      addLog("API Key không hợp lệ hoặc lỗi billing.", "error");
    }
  };

  const renderTextToImage = (
    text: string, 
    widthMm: number, 
    fontSize: number, 
    color: string, 
    isBold: boolean = false,
    align: 'left' | 'center' = 'left'
  ): Promise<{ dataUrl: string, heightMm: number }> => {
    return new Promise((resolve) => {
      const scale = 5; // Độ phân giải cực cao để in ấn không bị vỡ
      const mmToPx = 3.7795; 
      const canvasWidth = widthMm * mmToPx * scale;
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      
      const fontName = '"Inter", "Segoe UI", "Arial", sans-serif';
      ctx.font = `${isBold ? 'bold' : ''} ${fontSize * mmToPx * scale}px ${fontName}`;
      
      const words = text.split(/\s+/);
      const lines: string[] = [];
      let currentLine = '';
      
      words.forEach(word => {
        const testLine = currentLine + word + ' ';
        if (ctx.measureText(testLine).width > canvasWidth && currentLine !== '') {
          lines.push(currentLine.trim());
          currentLine = word + ' ';
        } else {
          currentLine = testLine;
        }
      });
      lines.push(currentLine.trim());
      
      const lineHeight = fontSize * 1.5;
      const totalHeightMm = lines.length * lineHeight;
      canvas.width = canvasWidth;
      canvas.height = totalHeightMm * mmToPx * scale;
      
      ctx.scale(scale, scale);
      ctx.font = `${isBold ? 'bold' : ''} ${fontSize * mmToPx}px ${fontName}`;
      ctx.fillStyle = color;
      ctx.textBaseline = 'top';
      
      lines.forEach((line, i) => {
        let x = 0;
        if (align === 'center') {
          x = (widthMm * mmToPx - ctx.measureText(line).width) / 2;
        }
        ctx.fillText(line, x, i * lineHeight * mmToPx);
      });
      
      resolve({ dataUrl: canvas.toDataURL('image/png'), heightMm: totalHeightMm });
    });
  };

  const handleExportPDF = async () => {
    if (!analysisData || timelineItems.length === 0) return;
    addLog("Đang khởi tạo PDF chất lượng cao...", "info");
    
    try {
      const { jsPDF } = (window as any).jspdf;
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      
      // --- TRANG BÌA (Tone Cam-Trắng) ---
      doc.setFillColor(249, 115, 22); // Orange 500
      doc.rect(0, 0, pageWidth, 50, 'F');
      
      const headImg = await renderTextToImage("OFFICIAL STORYBOARD", pageWidth - 40, 10, "#FFFFFF", true, 'center');
      doc.addImage(headImg.dataUrl, 'PNG', 20, 20, pageWidth - 40, headImg.heightMm);

      const titleImg = await renderTextToImage(analysisData.title.toUpperCase(), pageWidth - 40, 24, "#18181b", true, 'center');
      doc.addImage(titleImg.dataUrl, 'PNG', 20, 70, pageWidth - 40, titleImg.heightMm);

      const loglineImg = await renderTextToImage(analysisData.logline_vi, pageWidth - 60, 11, "#52525b", false, 'center');
      doc.addImage(loglineImg.dataUrl, 'PNG', 30, 120, pageWidth - 60, loglineImg.heightMm);

      // --- DANH SÁCH PHÂN CẢNH ---
      const margin = 20;
      const shotsPerPage = 3;
      const boxWidth = pageWidth - (margin * 2);
      const boxHeight = 70;

      for (let i = 0; i < timelineItems.length; i++) {
        const item = timelineItems[i];
        if (i % shotsPerPage === 0) {
          doc.addPage();
          doc.setFillColor(249, 115, 22);
          doc.rect(0, 0, pageWidth, 12, 'F');
          const headerImg = await renderTextToImage(`DỰ ÁN: ${analysisData.title.toUpperCase()} | TRANG ${doc.internal.getNumberOfPages() - 1}`, pageWidth - 40, 6, "#FFFFFF", true);
          doc.addImage(headerImg.dataUrl, 'PNG', margin, 3, pageWidth - 40, headerImg.heightMm);
        }

        const y = 20 + (i % shotsPerPage) * (boxHeight + 10);
        
        // Card Border
        doc.setDrawColor(249, 115, 22);
        doc.setLineWidth(0.5);
        doc.rect(margin, y, boxWidth, boxHeight);
        
        // Thumbnail
        const imgW = 80;
        const imgH = 45;
        doc.setFillColor(245, 245, 245);
        doc.rect(margin + 5, y + 5, imgW, imgH, 'F');
        if (item.data.imageUrl) {
          doc.addImage(item.data.imageUrl, 'PNG', margin + 5, y + 5, imgW, imgH);
        }

        // Info
        const infoX = margin + imgW + 10;
        const infoW = boxWidth - imgW - 15;
        
        const shotTitleImg = await renderTextToImage(`SHOT #${i + 1}`, infoW, 14, "#ea580c", true);
        doc.addImage(shotTitleImg.dataUrl, 'PNG', infoX, y + 5, infoW, shotTitleImg.heightMm);

        const metaImg = await renderTextToImage(`${item.data.type} • ${item.duration}s • ${item.data.camera_movement}`, infoW, 9, "#18181b", true);
        doc.addImage(metaImg.dataUrl, 'PNG', infoX, y + 15, infoW, metaImg.heightMm);

        const descImg = await renderTextToImage(item.data.description_vi, infoW, 9, "#52525b", false);
        doc.addImage(descImg.dataUrl, 'PNG', infoX, y + 25, infoW, descImg.heightMm);
      }

      doc.save(`STORYBOARD_${analysisData.title.replace(/\s/g, '_')}.pdf`);
      addLog("Đã xuất PDF thành công (Sửa lỗi hiển thị).", "success");
    } catch (e: any) {
      addLog(`Lỗi PDF: ${e.message}`, "error");
    }
  };

  const handleAnalyze = async () => {
    if (apiStatus !== 'valid' || !scriptInput.trim()) return;
    setIsAnalyzing(true);
    addLog("AI đang bóc tách kịch bản...", "info");
    try {
      const data = await analyzeScript(scriptInput, apiKey.trim());
      setAnalysisData(data);
      const items: TimelineItem[] = [];
      let time = 0;
      data.acts.forEach(act => act.scenes.forEach(scene => scene.shots.forEach(shot => {
        items.push({ id: shot.id, start: time, duration: shot.duration, data: shot, sceneHeader: scene.header });
        time += shot.duration;
      })));
      setTimelineItems(items);
      setView('timeline');
      addLog("Phân tích xong.", "success");
    } catch (err) {
      addLog("Lỗi phân tích kịch bản.", "error");
    } finally { setIsAnalyzing(false); }
  };

  const selectedItem = timelineItems.find(i => i.id === selectedItemId) || null;

  return (
    <div className="h-screen w-screen bg-white dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 flex flex-col overflow-hidden transition-colors">
      <header className="h-16 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex items-center px-4 justify-between z-50">
        <div className="flex items-center space-x-3">
          <div className="bg-orange-600 p-1.5 rounded-lg">
            <Images size={20} className="text-white" />
          </div>
          <h1 className="text-lg font-black tracking-tighter uppercase">SKETCH <span className="text-orange-500 font-light">AI</span></h1>
        </div>

        <div className="flex items-center space-x-3">
          <div className={`flex items-center border rounded-lg px-2 py-1.5 transition-all ${
            apiStatus === 'valid' ? 'border-emerald-500 bg-emerald-500/5' : 
            apiStatus === 'invalid' ? 'border-red-500 bg-red-500/5' : 'border-zinc-200 dark:border-zinc-800'
          }`}>
            {apiStatus === 'checking' ? <Loader2 size={14} className="animate-spin text-orange-500" /> : 
             apiStatus === 'valid' ? <CheckCircle size={14} className="text-emerald-500" /> : 
             apiStatus === 'invalid' ? <AlertCircle size={14} className="text-red-500" /> : <ShieldAlert size={14} className="text-zinc-400" />}
            <input 
              type="password" 
              value={apiKey} 
              onChange={e => {setApiKey(e.target.value); setApiStatus('idle');}}
              placeholder="Dán Gemini API Key..." 
              className="bg-transparent text-xs ml-2 outline-none w-32 md:w-48 placeholder:text-zinc-400"
            />
            {apiStatus === 'idle' && apiKey.length > 5 && (
              <button onClick={handleCheckKey} className="ml-2 text-[10px] font-bold text-orange-600 uppercase">Kết nối</button>
            )}
          </div>

          <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-zinc-500">
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          
          {view === 'timeline' && (
            <button onClick={handleExportPDF} className="bg-orange-600 text-white p-2 rounded-lg" title="Xuất PDF">
              <FileOutput size={16} />
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 overflow-hidden">
        {view === 'input' ? (
          <div className="h-full flex flex-col items-center justify-center p-8">
            <div className="w-full max-w-3xl space-y-8">
              <div className="text-center space-y-4">
                <h2 className="text-5xl font-black tracking-tight leading-tight">VẼ PHÁC THẢO <br/> <span className="text-orange-600">STORYBOARD AI</span></h2>
                <p className="text-zinc-500">Nhập kịch bản để AI tự động chia shot và vẽ phác thảo.</p>
              </div>
              <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xl overflow-hidden h-[40vh] relative">
                <textarea 
                  className="w-full h-full p-6 bg-transparent resize-none outline-none font-mono text-sm leading-relaxed"
                  value={scriptInput}
                  onChange={e => setScriptInput(e.target.value)}
                  placeholder="Cảnh 1. INT. PHÒNG KHÁCH - NGÀY..."
                />
              </div>
              <div className="flex justify-center">
                <button 
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || apiStatus !== 'valid'}
                  className="bg-orange-600 text-white px-12 py-4 rounded-full font-black text-lg shadow-xl shadow-orange-600/30 hover:scale-105 transition-all disabled:opacity-50 flex items-center"
                >
                  {isAnalyzing ? <Loader2 className="animate-spin mr-3" /> : <Wand2 className="mr-3"/>}
                  {isAnalyzing ? "ĐANG PHÂN TÍCH..." : "TẠO STORYBOARD"}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-row">
            <div className="flex-1 flex flex-col overflow-hidden">
              <div style={{ height: previewHeight }} className="flex-shrink-0 bg-white dark:bg-black border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-center relative">
                {selectedItem ? (
                  <div className="max-w-[85%] max-h-[85%] aspect-video bg-zinc-100 dark:bg-zinc-900 rounded-lg overflow-hidden shadow-2xl relative">
                    {selectedItem.data.imageUrl ? <img src={selectedItem.data.imageUrl} className="w-full h-full object-contain grayscale" /> : (
                      <div className="p-8 text-center text-zinc-500">
                        <Clapperboard size={32} className="mx-auto mb-4 opacity-20" />
                        <p className="font-bold text-orange-600 uppercase text-xs">{selectedItem.data.type}</p>
                        <p className="italic text-sm mt-2">"{selectedItem.data.description_vi}"</p>
                      </div>
                    )}
                  </div>
                ) : <p className="text-zinc-400 text-xs font-bold uppercase">Chọn Shot để xem trước</p>}
              </div>
              <div className="flex-1 relative">
                <Timeline items={timelineItems} onSelectItem={item => setSelectedItemId(item.id)} selectedItemId={selectedItemId} theme={theme} />
              </div>
              <div className="h-24 bg-zinc-50 dark:bg-zinc-950 border-t dark:border-zinc-900 p-2 overflow-y-auto font-mono text-[10px] text-zinc-500">
                {logs.map((log, i) => <div key={i}>[{log.timestamp}] {log.message}</div>)}
                <div ref={logsEndRef} />
              </div>
            </div>
            <div className="w-96 bg-zinc-50 dark:bg-zinc-900 border-l dark:border-black shrink-0">
              <ShotDetails item={selectedItem} onClose={() => setSelectedItemId(undefined)} onGenerateImage={(asp, res) => {
                if(selectedItemId && apiStatus === 'valid') {
                  addLog("Đang vẽ...", "info");
                  generateShotImage(selectedItem!.data.prompt_en, apiKey.trim(), [], asp).then(url => {
                    if(url) {
                      setTimelineItems(prev => prev.map(t => t.id === selectedItemId ? {...t, data: {...t.data, imageUrl: url}} : t));
                      addLog("Đã vẽ xong.", "success");
                    }
                  });
                }
              }} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
