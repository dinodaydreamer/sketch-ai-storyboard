
import React, { useState, useRef, useEffect } from 'react';
import { analyzeScript, generateShotImage } from './services/geminiService';
import { ScriptAnalysis, TimelineItem, SavedProject, LogEntry, Shot } from './types';
import { Timeline } from './components/Timeline';
import { ShotDetails } from './components/ShotDetails';
import { HelpModal } from './components/HelpModal';
// Added missing Clapperboard icon to the import list from lucide-react
import { Play, Loader2, FileText, Wand2, LayoutTemplate, Upload, Key, CheckCircle, AlertCircle, HelpCircle, Save, FolderOpen, Download, ImagePlus, StopCircle, FileOutput, Settings, X, GripHorizontal, Images, PlusCircle, TerminalSquare, ShieldAlert, Sun, Moon, Clapperboard } from 'lucide-react';

const SAMPLE_SCRIPT = `CẢNH 1
EXT. BÃI PHẾ LIỆU CÔNG NGHỆ - NGÀY
TOÀN CẢNH. Giữa những đống kim loại gỉ sét khổng lồ của thành phố tương lai, một chú robot nhỏ tên BIT (hình dáng tròn trịa, mắt led xanh) đang đào bới. Bầu trời xám xịt, bụi bặm.

CẬN CẢNH. Tay robot chạm vào một vệt xanh lá le lói dưới lớp sắt vụn. Đó là một mầm cây nhỏ đang tỏa sáng.

CẢNH 2
EXT. BAN CÔNG NHÀ BIT - HOÀNG HÔN
TRUNG CẢNH. Bit cẩn thận đặt mầm cây vào một chiếc chậu làm từ vỏ lon cũ. Ánh nắng hoàng hôn màu cam cháy nhuộm đỏ những tòa tháp kim loại phía xa.

CẬN CẢNH BIT. Đôi mắt led của chú robot chuyển sang hình trái tim. Chú dùng một ngón tay kim loại chạm nhẹ vào chiếc lá bé xíu.`;

