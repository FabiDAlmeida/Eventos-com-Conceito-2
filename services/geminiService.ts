
import { GoogleGenAI, Type } from "@google/genai";
import { MODELS } from "../constants";

const getClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

async function withRetry<T>(fn: () => Promise<T>, retries = 2, delay = 2000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const isQuotaError = error?.status === 'RESOURCE_EXHAUSTED' || error?.message?.toLowerCase().includes('quota') || error?.message?.includes('429');
    const isTransientError = error?.status === 'INTERNAL' || error?.status === 'UNAVAILABLE' || error?.message?.includes('500');
    if ((isQuotaError || isTransientError) && retries > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
      return withRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
}

export const geminiService = {
  // Existing method for generating crest options with creative variations
  async generateCrestOptions(initials: string, hostName: string, eventType: string, palette: any, symbols: string, forbidden: string, selectedStyle?: string) {
    return withRetry(async () => {
      const ai = getClient();
      
      const styleInstruction = selectedStyle 
        ? `O usuário selecionou o estilo "${selectedStyle}". Gere 6 variações visuais totalmente diferentes entre si DENTRO desta linguagem.`
        : `Gere EXATAMENTE 6 opções, uma para cada direção obrigatória: 
           1. CLÁSSICO: Escudo, monograma serifado, ornamentos simétricos.
           2. MODERNO: Geometria, linhas limpas, minimalismo premium.
           3. CONTEMPORÂNEO: Mix clássico/atual, tipografia editorial.
           4. MINIMALISTA: Espaço negativo, moldura finíssima, zero excesso.
           5. ROMÂNTICO: Curvas suaves, arabescos leves, orgânico.
           6. GÓTICO: Blackletter, dramático, elegante, linhas angulares.`;

      const response = await ai.models.generateContent({
        model: MODELS.TEXT,
        contents: `Você é um Diretor de Arte Sênior especializado em Identidade Visual de Eventos de Luxo.
        Iniciais: "${initials}". Anfitrião: "${hostName}". Tipo: "${eventType}".
        Paleta: ${JSON.stringify(palette)}. Símbolos: "${symbols}". Proibido: "${forbidden}".

        ${styleInstruction}

        REGRAS TÉCNICAS:
        - Cada opção deve ter uma estrutura, moldura e tipografia ÚNICA. Proibido repetir lógica visual entre os 6.
        - Estilo Vetor/Logo flat, fundo branco puro.
        - Em eventos corporativos, use linguagem institucional (sem coroas).
        - Prompts de imagem devem ser em INGLÊS, altamente detalhados para IA de imagem.

        Retorne JSON seguindo o schema crest_generation.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              concept_summary: { type: Type.STRING },
              usage_guide: { type: Type.ARRAY, items: { type: Type.STRING } },
              options: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    style_name: { type: Type.STRING },
                    visual_prompt: { type: Type.STRING },
                    description: { type: Type.STRING },
                    usage_suggestion: { type: Type.STRING }
                  },
                  required: ["style_name", "visual_prompt", "description", "usage_suggestion"]
                }
              }
            }
          }
        }
      });
      return JSON.parse(response.text || '{}');
    });
  },

  // Existing method for generating crest images
  async generateCrestImage(prompt: string, colorStyle: 'default' | 'gold' | 'black' | 'white' = 'default') {
    return withRetry(async () => {
      const ai = getClient();
      let finalPrompt = `${prompt} | Isolated on pure white background, symmetrical logo, professional vector branding, flat graphics.`;
      
      if (colorStyle === 'gold') finalPrompt += " | Metallic 3D embossed gold foil texture, luxury high shine gold.";
      else if (colorStyle === 'black') finalPrompt += " | Solid flat black silhouette, high contrast.";
      else if (colorStyle === 'white') finalPrompt += " | Solid flat white silhouette on pure black background.";

      const response = await ai.models.generateContent({
        model: MODELS.IMAGE_FLASH,
        contents: { parts: [{ text: finalPrompt }] },
        config: { imageConfig: { aspectRatio: "1:1" } }
      });
      const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
      return part ? `data:image/png;base64,${part.inlineData.data}` : '';
    });
  },

  // Existing method for generating crest variations
  async generateCrestVariations(base64Image: string, editPrompt: string) {
    return withRetry(async () => {
      const ai = getClient();
      const response = await ai.models.generateContent({
        model: MODELS.IMAGE_FLASH,
        contents: {
          parts: [
            { inlineData: { data: base64Image.split(',')[1] || base64Image, mimeType: 'image/png' } },
            { text: `Create a slight visual variation of this logo based on: ${editPrompt}. Maintain core structure but adjust minor ornaments and spacing. Pure white background.` }
          ]
        }
      });
      const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
      return part ? `data:image/png;base64,${part.inlineData.data}` : '';
    });
  },

  // Existing method for transforming crest variants
  async transformCrestVariant(base64Image: string, variant: 'gold' | 'black') {
    return withRetry(async () => {
      const ai = getClient();
      const instruction = variant === 'gold' 
        ? "Apply metallic 3D embossed gold foil texture to this logo. Luxury gold."
        : "Convert this logo to solid flat black, high contrast.";
      const response = await ai.models.generateContent({
        model: MODELS.IMAGE_FLASH,
        contents: {
          parts: [
            { inlineData: { data: base64Image.split(',')[1] || base64Image, mimeType: 'image/png' } },
            { text: instruction }
          ]
        }
      });
      const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
      return part ? `data:image/png;base64,${part.inlineData.data}` : '';
    });
  },

  // Fix analyzeAsset: Analyzing space photos to extract design constraints and styles
  async analyzeAsset(base64: string, mimeType: string) {
    return withRetry(async () => {
      const ai = getClient();
      const response = await ai.models.generateContent({
        model: MODELS.TEXT,
        contents: {
          parts: [
            { inlineData: { data: base64.split(',')[1] || base64, mimeType } },
            { text: "Analyze this image for an event decoration project. Provide a summary, a list of detected styles, key elements, constraints, potential risks, and suggested questions for the client." }
          ]
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              detected_style: { type: Type.ARRAY, items: { type: Type.STRING } },
              key_elements: { type: Type.ARRAY, items: { type: Type.STRING } },
              constraints: { type: Type.ARRAY, items: { type: Type.STRING } },
              risks: { type: Type.ARRAY, items: { type: Type.STRING } },
              suggested_questions: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["summary", "detected_style", "key_elements", "constraints", "risks", "suggested_questions"]
          }
        }
      });
      return JSON.parse(response.text || '{}');
    });
  },

  // Fix transcribeAudioToDirectives: Transcribing and analyzing audio briefings
  async transcribeAudioToDirectives(base64: string) {
    return withRetry(async () => {
      const ai = getClient();
      const response = await ai.models.generateContent({
        model: MODELS.AUDIO,
        contents: {
          parts: [
            { inlineData: { data: base64, mimeType: 'audio/webm' } },
            { text: "Transcribe this event briefing and extract structured directives including the goal, color palette (preferred/avoid), materials, and lighting. Identify missing information as follow-up questions." }
          ]
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              transcript: { type: Type.STRING },
              directives: {
                type: Type.OBJECT,
                properties: {
                  goal: { type: Type.STRING },
                  palette: {
                    type: Type.OBJECT,
                    properties: {
                      preferred: { type: Type.ARRAY, items: { type: Type.STRING } },
                      avoid: { type: Type.ARRAY, items: { type: Type.STRING } }
                    }
                  },
                  materials: { type: Type.ARRAY, items: { type: Type.STRING } },
                  lighting: { type: Type.STRING }
                }
              },
              missing_info_questions: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["transcript", "directives", "missing_info_questions"]
          }
        }
      });
      return JSON.parse(response.text || '{}');
    });
  },

  // Fix processTextBriefing: Analyzing text-based briefings
  async processTextBriefing(text: string) {
    return withRetry(async () => {
      const ai = getClient();
      const response = await ai.models.generateContent({
        model: MODELS.TEXT,
        contents: text,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              transcript: { type: Type.STRING },
              directives: {
                type: Type.OBJECT,
                properties: {
                  goal: { type: Type.STRING },
                  palette: {
                    type: Type.OBJECT,
                    properties: {
                      preferred: { type: Type.ARRAY, items: { type: Type.STRING } },
                      avoid: { type: Type.ARRAY, items: { type: Type.STRING } }
                    }
                  },
                  materials: { type: Type.ARRAY, items: { type: Type.STRING } },
                  lighting: { type: Type.STRING }
                }
              },
              missing_info_questions: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["transcript", "directives", "missing_info_questions"]
          }
        }
      });
      return JSON.parse(response.text || '{}');
    });
  },

  // Fix buildEditPrompt: Generating creative image prompts from project state
  async buildEditPrompt(directives: any, spaceAnalysis: any, fixedElements: string[]) {
    return withRetry(async () => {
      const ai = getClient();
      const response = await ai.models.generateContent({
        model: MODELS.PRO,
        contents: `Based on these directives: ${JSON.stringify(directives)}, space analysis: ${JSON.stringify(spaceAnalysis)}, and fixed elements: ${fixedElements.join(', ')}, generate a professional image prompt for an event decoration proposal. Return prompts in English and a summary in Portuguese.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              edit_prompt: { type: Type.STRING },
              negative_prompt: { type: Type.STRING },
              client_summary: { type: Type.STRING },
              change_list: { type: Type.ARRAY, items: { type: Type.STRING } },
              constraints: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["edit_prompt", "negative_prompt", "client_summary", "change_list", "constraints"]
          }
        }
      });
      return JSON.parse(response.text || '{}');
    });
  },

  // Fix refineImagePrompt: Optimizing user instructions for image generation
  async refineImagePrompt(userText: string, context: any) {
    return withRetry(async () => {
      const ai = getClient();
      const response = await ai.models.generateContent({
        model: MODELS.PRO,
        contents: `Refine this user request for a design visualization: "${userText}". Context: ${JSON.stringify(context)}. Provide a detailed English prompt, a negative prompt, and an explanation in Portuguese.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              refined_prompt_en: { type: Type.STRING },
              negative_prompt: { type: Type.STRING },
              portuguese_explanation: { type: Type.STRING }
            },
            required: ["refined_prompt_en", "negative_prompt", "portuguese_explanation"]
          }
        }
      });
      return JSON.parse(response.text || '{}');
    });
  },

  // Fix generateImage: Handling image generation with optional Pro parameters
  async generateImage(base64: string, prompt: string, negativePrompt: string, usePro: boolean = false, size: "1K" | "2K" | "4K" = "1K") {
    return withRetry(async () => {
      const ai = getClient();
      const response = await ai.models.generateContent({
        model: usePro ? MODELS.IMAGE_PRO : MODELS.IMAGE_FLASH,
        contents: {
          parts: [
            { inlineData: { data: base64.split(',')[1] || base64, mimeType: 'image/png' } },
            { text: `Decorate this space following these instructions: ${prompt}. Do not include: ${negativePrompt}. Photorealistic, architectural style.` }
          ]
        },
        config: {
          imageConfig: {
            aspectRatio: "1:1",
            ...(usePro ? { imageSize: size } : {})
          }
        }
      });
      const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
      return part ? `data:image/png;base64,${part.inlineData.data}` : '';
    });
  },

  // Fix editImageWithPrompt: Editing existing assets with AI
  async editImageWithPrompt(base64: string, prompt: string) {
    return withRetry(async () => {
      const ai = getClient();
      const response = await ai.models.generateContent({
        model: MODELS.IMAGE_FLASH,
        contents: {
          parts: [
            { inlineData: { data: base64.split(',')[1] || base64, mimeType: 'image/png' } },
            { text: prompt }
          ]
        },
        config: { imageConfig: { aspectRatio: "1:1" } }
      });
      const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
      return part ? `data:image/png;base64,${part.inlineData.data}` : '';
    });
  },

  // Fix buildMoodboard: Generating conceptual moodboard metadata
  async buildMoodboard(input: any) {
    return withRetry(async () => {
      const ai = getClient();
      const response = await ai.models.generateContent({
        model: MODELS.TEXT,
        contents: `Generate a conceptual moodboard based on these inputs: ${JSON.stringify(input)}. Provide a title, color palette, textures, objects, symbols, and a short story.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              palette: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    hex: { type: Type.STRING },
                    role: { type: Type.STRING }
                  }
                }
              },
              textures: { type: Type.ARRAY, items: { type: Type.STRING } },
              objects: { type: Type.ARRAY, items: { type: Type.STRING } },
              symbols: { type: Type.ARRAY, items: { type: Type.STRING } },
              short_story: { type: Type.STRING }
            },
            required: ["title", "palette", "textures", "objects", "symbols", "short_story"]
          }
        }
      });
      return JSON.parse(response.text || '{}');
    });
  },

  // Fix generateMoodboardImage: Creating artistic collage images
  async generateMoodboardImage(story: string) {
    return withRetry(async () => {
      const ai = getClient();
      const response = await ai.models.generateContent({
        model: MODELS.IMAGE_FLASH,
        contents: { parts: [{ text: `A professional design moodboard collage for this concept: ${story}` }] },
        config: { imageConfig: { aspectRatio: "16:9" } }
      });
      const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
      return part ? `data:image/png;base64,${part.inlineData.data}` : '';
    });
  },

  // Fix startChat: Starting a new conversational chat session
  async startChat() {
    const ai = getClient();
    return ai.chats.create({
      model: MODELS.TEXT,
      config: {
        systemInstruction: "You are an expert event architect. Assist the user with creative and technical advice for event planning and decoration."
      }
    });
  },

  handleApiError(e: any) { console.error(e); }
};
