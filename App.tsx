
import React, { useState, useRef, useEffect } from 'react';
import { analyzeScript, validateApiKey, generateShotImage } from './services/geminiService';
import { ScriptAnalysis, TimelineItem, SavedProject, LogEntry, Shot } from './types';
import { Timeline } from './components/Timeline';
import { ShotDetails } from './components/ShotDetails';
import { HelpModal } from './components/HelpModal';
import { Play, Loader2, FileText, Wand2, LayoutTemplate, Upload, Key, CheckCircle, AlertCircle, HelpCircle, Save, FolderOpen, Download, ImagePlus, StopCircle, FileOutput, Settings, X, GripHorizontal, Images, PlusCircle, TerminalSquare, ShieldAlert, Sun, Moon } from 'lucide-react';

const SAMPLE_SCRIPT = `CẢNH 1
EXT. BÃI PHẾ LIỆU CÔNG NGHỆ - NGÀY
TOÀN CẢNH. Giữa những đống kim loại gỉ sét khổng lồ của thành phố tương lai, một chú robot nhỏ tên BIT (hình dáng tròn trịa, mắt led xanh) đang đào bới. Bầu trời xám xịt, bụi bặm.

CẬN CẢNH. Tay robot chạm vào một vệt xanh lá le lói dưới lớp sắt vụn. Đó là một mầm cây nhỏ đang tỏa sáng.

CẢNH 2
EXT. BAN CÔNG NHÀ BIT - HOÀNG HÔN
TRUNG CẢNH. Bit cẩn thận đặt mầm cây vào một chiếc chậu làm từ vỏ lon cũ. Ánh nắng hoàng hôn màu cam cháy nhuộm đỏ những tòa tháp kim loại phía xa.

CẬN CẢNH BIT. Đôi mắt led của chú robot chuyển sang hình trái tim. Chú dùng một ngón tay kim loại chạm nhẹ vào chiếc lá bé xíu.

CẢNH 3
EXT. BAN CÔNG - ĐÊM
TOÀN CẢNH. Thành phố lên đèn với những bảng quảng cáo hologram xanh đỏ rực rỡ. Bit ngồi canh gác bên cạnh mầm cây.

CẬN CẢNH MẦM CÂY. Mầm cây bắt đầu phát ra những hạt bụi sáng lung linh, bay lơ lửng xung quanh Bit.

CẢNH 4
EXT. BAN CÔNG - BÌNH MINH (MƯA)
TRUNG CẢNH. Một cơn mưa axit xám xịt trút xuống. Bit bung chiếc ô rách nát, che chắn hoàn toàn cho cây nhỏ, mặc cho thân mình bị nước mưa làm hoen gỉ.

ĐẶC TẢ. Những giọt nước mưa chảy trên lớp vỏ kim loại của Bit, nhưng chú robot vẫn đứng im không nhúc nhích.

CẢNH 5
EXT. BAN CÔNG - NGÀY
TOÀN CẢNH. Mầm cây bất ngờ lớn nhanh như thổi, vươn cao khỏi ban công. Những tán lá xanh mướt bắt đầu bao phủ lấy mảng tường xám xịt.

CẬN CẢNH. Những đóa hoa màu trắng nhỏ xíu nở rộ, tỏa hương thơm giữa không gian đầy mùi dầu máy.

CẢNH 6
EXT. THÀNH PHỐ TƯƠ lượng TƯƠNG LAI - CHIỀU
TOÀN CẢNH TỪ TRÊN CAO. Cây thần của Bit đã cao lớn như một tòa tháp. Những sợi dây leo xanh mướt lan tỏa khắp các đường dây điện, bao phủ lấy những tòa nhà chọc trời.

CẬN CẢNH DÂN CƯ. Những cư dân thành phố (người máy và con người đeo mặt nạ) dừng lại, ngước nhìn lên sự kỳ diệu của thiên nhiên đang trở lại.

CẢNH 7
EXT. GỐC CÂY THẦN - HOÀNG HÔN
TRUNG CẢNH. Chim chóc và bướm bắt đầu xuất hiện, bay quanh tán cây. Bit đứng ở gốc cây, trông chú cũ kỹ và gỉ sét hơn nhưng rất hạnh phúc.

CẬN CẢNH. Một đứa bé tiến lại gần, tặng cho Bit một dải ruy băng màu đỏ.

CẢNH 8
EXT. TRÊN ĐỈNH CÂY THẦN - ĐÊM
TOÀN CẢNH. Bit ngồi trên một cành cây cao nhất, nhìn xuống thành phố giờ đây đã xanh mướt và rực rỡ sức sống. Bầu trời không còn xám xịt mà đầy sao.

CẬN CẢNH BIT. Chú robot nhắm mắt lại (led tắt dần), một nụ cười yên bình hiện lên trên gương mặt kim loại. Phim khép lại với hình ảnh mầm xanh vươn tới các vì sao.`;

