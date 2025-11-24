export interface Product {
  id: string;
  title: string;
  image: string;
  description: string;
  features: string[];
  price: string;
  rating: string;
  reviewCount: number;
  affiliate_link: string;
  category: string;
}

export enum ChatMode {
  FAST = 'FAST', // Flash Lite
  DEEP = 'DEEP', // Pro Thinking
  SEARCH = 'SEARCH', // Flash + Grounding
  MAPS = 'MAPS', // Flash + Maps
  IMAGE = 'IMAGE', // Pro Image
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  image?: string; // For generated images
  groundingUrls?: Array<{ uri: string; title: string }>;
  isThinking?: boolean;
}
