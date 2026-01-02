export interface Shot {
  id: string; // Unique ID for React keys
  type: string; // e.g., Wide, Close-up
  duration: number; // In seconds
  description_vi: string; // Visual description in Vietnamese
  prompt_en: string; // Generative AI prompt in English (Image)
  prompt_video_en: string; // Generative AI prompt in English (Video) with camera movement
  camera_movement?: string; // e.g., Pan, Tilt, Static
  imageUrl?: string; // Generated image URL
}

export interface Scene {
  id: string;
  scene_number: string;
  header: string; // e.g., EXT. PARK - DAY
  location: string;
  time: string;
  shots: Shot[];
}

export interface Act {
  id: string;
  title: string;
  scenes: Scene[];
}

export interface Character {
  name: string;
  description: string;
}

export interface ScriptAnalysis {
  title: string;
  genre: string;
  logline_vi: string;
  characters?: Character[];
  acts: Act[];
}

export interface TimelineTrack {
  id: string;
  name: string;
  type: 'video' | 'audio';
  items: TimelineItem[];
}

export interface TimelineItem {
  id: string;
  start: number; // Start time in seconds
  duration: number;
  data: Shot;
  sceneHeader: string;
}

export interface SavedProject {
  version: string;
  timestamp: string;
  scriptInput: string;
  analysisData: ScriptAnalysis | null;
  timelineItems: TimelineItem[];
}

export interface LogEntry {
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
}