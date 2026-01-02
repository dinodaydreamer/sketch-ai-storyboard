import { GoogleGenAI, Type, Schema } from "@google/genai";
import { ScriptAnalysis } from "../types";

const scriptSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "Tên kịch bản" },
    genre: { type: Type.STRING, description: "Thể loại phim" },
    logline_vi: { type: Type.STRING, description: "Tóm tắt nội dung bằng tiếng Việt (1 câu)" },
    characters: {
      type: Type.ARRAY,
      description: "Danh sách nhân vật chính và mô tả ngoại hình",
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          description: { type: Type.STRING, description: "Mô tả ngoại hình chi tiết (Visual description)" }
        },
        required: ["name", "description"]
      }
    },
    acts: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: "Tên Hồi (Hồi 1, Hồi 2...)" },
          scenes: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                scene_number: { type: Type.STRING },
                header: { type: Type.STRING, description: "Tiêu đề cảnh (VD: INT. PHÒNG KHÁCH - NGÀY)" },
                location: { type: Type.STRING },
                time: { type: Type.STRING },
                shots: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      type: { type: Type.STRING, description: "Cỡ cảnh: Toàn (Wide), Trung (Medium), Cận (Close-up), Đặc tả (ECU), v.v." },
                      duration: { type: Type.NUMBER, description: "Thời lượng ước tính (giây) dựa trên hành động/hội thoại" },
                      description_vi: { type: Type.STRING, description: "Mô tả chi tiết hình ảnh shot quay bằng Tiếng Việt" },
                      camera_movement: { type: Type.STRING, description: "Chuyển động máy: Tĩnh (Static), Pan, Tilt, Dolly, Handheld, Tracking, Crane shot, v.v." },
                      prompt_en: { type: Type.STRING, description: "Prompt tạo ẢNH Storyboard. Format: '[Shot Type], [Subject], [Action], [Environment]'" },
                      prompt_video_en: { type: Type.STRING, description: "Prompt tạo VIDEO (Runway/Sora). Format: 'Cinematic video of [Action/Subject], [Specific Camera Movement], [Mood]...'" }
                    },
                    required: ["type", "duration", "description_vi", "prompt_en", "prompt_video_en", "camera_movement"]
                  }
                }
              },
              required: ["scene_number", "header", "location", "time", "shots"]
            }
          }
        },
        required: ["title", "scenes"]
      }
    }
  },
  required: ["title", "genre", "logline_vi", "acts"]
};

export const validateApiKey = async (apiKey: string): Promise<boolean> => {
  try {
    const cleanKey = apiKey.trim();
    if (!cleanKey || /[^\x20-\x7E]/.test(cleanKey)) {
        console.error("API Key contains invalid characters");
        return false;
    }

    const ai = new GoogleGenAI({ apiKey: cleanKey });
    await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Test connection",
    });
    return true;
  } catch (error) {
    console.error("API Key validation failed:", error);
    return false;
  }
};

export const analyzeScript = async (scriptText: string, apiKey: string): Promise<ScriptAnalysis> => {
  try {
    const cleanKey = apiKey.trim();
    const ai = new GoogleGenAI({ apiKey: cleanKey });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Phân tích kịch bản sau đây. Hãy chia nhỏ nó thành cấu trúc 3 Hồi (Acts), các Cảnh (Scenes) và từng Cú máy (Shots) để dựng phim.
      
      QUAN TRỌNG VỀ VIDEO PROMPT:
      - Trường 'prompt_video_en' phải được tối ưu cho việc tạo video AI.
      - NÓ BẮT BUỘC PHẢI CHỨA loại chuyển động máy (Camera Movement) mà bạn xác định cho shot đó.
      
      QUAN TRỌNG VỀ HÌNH ẢNH (STORYBOARD STYLE):
      - Prompt Tiếng Anh (prompt_en) phải mô tả cảnh quay dưới dạng phác thảo Storyboard.
      
      QUAN TRỌNG VỀ NHÂN VẬT:
      - Trích xuất danh sách nhân vật và mô tả ngoại hình của họ.
      
      Nội dung kịch bản / Storyboard:
      ${scriptText}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: scriptSchema,
        systemInstruction: "Bạn là một trợ lý đạo diễn và biên tập viên phim chuyên nghiệp. Nhiệm vụ của bạn là phân tích kịch bản thành danh sách shot quay (shot list) chi tiết.",
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("Không nhận được phản hồi từ AI");
    }
    
    // Parse JSON
    const data = JSON.parse(text) as ScriptAnalysis;
    
    // Post-process IDs
    data.acts.forEach((act, aIdx) => {
        act.id = `act-${aIdx}`;
        act.scenes.forEach((scene, sIdx) => {
            scene.id = `scene-${aIdx}-${sIdx}`;
            scene.shots.forEach((shot, shIdx) => {
                shot.id = `shot-${aIdx}-${sIdx}-${shIdx}`;
            });
        });
    });

    return data;
  } catch (error) {
    console.error("Analysis failed:", error);
    throw error;
  }
};

export const generateShotImage = async (
    prompt: string, 
    apiKey: string, 
    characters?: {name: string, description: string}[],
    aspectRatio: string = "16:9",
    resolution: string = "1K"
): Promise<string | null> => {
  try {
    const cleanKey = apiKey.trim();
    const ai = new GoogleGenAI({ apiKey: cleanKey });
    
    // --- FORCE SKETCH STYLE PROMPT & SINGLE IMAGE ---
    let finalPrompt = `Create a SINGLE, FULL-FRAME movie storyboard sketch based on the description below.
    
    VISUAL STYLE:
    - Rough pencil drawing, black and white, loose lines.
    - High contrast, cinematic lighting, dramatic composition.
    - Concept art style.
    
    CRITICAL CONSTRAINT:
    - Generate EXACTLY ONE image that fills the entire frame.
    - DO NOT create a grid, split-screen, comic strip layout, or multiple panels.
    - DO NOT include text bubbles or UI elements.
    
    SCENE DESCRIPTION: ${prompt}`;
    
    if (characters && characters.length > 0) {
        const charDesc = characters.map(c => `${c.name}: ${c.description}`).join('; ');
        finalPrompt += `\n\nCHARACTER CONTEXT (Maintain visual consistency): ${charDesc}`;
    }

    // Using gemini-3-pro-image-preview for high quality generation
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-image-preview",
      contents: {
        parts: [{ text: finalPrompt }],
      },
      config: {
        imageConfig: {
            aspectRatio: aspectRatio,
            imageSize: resolution
        }
      }
    });

    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
    }
    return null;
  } catch (error) {
    console.error("Image generation failed:", error);
    throw error;
  }
};