const App: React.FC = () => {
  // Theme State
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // API Key & Settings
  const [apiKey, setApiKey] = useState('');
  const [isKeyValid, setIsKeyValid] = useState(false);
  const [isCheckingKey, setIsCheckingKey] = useState(false);
  const [apiStatus, setApiStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');

  // App Data
  const [scriptInput, setScriptInput] = useState(SAMPLE_SCRIPT);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisData, setAnalysisData] = useState<ScriptAnalysis | null>(null);
  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | undefined>(undefined);
  const [view, setView] = useState<'input' | 'timeline'>('input');
  
  // Layout State
  const [previewHeight, setPreviewHeight] = useState(400); 
  const isDraggingRef = useRef(false);

  // Batch Generation State
  const [isBatchGenerating, setIsBatchGenerating] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });
  const shouldStopBatchRef = useRef(false);

  // Logs
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const [showHelp, setShowHelp] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const projectInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  // Handle Theme Change
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Tự động kiểm tra API Key khi paste hoặc thay đổi (Debounce 1s)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (apiKey.trim().length > 10) {
        handleCheckKey();
      } else if (apiKey.trim() === '') {
        setApiStatus('idle');
        setIsKeyValid(false);
      }
    }, 1000);
    return () => clearTimeout(timeoutId);
  }, [apiKey]);

  const addLog = (message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') => {
      setLogs(prev => [...prev, {
          timestamp: new Date().toLocaleTimeString(),
          message,
          type
      }]);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDraggingRef.current) return;
    const newHeight = Math.max(200, Math.min(window.innerHeight - 200, e.clientY - 56));
    setPreviewHeight(newHeight);
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  const handleCheckKey = async () => {
    const cleanKey = apiKey.trim();
    if (!cleanKey) return;
    
    setIsCheckingKey(true);
    setApiStatus('checking');
    
    const isValid = await validateApiKey(cleanKey);
    setIsCheckingKey(false);
    
    if (isValid) {
      setIsKeyValid(true);
      setApiStatus('valid');
      addLog("API Key hợp lệ.", "success");
    } else {
      setIsKeyValid(false);
      setApiStatus('invalid');
      addLog("API Key không hợp lệ.", "error");
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        const text = e.target?.result;
        if (typeof text === 'string') {
            setScriptInput(text);
            addLog(`Đã tải file kịch bản: ${file.name}`, "success");
        }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const handleSaveProject = () => {
    if (!analysisData && timelineItems.length === 0) return;
    const projectData: SavedProject = {
        version: "1.0",
        timestamp: new Date().toISOString(),
        scriptInput,
        analysisData,
        timelineItems
    };
    const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const fileName = analysisData?.title 
        ? `${analysisData.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_project.json`
        : 'sketch_ai_project.json';
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    addLog(`Đã lưu dự án: ${fileName}`, "success");
  };

  const handleLoadProject = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
          try {
              const text = e.target?.result;
              if (typeof text === 'string') {
                  const data = JSON.parse(text) as SavedProject;
                  if (data.version && data.timelineItems) {
                      setScriptInput(data.scriptInput || '');
                      setAnalysisData(data.analysisData || null);
                      setTimelineItems(data.timelineItems || []);
                      setView(data.timelineItems.length > 0 ? 'timeline' : 'input');
                      addLog(`Đã mở dự án thành công: ${file.name}`, "success");
                  }
              }
          } catch (err) {
              addLog("Lỗi khi đọc file dự án", "error");
          }
      };
      reader.readAsText(file);
      event.target.value = '';
  };

  const handleExportPDF = async () => {
    if (!analysisData || timelineItems.length === 0) return;
    addLog("Đang chuẩn bị dữ liệu xuất PDF...", "info");
    
    try {
        const { jsPDF } = (window as any).jspdf;
        const doc = new jsPDF('p', 'mm', 'a4'); 
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        
        // 1. TRANG BÌA
        doc.setFillColor(9, 9, 11); // Dark cover regardless of theme
        doc.rect(0, 0, pageWidth, pageHeight, 'F');
        
        doc.setFillColor(249, 115, 22); 
        doc.rect(0, 40, pageWidth, 2, 'F');
        
        doc.setTextColor(249, 115, 22);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text("OFFICIAL STORYBOARD DOCUMENT", pageWidth / 2, 35, { align: "center" });

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(36);
        doc.text("SKETCH AI STORYBOARD", pageWidth / 2, 70, { align: "center" });
        
        doc.setFontSize(18);
        doc.setTextColor(161, 161, 170);
        doc.text(analysisData.title.toUpperCase(), pageWidth / 2, 85, { align: "center" });
        
        doc.setFontSize(10);
        doc.text(`GENRE: ${analysisData.genre.toUpperCase()}`, pageWidth / 2, 95, { align: "center" });

        doc.setDrawColor(39, 39, 42); 
        doc.line(40, 110, pageWidth - 40, 110);
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(12);
        const logline = analysisData.logline_vi || "";
        const splitLogline = doc.splitTextToSize(logline, pageWidth - 80);
        doc.text(splitLogline, pageWidth / 2, 120, { align: "center" });

        doc.setFontSize(9);
        doc.setTextColor(113, 113, 122);
        doc.text(`DATE: ${new Date().toLocaleDateString()}`, pageWidth / 2, pageHeight - 20, { align: "center" });

        // 2. TRANG NỘI DUNG SHOTS
        let currentY = 20;
        const margin = 20;
        const shotHeight = 65; 
        const shotsPerPage = 3;

        timelineItems.forEach((item, index) => {
            if (index % shotsPerPage === 0) {
                doc.addPage();
                doc.setFillColor(255, 255, 255);
                doc.rect(0, 0, pageWidth, pageHeight, 'F');
                
                doc.setFillColor(24, 24, 27);
                doc.rect(0, 0, pageWidth, 15, 'F');
                doc.setTextColor(255, 255, 255);
                doc.setFontSize(8);
                doc.text(`SKETCH AI STORYBOARD - ${analysisData.title.toUpperCase()}`, margin, 10);
                doc.text(`PAGE ${doc.internal.getNumberOfPages() - 1}`, pageWidth - margin, 10, { align: "right" });
                currentY = 25;
            }

            doc.setDrawColor(228, 228, 231); 
            doc.setLineWidth(0.1);
            doc.rect(margin, currentY, pageWidth - (margin * 2), shotHeight);

            const thumbW = 80;
            const thumbH = 45;
            doc.setFillColor(244, 244, 245);
            doc.rect(margin + 5, currentY + 5, thumbW, thumbH, 'F');
            
            if (item.data.imageUrl) {
                try {
                    doc.addImage(item.data.imageUrl, 'PNG', margin + 5, currentY + 5, thumbW, thumbH);
                } catch (e) { console.error(e); }
            } else {
                doc.setTextColor(161, 161, 170);
                doc.setFontSize(8);
                doc.text("NO SKETCH", margin + 5 + (thumbW/2), currentY + 5 + (thumbH/2), { align: "center" });
            }

            const textX = margin + thumbW + 10;
            doc.setTextColor(249, 115, 22);
            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.text(`SHOT #${index + 1}`, textX, currentY + 10);
            
            doc.setTextColor(24, 24, 27);
            doc.setFontSize(8);
            doc.text(`${item.data.type} | ${item.duration}s | ${item.data.camera_movement || 'Static'}`, textX, currentY + 16);

            doc.setFont("helvetica", "normal");
            doc.setTextColor(82, 82, 91);
            const desc = item.data.description_vi || "";
            const splitDesc = doc.splitTextToSize(desc, pageWidth - textX - margin - 5);
            doc.text(splitDesc, textX, currentY + 22);
            
            doc.setFontSize(7);
            doc.setTextColor(161, 161, 170);
            doc.text(item.sceneHeader, textX, currentY + shotHeight - 5);

            currentY += shotHeight + 5;
        });

        doc.save(`SKETCH_AI_STORYBOARD_${analysisData.title.replace(/\s+/g, '_')}.pdf`);
        addLog("Đã xuất toàn bộ phân cảnh ra file PDF.", "success");
    } catch (error: any) {
        addLog(`Lỗi xuất PDF: ${error.message}`, "error");
    }
  };

  const handleAnalyze = async () => {
    if (!isKeyValid) {
        addLog("Vui lòng nhập API Key hợp lệ.", "warning");
        return;
    }
    if (!scriptInput.trim()) return;
    setIsAnalyzing(true);
    addLog("AI đang phác thảo cấu trúc kịch bản...", "info");
    try {
      const data = await analyzeScript(scriptInput, apiKey.trim());
      setAnalysisData(data);
      const items: TimelineItem[] = [];
      let currentTime = 0;
      data.acts.forEach(act => {
        act.scenes.forEach(scene => {
            scene.shots.forEach(shot => {
                items.push({
                    id: shot.id,
                    start: currentTime,
                    duration: shot.duration,
                    data: shot,
                    sceneHeader: scene.header
                });
                currentTime += shot.duration;
            });
        });
      });
      setTimelineItems(items);
      setView('timeline');
      addLog(`Phân tích xong: ${items.length} shot quay.`, "success");
    } catch (err) {
      addLog("Phân tích thất bại.", "error");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleUpdateShotData = (updates: Partial<Shot>) => {
    if (!selectedItemId) return;
    setTimelineItems(prev => {
        const idx = prev.findIndex(i => i.id === selectedItemId);
        if (idx === -1) return prev;
        const newItems = [...prev];
        newItems[idx] = { ...newItems[idx], data: { ...newItems[idx].data, ...updates } };
        return newItems;
    });
  };

  const handleGenerateImage = async (aspectRatio: string = "16:9", resolution: string = "1K") => {
      if (!isKeyValid || !selectedItemId) return;
      const idx = timelineItems.findIndex(i => i.id === selectedItemId);
      if (idx === -1) return;
      addLog(`Đang vẽ phác thảo Shot ${idx + 1}...`, "info");
      try {
          const imageUrl = await generateShotImage(timelineItems[idx].data.prompt_en, apiKey.trim(), analysisData?.characters, aspectRatio, resolution);
          if (imageUrl) {
              const newItems = [...timelineItems];
              newItems[idx] = { ...newItems[idx], data: { ...newItems[idx].data, imageUrl } };
              setTimelineItems(newItems);
              addLog(`Đã vẽ xong Shot ${idx + 1}`, "success");
          }
      } catch (error: any) {
          addLog(`Lỗi vẽ ảnh: ${error.message}`, "error");
      }
  };

  const handleBatchGenerateImages = async () => {
    if (!isKeyValid) return;
    const itemsToProcess = timelineItems.filter(item => !item.data.imageUrl);
    if (itemsToProcess.length === 0) return;
    setIsBatchGenerating(true);
    shouldStopBatchRef.current = false;
    setBatchProgress({ current: 0, total: itemsToProcess.length });
    for (let i = 0; i < itemsToProcess.length; i++) {
        if (shouldStopBatchRef.current) break;
        const item = itemsToProcess[i];
        try {
            const imageUrl = await generateShotImage(item.data.prompt_en, apiKey.trim(), analysisData?.characters, "16:9", "1K");
            if (imageUrl) {
                setTimelineItems(prev => {
                    const newItems = [...prev];
                    const idx = newItems.findIndex(t => t.id === item.id);
                    if (idx !== -1) newItems[idx] = { ...newItems[idx], data: { ...newItems[idx].data, imageUrl } };
                    return newItems;
                });
            }
        } catch (e) {}
        setBatchProgress(prev => ({ ...prev, current: i + 1 }));
        if (i < itemsToProcess.length - 1) await new Promise(r => setTimeout(r, 4000));
    }
    setIsBatchGenerating(false);
    addLog("Hoàn tất vẽ phác thảo hàng loạt.", "success");
  };

  const selectedItem = timelineItems.find(i => i.id === selectedItemId) || null;

  return (
    <div className="h-screen w-screen bg-white dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 flex flex-col overflow-hidden transition-colors duration-300">
      <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} theme={theme} />
      <input type="file" accept=".json" ref={projectInputRef} className="hidden" onChange={handleLoadProject} />

      <header className="h-16 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex items-center relative px-4 shrink-0 z-50 shadow-sm dark:shadow-lg justify-between transition-colors">
        <div className="flex items-center space-x-3 w-1/4">
            <div className="bg-orange-600 p-1.5 rounded-lg shadow-lg shadow-orange-600/20">
                <Images size={20} className="text-white" />
            </div>
            <h1 className="text-lg font-black tracking-tighter whitespace-nowrap hidden md:block uppercase">SKETCH <span className="text-orange-500 font-light">AI STORYBOARD</span></h1>
        </div>
        
        <div className="flex-1 flex justify-center px-4">
             {analysisData?.title && (
                 <h2 className="text-sm md:text-lg font-bold tracking-tight text-zinc-500 dark:text-zinc-400 uppercase text-center truncate bg-zinc-100 dark:bg-black/40 px-3 py-1 rounded-full border border-zinc-200 dark:border-zinc-800">
                     {analysisData.title}
                 </h2>
             )}
        </div>
        
        <div className="flex items-center justify-end space-x-2 w-auto md:w-2/5">
             {/* Theme Toggle */}
             <button 
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="p-2 mr-2 text-zinc-500 hover:text-orange-500 bg-zinc-100 dark:bg-zinc-800 rounded-lg transition-colors border border-zinc-200 dark:border-zinc-700"
                title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
             >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
             </button>

             {/* API Status UI */}
             <div className="flex items-center bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-1.5 transition-all focus-within:border-orange-500/50">
                <div className="flex items-center mr-3">
                    {apiStatus === 'idle' && <ShieldAlert size={14} className="text-zinc-400 dark:text-zinc-600" />}
                    {apiStatus === 'checking' && <Loader2 size={14} className="animate-spin text-orange-500" />}
                    {apiStatus === 'valid' && <CheckCircle size={14} className="text-emerald-500" />}
                    {apiStatus === 'invalid' && <AlertCircle size={14} className="text-red-500" />}
                    <span className={`ml-2 text-[10px] font-bold uppercase hidden lg:block ${
                        apiStatus === 'valid' ? 'text-emerald-500' : 
                        apiStatus === 'invalid' ? 'text-red-500' : 
                        apiStatus === 'checking' ? 'text-orange-500' : 'text-zinc-400 dark:text-zinc-500'
                    }`}>
                        {apiStatus === 'valid' ? 'Hợp lệ' : apiStatus === 'invalid' ? 'Lỗi Key' : apiStatus === 'checking' ? 'Đang check' : 'Chưa nhập'}
                    </span>
                </div>
                <input 
                    type="password" 
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Gemini API Key..."
                    className="bg-transparent border-none text-xs text-zinc-900 dark:text-zinc-200 focus:ring-0 outline-none w-24 md:w-40 placeholder-zinc-400 dark:placeholder-zinc-700 font-mono"
                />
             </div>

             {view === 'timeline' ? (
                 <>
                    {isBatchGenerating ? (
                        <button onClick={() => shouldStopBatchRef.current = true} className="flex items-center gap-2 bg-red-900/10 dark:bg-red-900/30 hover:bg-red-900/20 dark:hover:bg-red-900/50 text-red-600 dark:text-red-200 px-3 py-1.5 rounded-lg text-xs font-medium border border-red-200 dark:border-red-800 transition-colors">
                            <StopCircle size={14}/> <span>{batchProgress.current}/{batchProgress.total}</span>
                        </button>
                    ) : (
                        <button onClick={handleBatchGenerateImages} className="flex items-center gap-2 bg-orange-600 hover:bg-orange-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-lg shadow-orange-600/20 transition-all">
                            <Wand2 size={14}/> <span className="hidden md:inline">Sketch All</span>
                        </button>
                    )}
                    <button onClick={handleExportPDF} className="p-2 text-zinc-500 dark:text-zinc-400 hover:text-orange-500 dark:hover:text-white bg-zinc-100 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700" title="Xuất PDF"><FileOutput size={16}/></button>
                    <button onClick={handleSaveProject} className="p-2 text-zinc-500 dark:text-zinc-400 hover:text-orange-500 dark:hover:text-white bg-zinc-100 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700" title="Lưu dự án"><Save size={16}/></button>
                    <button onClick={() => setView('input')} className="p-2 text-orange-500 hover:bg-orange-500/10 bg-zinc-100 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700"><PlusCircle size={16}/></button>
                 </>
            ) : (
                <button onClick={() => projectInputRef.current?.click()} className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 px-3 py-1.5 rounded-lg text-xs font-medium border border-zinc-200 dark:border-zinc-700">
                    <FolderOpen size={14} /> Open
                </button>
            )}
             <button onClick={() => setShowHelp(true)} className="text-zinc-400 hover:text-orange-500 dark:text-zinc-500 dark:hover:text-white p-1.5"><HelpCircle size={20} /></button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {view === 'input' && (
          <div className="flex-1 flex flex-col items-center justify-center p-6 bg-zinc-50 dark:bg-[#09090b] overflow-y-auto transition-colors">
            <div className="w-full max-w-4xl flex flex-col h-[80vh]">
                <div className="text-center mb-10">
                    <div className="inline-block bg-orange-600/10 border border-orange-500/20 px-3 py-1 rounded-full text-orange-500 text-xs font-bold tracking-widest uppercase mb-4">
                        Professional Storyboard Creator
                    </div>
                    <h2 className="text-5xl font-black text-zinc-900 dark:text-white mb-3 tracking-tighter leading-tight">VẼ PHÁC THẢO <br/> KỊCH BẢN VỚI AI</h2>
                    <p className="text-zinc-500 dark:text-zinc-400 max-w-lg mx-auto">Tự động hóa quy trình tiền kỳ: Chia shot, tạo timeline và vẽ storyboard dạng sketch chuyên nghiệp.</p>
                </div>

                <div className="flex-1 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col overflow-hidden shadow-xl dark:shadow-2xl relative transition-colors">
                    <div className="bg-zinc-50 dark:bg-zinc-800/50 px-4 py-2.5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
                        <span>Nhập kịch bản phân cảnh</span>
                        <button onClick={() => fileInputRef.current?.click()} className="hover:text-orange-500 flex items-center transition-colors"><Upload size={12} className="mr-1"/> TẢI FILE (.TXT)</button>
                        <input type="file" accept=".txt" ref={fileInputRef} className="hidden" onChange={handleFileUpload}/>
                    </div>
                    <textarea
                        className="flex-1 bg-transparent p-8 font-mono text-sm text-zinc-800 dark:text-zinc-300 resize-none focus:outline-none leading-relaxed custom-scrollbar"
                        placeholder="Dán nội dung kịch bản của bạn vào đây (Cảnh 1, INT. PHÒNG KHÁCH...)"
                        value={scriptInput}
                        onChange={(e) => setScriptInput(e.target.value)}
                        spellCheck={false}
                    />
                    {!isKeyValid && (
                        <div className="absolute inset-0 bg-white/60 dark:bg-black/60 backdrop-blur-[4px] flex flex-col items-center justify-center z-10 p-6 text-center transition-colors">
                            <div className="w-16 h-16 bg-zinc-50 dark:bg-zinc-800 rounded-2xl flex items-center justify-center mb-6 border border-zinc-200 dark:border-zinc-700">
                                <Key size={32} className="text-zinc-300 dark:text-zinc-500"/>
                            </div>
                            <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">Yêu cầu Gemini API Key</h3>
                            <p className="text-zinc-500 dark:text-zinc-400 mb-8 max-w-xs text-sm">Nhập mã API Key vào góc trên bên phải để bắt đầu sử dụng trí tuệ nhân tạo.</p>
                        </div>
                    )}
                </div>

                <div className="mt-10 flex justify-center">
                    <button
                        onClick={handleAnalyze}
                        disabled={isAnalyzing || !scriptInput.trim() || !isKeyValid}
                        className={`
                            flex items-center px-12 py-4 rounded-full text-lg font-black tracking-tight shadow-xl transition-all
                            ${isAnalyzing || !isKeyValid
                                ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 cursor-not-allowed border border-zinc-300 dark:border-zinc-700' 
                                : 'bg-orange-600 text-white hover:bg-orange-500 hover:scale-105 hover:shadow-orange-600/40'
                            }
                        `}
                    >
                        {isAnalyzing ? <><Loader2 className="animate-spin mr-3"/> ĐANG PHÂN TÍCH...</> : <><Wand2 className="mr-3"/> TẠO STORYBOARD NGAY</>}
                    </button>
                </div>
            </div>
          </div>
        )}

        {view === 'timeline' && (
            <div className="flex-1 flex flex-row overflow-hidden w-full transition-colors">
                <div className="flex-1 flex flex-col min-w-0 bg-zinc-50 dark:bg-black transition-colors">
                     <div style={{ height: previewHeight }} className="flex-shrink-0 bg-white dark:bg-zinc-950 relative flex items-center justify-center overflow-hidden border-b border-zinc-200 dark:border-zinc-800 transition-colors">
                        {selectedItem ? (
                             <div className="w-full h-full p-4 flex items-center justify-center">
                                <div className="max-w-full max-h-full aspect-video bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl dark:shadow-2xl relative flex items-center justify-center overflow-hidden group">
                                    {selectedItem.data.imageUrl ? (
                                        <img src={selectedItem.data.imageUrl} className="w-full h-full object-contain grayscale dark:brightness-90" alt="preview" />
                                    ) : (
                                        <div className="text-center p-8">
                                            <h3 className="text-lg font-bold text-zinc-700 dark:text-zinc-300 mb-1">{selectedItem.sceneHeader}</h3>
                                            <p className="text-orange-500 text-xs font-bold uppercase mb-4">{selectedItem.data.type}</p>
                                            <p className="text-zinc-500 italic text-sm max-w-sm">"{selectedItem.data.description_vi}"</p>
                                        </div>
                                    )}
                                </div>
                             </div>
                        ) : (
                            <div className="text-zinc-300 dark:text-zinc-800 flex flex-col items-center select-none">
                                <Images size={64} className="mb-4 opacity-10" />
                                <p className="text-xs font-bold uppercase tracking-widest opacity-30">Chọn một Shot để xem</p>
                            </div>
                        )}
                     </div>

                     <div className="h-1 bg-zinc-200 dark:bg-zinc-800 cursor-row-resize hover:bg-orange-600 transition-colors z-20 flex items-center justify-center" onMouseDown={handleMouseDown}>
                         <div className="w-8 h-0.5 bg-zinc-300 dark:bg-zinc-700 rounded-full"></div>
                     </div>

                     <div className="flex-1 min-h-0 relative">
                        <Timeline items={timelineItems} onSelectItem={(i) => setSelectedItemId(i.id)} selectedItemId={selectedItemId} theme={theme} />
                     </div>

                     <div className="h-32 bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-900 flex flex-col shrink-0 transition-colors">
                         <div className="px-3 py-1.5 bg-zinc-50 dark:bg-zinc-900 flex items-center text-[9px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest border-b border-zinc-200 dark:border-black">
                             <TerminalSquare size={12} className="mr-2 text-orange-500"/> Sketch System Logs
                         </div>
                         <div className="flex-1 overflow-y-auto p-3 font-mono text-[10px] space-y-1 custom-scrollbar">
                             {logs.map((log, i) => (
                                 <div key={i} className={log.type === 'error' ? 'text-red-500 dark:text-red-400' : log.type === 'success' ? 'text-emerald-600 dark:text-emerald-400' : log.type === 'warning' ? 'text-orange-600 dark:text-orange-400' : 'text-zinc-500 dark:text-zinc-500'}>
                                     <span className="opacity-40 mr-2">{log.timestamp}</span> {log.message}
                                 </div>
                             ))}
                             <div ref={logsEndRef} />
                         </div>
                     </div>
                </div>

                <div className="w-96 bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-black flex flex-col flex-shrink-0 z-30 shadow-xl transition-colors">
                    <ShotDetails item={selectedItem} onClose={() => setSelectedItemId(undefined)} onGenerateImage={handleGenerateImage} onUpdateShot={handleUpdateShotData} />
                </div>
            </div>
        )}
      </main>
    </div>
  );
};

export default App;