const App: React.FC = () => {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [hasKeySelected, setHasKeySelected] = useState(false);
  const [scriptInput, setScriptInput] = useState(SAMPLE_SCRIPT);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisData, setAnalysisData] = useState<ScriptAnalysis | null>(null);
  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | undefined>(undefined);
  const [view, setView] = useState<'input' | 'timeline'>('input');
  const [previewHeight, setPreviewHeight] = useState(400); 
  const isDraggingRef = useRef(false);
  const [isBatchGenerating, setIsBatchGenerating] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });
  const shouldStopBatchRef = useRef(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const [showHelp, setShowHelp] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const projectInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  useEffect(() => {
    const checkKeySelection = async () => {
      const aistudio = (window as any).aistudio;
      if (aistudio?.hasSelectedApiKey) {
        const has = await aistudio.hasSelectedApiKey();
        setHasKeySelected(has);
      } else {
        setHasKeySelected(!!process.env.API_KEY);
      }
    };
    checkKeySelection();
  }, []);

  const addLog = (message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') => {
    setLogs(prev => [...prev, { timestamp: new Date().toLocaleTimeString(), message, type }]);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDraggingRef.current) return;
    const newHeight = Math.max(100, Math.min(e.clientY - 64, window.innerHeight - 300));
    setPreviewHeight(newHeight);
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleLoadProject = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        if (typeof e.target?.result === 'string') {
          const project = JSON.parse(e.target.result) as SavedProject;
          setScriptInput(project.scriptInput);
          setAnalysisData(project.analysisData);
          setTimelineItems(project.timelineItems);
          setView('timeline');
          addLog(`Đã tải dự án: ${file.name}`, "success");
        }
      } catch (err) {
        addLog("Lỗi khi tải dự án. Định dạng file không hợp lệ.", "error");
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const handleConnectKey = async () => {
    const aistudio = (window as any).aistudio;
    if (aistudio?.openSelectKey) {
      await aistudio.openSelectKey();
      setHasKeySelected(true);
      addLog("Đang kết nối API Key...", "info");
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      if (typeof e.target?.result === 'string') {
        setScriptInput(e.target.result);
        addLog(`Đã tải file kịch bản: ${file.name}`, "success");
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const renderUnicodeToImage = (
    text: string, 
    widthMm: number, 
    fontSize: number, 
    color: string, 
    isBold: boolean = false,
    align: 'left' | 'center' = 'left'
  ): Promise<{ dataUrl: string, heightMm: number }> => {
    return new Promise((resolve) => {
      const scale = 4;
      const mmToPx = 3.78;
      const canvasWidth = widthMm * mmToPx * scale;
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      
      canvas.width = canvasWidth;
      ctx.font = `${isBold ? 'bold' : ''} ${fontSize * mmToPx * scale}px "Inter", "Segoe UI", "Arial", sans-serif`;
      
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
      
      const lineHeight = fontSize * 1.4;
      const totalHeightMm = lines.length * lineHeight + 2;
      canvas.height = totalHeightMm * mmToPx * scale;
      
      ctx.scale(scale, scale);
      ctx.font = `${isBold ? 'bold' : ''} ${fontSize * mmToPx}px "Inter", "Segoe UI", "Arial", sans-serif`;
      ctx.fillStyle = color;
      ctx.textBaseline = 'top';
      
      lines.forEach((line, i) => {
        let x = 0;
        if (align === 'center') {
          const metrics = ctx.measureText(line);
          x = (widthMm * mmToPx - metrics.width) / 2;
        }
        ctx.fillText(line, x, (i * lineHeight * mmToPx) + (1 * mmToPx));
      });
      
      resolve({
        dataUrl: canvas.toDataURL('image/png'),
        heightMm: totalHeightMm
      });
    });
  };

  const handleExportPDF = async () => {
    if (!analysisData || timelineItems.length === 0) return;
    addLog("Đang đóng gói Storyboard tone Cam-Trắng...", "info");
    
    try {
      const { jsPDF } = (window as any).jspdf;
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      
      // --- 1. COVER PAGE (Tone Cam - Trắng) ---
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, pageWidth, pageHeight, 'F');
      
      // Header Orange Bar
      doc.setFillColor(249, 115, 22);
      doc.rect(0, 0, pageWidth, 40, 'F');
      
      // Document Badge
      const badgeRes = await renderUnicodeToImage("PHÁC THẢO KỊCH BẢN CHUYÊN NGHIỆP", pageWidth - 40, 9, "#FFFFFF", true, 'center');
      doc.addImage(badgeRes.dataUrl, 'PNG', 20, 15, pageWidth - 40, badgeRes.heightMm);

      // Main Title
      const titleRes = await renderUnicodeToImage("SKETCH AI STORYBOARD", pageWidth - 40, 28, "#f97316", true, 'center');
      doc.addImage(titleRes.dataUrl, 'PNG', 20, 60, pageWidth - 40, titleRes.heightMm);

      // Divider Line
      doc.setDrawColor(249, 115, 22);
      doc.setLineWidth(1);
      doc.line(40, 60 + titleRes.heightMm + 10, pageWidth - 40, 60 + titleRes.heightMm + 10);

      // Project Name
      const projectRes = await renderUnicodeToImage(analysisData.title.toUpperCase(), pageWidth - 40, 22, "#18181b", true, 'center');
      doc.addImage(projectRes.dataUrl, 'PNG', 20, 60 + titleRes.heightMm + 20, pageWidth - 40, projectRes.heightMm);

      // Genre
      const genreRes = await renderUnicodeToImage(`THỂ LOẠI: ${analysisData.genre.toUpperCase()}`, pageWidth - 40, 10, "#52525b", false, 'center');
      doc.addImage(genreRes.dataUrl, 'PNG', 20, 60 + titleRes.heightMm + 20 + projectRes.heightMm + 5, pageWidth - 40, genreRes.heightMm);

      // Logline Box
      const loglineBoxY = 140;
      doc.setFillColor(255, 247, 237); // Orange 50
      doc.rect(20, loglineBoxY, pageWidth - 40, 30, 'F');
      doc.setDrawColor(253, 186, 116); // Orange 300
      doc.setLineWidth(0.5);
      doc.rect(20, loglineBoxY, pageWidth - 40, 30, 'D');

      const loglineRes = await renderUnicodeToImage(analysisData.logline_vi || "", pageWidth - 60, 11, "#18181b", false, 'center');
      doc.addImage(loglineRes.dataUrl, 'PNG', 30, loglineBoxY + 10, pageWidth - 60, loglineRes.heightMm);

      // Footer Date
      const dateText = `NGÀY XUẤT BẢN: ${new Date().toLocaleDateString('vi-VN')}`;
      const dateRes = await renderUnicodeToImage(dateText, pageWidth - 40, 8, "#a1a1aa", false, 'center');
      doc.addImage(dateRes.dataUrl, 'PNG', 20, pageHeight - 20, pageWidth - 40, dateRes.heightMm);

      // --- 2. SHOTS LISTING ---
      const margin = 15;
      const shotsPerPage = 3;
      const cardWidth = pageWidth - (margin * 2);
      const cardHeight = 75;

      for (let i = 0; i < timelineItems.length; i++) {
        const item = timelineItems[i];
        const shotInPage = i % shotsPerPage;

        if (shotInPage === 0) {
          doc.addPage();
          doc.setFillColor(255, 255, 255);
          doc.rect(0, 0, pageWidth, pageHeight, 'F');

          // Header Bar
          doc.setFillColor(249, 115, 22);
          doc.rect(0, 0, pageWidth, 15, 'F');
          
          const headerRes = await renderUnicodeToImage(`DỰ ÁN: ${analysisData.title.toUpperCase()} | TRANG ${doc.internal.getNumberOfPages() - 1}`, pageWidth - 30, 7, "#FFFFFF", true);
          doc.addImage(headerRes.dataUrl, 'PNG', margin, 5, pageWidth - 30, headerRes.heightMm);
        }

        const yPos = 25 + (shotInPage * (cardHeight + 8));

        // Shot Card Background
        doc.setFillColor(255, 255, 255);
        doc.rect(margin, yPos, cardWidth, cardHeight, 'F');
        doc.setDrawColor(249, 115, 22);
        doc.setLineWidth(0.3);
        doc.rect(margin, yPos, cardWidth, cardHeight, 'D');

        // Thumbnail Container
        const imgW = 85;
        const imgH = 47.8;
        doc.setFillColor(250, 250, 250);
        doc.rect(margin + 5, yPos + 5, imgW, imgH, 'F');
        doc.setDrawColor(228, 228, 231);
        doc.rect(margin + 5, yPos + 5, imgW, imgH, 'D');
        
        if (item.data.imageUrl) {
          doc.addImage(item.data.imageUrl, 'PNG', margin + 5, yPos + 5, imgW, imgH);
        } else {
          doc.setTextColor(161, 161, 170);
          doc.setFontSize(8);
          doc.text("CHƯA CÓ PHÁC THẢO", margin + 5 + imgW/2, yPos + 5 + imgH/2, { align: "center" });
        }

        // Info Panel
        const infoX = margin + imgW + 10;
        const infoW = cardWidth - imgW - 15;

        // Shot Label
        const sNumRes = await renderUnicodeToImage(`PHÂN CẢNH #${i + 1}`, infoW, 13, "#f97316", true);
        doc.addImage(sNumRes.dataUrl, 'PNG', infoX, yPos + 5, infoW, sNumRes.heightMm);

        // Technical Specs
        const metaText = `${item.data.type} • ${item.duration}s • ${item.data.camera_movement || 'Tĩnh'}`;
        const metaRes = await renderUnicodeToImage(metaText, infoW, 8.5, "#18181b", true);
        doc.addImage(metaRes.dataUrl, 'PNG', infoX, yPos + 5 + sNumRes.heightMm + 2, infoW, metaRes.heightMm);

        // Description (Unicode safe via Canvas)
        const descRes = await renderUnicodeToImage(item.data.description_vi || "Không có mô tả.", infoW, 9.5, "#52525b", false);
        doc.addImage(descRes.dataUrl, 'PNG', infoX, yPos + 5 + sNumRes.heightMm + metaRes.heightMm + 6, infoW, descRes.heightMm);

        // Scene Header Label at Bottom of Card
        const sceneRes = await renderUnicodeToImage(item.sceneHeader, infoW, 7, "#a1a1aa", false);
        doc.addImage(sceneRes.dataUrl, 'PNG', infoX, yPos + cardHeight - 8, infoW, sceneRes.heightMm);
        
        // Orange accent tag for each card
        doc.setFillColor(249, 115, 22);
        doc.rect(margin, yPos, 2, cardHeight, 'F');
      }

      doc.save(`STORYBOARD_PRO_${analysisData.title.replace(/\s+/g, '_')}.pdf`);
      addLog("Đã xuất Storyboard tone Cam-Trắng thành công.", "success");
    } catch (err: any) {
      addLog(`Lỗi khi xuất PDF: ${err.message}`, "error");
      console.error(err);
    }
  };

  const handleAnalyze = async () => {
    if (!hasKeySelected || !scriptInput.trim()) return;
    setIsAnalyzing(true);
    addLog("Đang phân tích kịch bản bằng Gemini Pro...", "info");
    try {
      const data = await analyzeScript(scriptInput);
      setAnalysisData(data);
      const items: TimelineItem[] = [];
      let currentTime = 0;
      data.acts.forEach(act => {
        act.scenes.forEach(scene => {
          scene.shots.forEach(shot => {
            items.push({ id: shot.id, start: currentTime, duration: shot.duration, data: shot, sceneHeader: scene.header });
            currentTime += shot.duration;
          });
        });
      });
      setTimelineItems(items);
      setView('timeline');
      addLog("Phân tích kịch bản hoàn tất.", "success");
    } catch (err) {
      addLog("Phân tích kịch bản thất bại.", "error");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleUpdateShotData = (updates: Partial<Shot>) => {
    if (!selectedItemId) return;
    setTimelineItems(prev => prev.map(item => item.id === selectedItemId ? { ...item, data: { ...item.data, ...updates } } : item));
  };

  const handleGenerateImage = async (aspectRatio: string = "16:9", resolution: string = "1K") => {
    if (!hasKeySelected || !selectedItemId) return;
    const idx = timelineItems.findIndex(i => i.id === selectedItemId);
    addLog(`Đang vẽ phác thảo Shot ${idx + 1} bằng Gemini 3 Pro Image...`, "info");
    try {
      const imageUrl = await generateShotImage(timelineItems[idx].data.prompt_en, analysisData?.characters, aspectRatio, resolution);
      if (imageUrl) {
        setTimelineItems(prev => prev.map(item => item.id === selectedItemId ? { ...item, data: { ...item.data, imageUrl } } : item));
        addLog(`Đã vẽ xong Shot ${idx + 1}`, "success");
      }
    } catch (error: any) {
      if (error.message?.includes("Requested entity was not found")) {
        setHasKeySelected(false);
        addLog("Vui lòng chọn lại API Key có kích hoạt billing.", "error");
        await handleConnectKey();
      } else {
        addLog(`Lỗi vẽ ảnh: ${error.message}`, "error");
      }
    }
  };

  const handleBatchGenerateImages = async () => {
    if (!hasKeySelected) return;
    const itemsToProcess = timelineItems.filter(item => !item.data.imageUrl);
    if (itemsToProcess.length === 0) return;
    setIsBatchGenerating(true);
    shouldStopBatchRef.current = false;
    setBatchProgress({ current: 0, total: itemsToProcess.length });
    for (let i = 0; i < itemsToProcess.length; i++) {
      if (shouldStopBatchRef.current) break;
      const item = itemsToProcess[i];
      try {
        const imageUrl = await generateShotImage(item.data.prompt_en, analysisData?.characters, "16:9", "1K");
        if (imageUrl) {
          setTimelineItems(prev => prev.map(t => t.id === item.id ? { ...t, data: { ...t.data, imageUrl } } : t));
        }
      } catch (e: any) {
        if (e.message?.includes("Requested entity was not found")) {
            setHasKeySelected(false);
            break;
        }
      }
      setBatchProgress(prev => ({ ...prev, current: i + 1 }));
      if (i < itemsToProcess.length - 1) await new Promise(r => setTimeout(r, 4000));
    }
    setIsBatchGenerating(false);
    addLog("Vẽ phác thảo hàng loạt hoàn tất.", "success");
  };

  const selectedItem = timelineItems.find(i => i.id === selectedItemId) || null;

  return (
    <div className="h-screen w-screen bg-white dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 flex flex-col overflow-hidden transition-colors">
      <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} theme={theme} />
      <input type="file" accept=".json" ref={projectInputRef} className="hidden" onChange={handleLoadProject} />

      <header className="h-16 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex items-center px-4 shrink-0 z-50 shadow-sm justify-between">
        <div className="flex items-center space-x-3 w-1/4">
          <div className="bg-orange-600 p-1.5 rounded-lg shadow-lg shadow-orange-600/20">
            <Images size={20} className="text-white" />
          </div>
          <h1 className="text-lg font-black tracking-tighter uppercase hidden md:block">SKETCH <span className="text-orange-500 font-light">AI</span></h1>
        </div>

        <div className="flex-1 flex justify-center">
          {analysisData && (
            <div className="bg-zinc-100 dark:bg-black/40 px-4 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-800 text-sm font-bold truncate max-w-md">
              {analysisData.title}
            </div>
          )}
        </div>

        <div className="flex items-center space-x-3 w-auto md:w-1/3 justify-end">
          <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-zinc-500 transition-colors">
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {!hasKeySelected ? (
            <button 
              onClick={handleConnectKey}
              className="flex items-center space-x-2 bg-orange-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-lg hover:bg-orange-500 transition-all"
            >
              <Key size={14} />
              <span>Kết nối Gemini</span>
            </button>
          ) : (
            <div className="flex items-center bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-1.5">
              <CheckCircle size={14} className="text-emerald-500" />
              <span className="text-[10px] ml-2 font-bold text-zinc-500 uppercase tracking-tighter">Pro Connected</span>
            </div>
          )}

          {view === 'timeline' && (
            <div className="flex items-center space-x-2">
              <button onClick={handleBatchGenerateImages} className="bg-orange-600 text-white p-2 rounded-lg hover:bg-orange-500 transition-colors" title="Sketch All">
                <Wand2 size={16} />
              </button>
              <button onClick={handleExportPDF} className="bg-zinc-100 dark:bg-zinc-800 p-2 rounded-lg hover:text-orange-500 transition-colors" title="PDF">
                <FileOutput size={16} />
              </button>
              <button onClick={() => setView('input')} className="bg-zinc-100 dark:bg-zinc-800 p-2 rounded-lg hover:text-orange-500 transition-colors">
                <PlusCircle size={16} />
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 overflow-hidden">
        {view === 'input' ? (
          <div className="h-full flex flex-col items-center justify-center p-8 bg-zinc-50 dark:bg-[#09090b]">
            <div className="w-full max-w-3xl space-y-8">
              <div className="text-center space-y-4">
                <div className="inline-block bg-orange-600/10 border border-orange-500/20 px-3 py-1 rounded-full text-orange-600 text-xs font-bold tracking-widest uppercase">AI Production Suite</div>
                <h2 className="text-5xl font-black tracking-tight leading-tight">VẼ PHÁC THẢO <br/> <span className="text-orange-600">STORYBOARD AI</span></h2>
                <p className="text-zinc-500 max-w-md mx-auto">Tự động phân tích kịch bản và phác thảo storyboard dưới dạng sketch phim điện ảnh.</p>
              </div>
              <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xl overflow-hidden flex flex-col h-[50vh] relative">
                <div className="bg-zinc-50 dark:bg-zinc-800/50 px-4 py-2 border-b border-zinc-200 dark:border-zinc-800 text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex justify-between">
                    <span>Nội dung kịch bản</span>
                    <button onClick={() => fileInputRef.current?.click()} className="hover:text-orange-500 flex items-center"><Upload size={10} className="mr-1"/> Import .txt</button>
                    <input type="file" accept=".txt" ref={fileInputRef} className="hidden" onChange={handleFileUpload}/>
                </div>
                <textarea 
                  className="flex-1 p-6 bg-transparent resize-none outline-none font-mono text-sm leading-relaxed custom-scrollbar"
                  value={scriptInput}
                  onChange={e => setScriptInput(e.target.value)}
                  placeholder="Nhập kịch bản tại đây... VD: Cảnh 1. EXT. CÔNG VIÊN - NGÀY..."
                />
                {!hasKeySelected && (
                  <div className="absolute inset-0 bg-white/80 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center text-center p-6">
                    <div className="space-y-4">
                      <Key size={40} className="mx-auto text-zinc-400" />
                      <p className="font-bold">Vui lòng kết nối Gemini Pro để bắt đầu</p>
                      <button onClick={handleConnectKey} className="bg-orange-600 text-white px-8 py-2.5 rounded-full font-bold shadow-lg shadow-orange-600/20 mt-2 hover:bg-orange-500 transition-all">Connect API</button>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex justify-center">
                <button 
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || !hasKeySelected}
                  className="bg-orange-600 text-white px-12 py-4 rounded-full font-black text-lg shadow-xl shadow-orange-600/30 hover:scale-105 transition-all disabled:opacity-50 disabled:scale-100 flex items-center"
                >
                  {isAnalyzing ? <><Loader2 className="animate-spin mr-3" /> ĐANG PHÂN TÍCH...</> : <><Wand2 className="mr-3"/> TẠO STORYBOARD</>}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-row">
            <div className="flex-1 flex flex-col overflow-hidden">
              <div style={{ height: previewHeight }} className="flex-shrink-0 bg-white dark:bg-black border-b border-zinc-200 dark:border-zinc-800 relative flex items-center justify-center overflow-hidden transition-colors">
                {selectedItem ? (
                  <div className="max-w-[85%] max-h-[85%] aspect-video bg-zinc-100 dark:bg-zinc-900 rounded-lg overflow-hidden shadow-2xl border dark:border-zinc-800 relative">
                    {selectedItem.data.imageUrl ? (
                      <img src={selectedItem.data.imageUrl} className="w-full h-full object-contain grayscale dark:brightness-90" />
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center p-12 text-center">
                        <Clapperboard size={32} className="text-zinc-300 mb-4 opacity-20" />
                        <p className="font-bold text-orange-600 text-sm uppercase tracking-widest">{selectedItem.data.type}</p>
                        <p className="italic text-zinc-500 text-sm mt-3 max-w-sm">"{selectedItem.data.description_vi}"</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center">
                    <Images size={48} className="text-zinc-200 dark:text-zinc-800 mx-auto mb-4" />
                    <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest opacity-50">Chọn một Shot trên timeline để xem</p>
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 h-1 cursor-row-resize bg-zinc-100 dark:bg-zinc-800 hover:bg-orange-500/50 transition-colors" onMouseDown={handleMouseDown} />
              </div>
              <div className="flex-1 relative">
                <Timeline items={timelineItems} onSelectItem={item => setSelectedItemId(item.id)} selectedItemId={selectedItemId} theme={theme} />
              </div>
              <div className="h-24 bg-zinc-50 dark:bg-zinc-950 border-t dark:border-zinc-900 p-2 overflow-y-auto custom-scrollbar font-mono text-[10px]">
                {logs.map((log, i) => (
                  <div key={i} className={`flex gap-2 ${log.type === 'error' ? 'text-red-500' : log.type === 'success' ? 'text-emerald-500' : 'text-zinc-500'}`}>
                    <span className="opacity-40 shrink-0">[{log.timestamp}]</span>
                    <span>{log.message}</span>
                  </div>
                ))}
                <div ref={logsEndRef} />
              </div>
            </div>
            <div className="w-96 bg-zinc-50 dark:bg-zinc-900 border-l dark:border-black shrink-0 transition-colors">
              <ShotDetails item={selectedItem} onClose={() => setSelectedItemId(undefined)} onGenerateImage={handleGenerateImage} onUpdateShot={handleUpdateShotData} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
