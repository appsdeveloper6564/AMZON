import { GoogleGenAI, Type } from "@google/genai";
import { ChatMode, Product } from "../types";

// Standard client for basic tasks (Flash/Lite)
const genAI = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper to get client with user key for Pro features if needed
const getProClient = async () => {
  const win = window as any;
  if (win.aistudio && win.aistudio.hasSelectedApiKey) {
    const hasKey = await win.aistudio.hasSelectedApiKey();
    if (hasKey) {
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

export const searchProducts = async (query: string, category: string = 'All'): Promise<Product[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const categoryInstruction = category !== 'All' 
    ? `Strictly restrict results to items within the "${category}" category.` 
    : "Determine the most appropriate category for each item based on Amazon standards.";

  const prompt = `Act as an expert Amazon product search and recommendation engine.
  
  User Query: "${query}"
  Category Context: ${categoryInstruction}
  
  Task: Generate a list of 8 real, high-quality products available on Amazon India that best satisfy the user's request.
  
  Reasoning Strategy:
  1. **Intent Analysis**: deeply analyze the query. 
     - If it's a **Setup/Ecosystem** query (e.g., "full gaming setup", "coffee station"), break it down and return a diverse mix of complementary items (e.g., monitor + keyboard + mouse, or machine + beans + mug).
     - If it's a **Comparison** query (e.g., "iPhone 15 vs S24"), return the competing products side-by-side.
     - If it's a **Specific** query (e.g., "Sony XM5"), return that specific product and closest alternatives.
  2. **Filtering**: Strictly adhere to any explicit constraints in the query like "under ₹2000", "red color", or specific brands.
  3. **Data Quality**: Ensure prices are realistic current market prices in INR (₹).
  
  Output Schema Requirements:
  - 'image_prompt': A highly detailed, photorealistic visual description of the product on a clean studio background.
  - 'id': unique string.
  
  Return ONLY valid JSON matching this schema:
  {
    type: ARRAY,
    items: {
      id: STRING,
      title: STRING,
      description: STRING (2 sentences max),
      price: STRING (formatted like ₹1,999),
      rating: STRING (e.g., 4.5/5),
      reviewCount: NUMBER,
      features: ARRAY of STRING,
      category: STRING,
      image_prompt: STRING
    }
  }`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            price: { type: Type.STRING },
            rating: { type: Type.STRING },
            reviewCount: { type: Type.NUMBER },
            features: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING } 
            },
            category: { type: Type.STRING },
            image_prompt: { type: Type.STRING },
          },
          required: ['id', 'title', 'price', 'rating', 'description', 'features', 'image_prompt', 'category']
        }
      }
    }
  });

  if (response.text) {
    try {
      const rawProducts = JSON.parse(response.text);
      // Transform raw AI data into App Product type with generated image URLs
      return rawProducts.map((p: any) => ({
        ...p,
        affiliate_link: `https://www.amazon.in/s?k=${encodeURIComponent(p.title)}`, // Fallback search link
        image: `https://image.pollinations.ai/prompt/${encodeURIComponent(p.image_prompt)}?width=400&height=400&nologo=true`
      }));
    } catch (e) {
      console.error("Failed to parse AI search results", e);
      return [];
    }
  }

  return [];
};
