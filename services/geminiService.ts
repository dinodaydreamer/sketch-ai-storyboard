
import { GoogleGenAI, Type } from "@google/genai";
import { ScriptAnalysis } from "../types";

const scriptSchema: any = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    genre: { type: Type.STRING },
    logline_vi: { type: Type.STRING },
    characters: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          description: { type: Type.STRING }
        },
        required: ["name", "description"]
      }
    },
    acts: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          scenes: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                scene_number: { type: Type.STRING },
                header: { type: Type.STRING },
                location: { type: Type.STRING },
                time: { type: Type.STRING },
                shots: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      type: { type: Type.STRING },
                      duration: { type: Type.NUMBER },
                      description_vi: { type: Type.STRING },
                      camera_movement: { type: Type.STRING },
                      prompt_en: { type: Type.STRING },
                      prompt_video_en: { type: Type.STRING }
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

export const validateApiKey = async (key: string): Promise<boolean> => {
  try {
    const ai = new GoogleGenAI({ apiKey: key });
    await ai.models.generateContent({
      model: "gemini-3-flash-lite-latest",
      contents: "ping",
    });
    return true;
  } catch (e) {
    return false;
  }
};

export const analyzeScript = async (scriptText: string, apiKey: string): Promise<ScriptAnalysis> => {
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: `Phân tích kịch bản thành cấu trúc Acts/Scenes/Shots. Trả về JSON. Kịch bản: ${scriptText}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: scriptSchema,
    }
  });

  const data = JSON.parse(response.text) as ScriptAnalysis;
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
};

export const generateShotImage = async (
  prompt: string, 
  apiKey: string,
  characters?: {name: string, description: string}[],
  aspectRatio: string = "16:9"
): Promise<string | null> => {
  const ai = new GoogleGenAI({ apiKey });
  const finalPrompt = `Movie storyboard sketch, rough pencil drawing, cinematic: ${prompt}`;
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: { parts: [{ text: finalPrompt }] },
    config: { imageConfig: { aspectRatio: aspectRatio as any } },
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
  }
  return null;
};
