import { GoogleGenAI, Type } from "@google/genai";
import { ChatMode } from "../types";

// Standard client for basic tasks (Flash/Lite)
const genAI = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper to get client with user key for Pro features if needed
const getProClient = async () => {
  const win = window as any;
  if (win.aistudio && win.aistudio.hasSelectedApiKey) {
    const hasKey = await win.aistudio.hasSelectedApiKey();
    if (hasKey) {
       // When using the selected key, we just instantiate a new client. 
       // The environment will handle the key injection for the 'veo' or 'pro-image' models via the internal proxy if strictly required,
       // BUT for this specific prompt instruction regarding 'gemini-3-pro-image-preview', 
       // we usually need to ensure we are in a context that supports it.
       // We will assume the standard process.env.API_KEY is a paid key for simplicity unless the specific window flow is triggered.
       // However, per prompt: "Upgrade to gemini-3-pro-image-preview... users MUST select their own API key."
       return new GoogleGenAI({ apiKey: process.env.API_KEY }); 
    }
  }
  return genAI;
};

export const streamChatResponse = async (
  message: string,
  mode: ChatMode,
  history: any[],
  onChunk: (text: string) => void,
  onGrounding: (chunks: any[]) => void
) => {
  let modelName = 'gemini-2.5-flash-lite-latest';
  let config: any = {};
  
  // Model & Tool Selection Logic
  switch (mode) {
    case ChatMode.FAST:
      modelName = 'gemini-2.5-flash-lite-latest';
      break;
    case ChatMode.DEEP:
      modelName = 'gemini-3-pro-preview';
      // Max thinking budget for deep reasoning
      config.thinkingConfig = { thinkingBudget: 32768 };
      break;
    case ChatMode.SEARCH:
      modelName = 'gemini-2.5-flash';
      config.tools = [{ googleSearch: {} }];
      break;
    case ChatMode.MAPS:
      modelName = 'gemini-2.5-flash';
      config.tools = [{ googleMaps: {} }];
      break;
    default:
      modelName = 'gemini-2.5-flash';
  }

  // Create chat session
  const chat = genAI.chats.create({
    model: modelName,
    config: {
      systemInstruction: "You are a helpful Amazon shopping assistant. You help users compare products, find deals, and understand technical specs. If using tools, summarize the findings effectively.",
      ...config
    },
    history: history
  });

  const result = await chat.sendMessageStream({ message });

  for await (const chunk of result) {
    // Check for grounding metadata
    if (chunk.candidates?.[0]?.groundingMetadata?.groundingChunks) {
      onGrounding(chunk.candidates[0].groundingMetadata.groundingChunks);
    }
    
    // Check for text
    if (chunk.text) {
      onChunk(chunk.text);
    }
  }
};

export const generateProductImage = async (
  prompt: string,
  aspectRatio: string = "1:1",
  size: string = "1K"
) => {
  // Ensure user has selected a key for the Pro Image model
  const win = window as any;
  if (win.aistudio && win.aistudio.openSelectKey) {
      const hasKey = await win.aistudio.hasSelectedApiKey();
      if (!hasKey) {
        await win.aistudio.openSelectKey();
      }
  }
  
  // Force new client to pick up potentially new key from env (simulated)
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: {
      parts: [{ text: prompt }]
    },
    config: {
      imageConfig: {
        aspectRatio: aspectRatio,
        imageSize: size
      }
    }
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("No image generated");
};