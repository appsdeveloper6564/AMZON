import React, { useState, useRef, useEffect } from 'react';
import { ChatMode, ChatMessage, Product } from '../types';
import { streamChatResponse, generateProductImage } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';

interface AiSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeProduct: Product | null;
  initialMode: 'chat' | 'visualize';
}

const AiSidebar: React.FC<AiSidebarProps> = ({ isOpen, onClose, activeProduct, initialMode }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: 'Hi! I can help you research products, compare prices, or even visualize items in your home.' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<ChatMode>(ChatMode.FAST);
  
  // Image Gen Specific State
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [imageSize, setImageSize] = useState('1K');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeProduct) {
        if (initialMode === 'visualize') {
            setMode(ChatMode.IMAGE);
            setInput(`Visualize the ${activeProduct.title} on a modern wooden desk with warm lighting.`);
        } else {
            setMode(ChatMode.FAST);
            setInput(`Is the ${activeProduct.title} a good deal?`);
        }
    }
  }, [activeProduct, initialMode]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMsg: ChatMessage = { role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      if (mode === ChatMode.IMAGE) {
        // Image Generation Flow
        const imageUrl = await generateProductImage(userMsg.text, aspectRatio, imageSize);
        setMessages(prev => [...prev, { 
            role: 'model', 
            text: `Here is a visualization for: "${userMsg.text}"`,
            image: imageUrl 
        }]);
      } else {
        // Text Chat Flow
        let accumulatedText = '';
        let groundingUrls: any[] = [];
        
        // Add a placeholder message for streaming
        setMessages(prev => [...prev, { role: 'model', text: '', isThinking: mode === ChatMode.DEEP }]);

        const history = messages.filter(m => !m.image).map(m => ({
            role: m.role,
            parts: [{ text: m.text }]
        }));

        await streamChatResponse(
          userMsg.text,
          mode,
          history,
          (chunk) => {
            accumulatedText += chunk;
            setMessages(prev => {
              const newMsgs = [...prev];
              newMsgs[newMsgs.length - 1] = { 
                  role: 'model', 
                  text: accumulatedText, 
                  groundingUrls,
                  isThinking: false
              };
              return newMsgs;
            });
          },
          (chunks) => {
             groundingUrls = chunks;
          }
        );
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', text: 'Sorry, I encountered an error. Please check your API key settings or try again.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[400px] bg-white shadow-2xl transform transition-transform duration-300 z-50 flex flex-col border-l border-gray-200">
      {/* Header */}
      <div className="p-4 border-b bg-gradient-to-r from-gray-900 to-gray-800 text-white flex justify-between items-center">
        <div className="flex items-center gap-2">
            <span className="material-icons-outlined text-yellow-400">auto_awesome</span>
            <h2 className="font-semibold">AmzGen Assistant</h2>
        </div>
        <button onClick={onClose} className="hover:bg-gray-700 p-1 rounded-full transition-colors">
            <span className="material-icons-outlined">close</span>
        </button>
      </div>

      {/* Mode Selector */}
      <div className="p-3 bg-gray-50 border-b flex gap-2 overflow-x-auto scrollbar-hide">
        <ModeButton active={mode === ChatMode.FAST} onClick={() => setMode(ChatMode.FAST)} icon="bolt" label="Fast" />
        <ModeButton active={mode === ChatMode.DEEP} onClick={() => setMode(ChatMode.DEEP)} icon="psychology" label="Deep Think" />
        <ModeButton active={mode === ChatMode.SEARCH} onClick={() => setMode(ChatMode.SEARCH)} icon="search" label="Search" />
        <ModeButton active={mode === ChatMode.MAPS} onClick={() => setMode(ChatMode.MAPS)} icon="place" label="Maps" />
        <ModeButton active={mode === ChatMode.IMAGE} onClick={() => setMode(ChatMode.IMAGE)} icon="image" label="Visualize" />
      </div>

      {/* Image Gen Config (Conditional) */}
      {mode === ChatMode.IMAGE && (
          <div className="p-3 bg-indigo-50 border-b flex flex-wrap gap-3 text-xs">
              <div className="flex flex-col gap-1">
                  <label className="text-indigo-900 font-bold">Aspect Ratio</label>
                  <select value={aspectRatio} onChange={e => setAspectRatio(e.target.value)} className="border rounded px-2 py-1">
                      <option value="1:1">1:1 (Square)</option>
                      <option value="16:9">16:9 (Landscape)</option>
                      <option value="9:16">9:16 (Portrait)</option>
                      <option value="4:3">4:3</option>
                  </select>
              </div>
              <div className="flex flex-col gap-1">
                  <label className="text-indigo-900 font-bold">Size</label>
                  <select value={imageSize} onChange={e => setImageSize(e.target.value)} className="border rounded px-2 py-1">
                      <option value="1K">1K</option>
                      <option value="2K">2K</option>
                      <option value="4K">4K</option>
                  </select>
              </div>
          </div>
      )}

      {/* Messages */}
      <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-lg p-3 ${
              msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-br-none' 
                : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm'
            }`}>
              {msg.isThinking ? (
                 <div className="flex items-center gap-2 text-gray-500 italic text-sm">
                    <span className="animate-spin material-icons-outlined text-sm">hourglass_empty</span>
                    Thinking...
                 </div>
              ) : (
                <>
                    {msg.image && (
                        <div className="mb-2 rounded-lg overflow-hidden border border-gray-200">
                            <img src={msg.image} alt="Generated" className="w-full h-auto" />
                        </div>
                    )}
                    <div className="markdown-body text-sm leading-relaxed">
                        <ReactMarkdown>{msg.text}</ReactMarkdown>
                    </div>
                    {msg.groundingUrls && msg.groundingUrls.length > 0 && (
                        <div className="mt-2 pt-2 border-t text-xs">
                            <p className="font-semibold text-gray-500 mb-1">Sources:</p>
                            <div className="flex flex-wrap gap-2">
                                {msg.groundingUrls.map((chunk: any, i) => {
                                    const uri = chunk.web?.uri || chunk.maps?.uri;
                                    const title = chunk.web?.title || chunk.maps?.title || 'Source';
                                    if(!uri) return null;
                                    return (
                                        <a key={i} href={uri} target="_blank" rel="noreferrer" className="bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100 truncate max-w-full inline-block">
                                            {title}
                                        </a>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-white">
        <div className="flex gap-2">
            <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={mode === ChatMode.IMAGE ? "Describe image to generate..." : "Ask about products..."}
                className="flex-grow border rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                disabled={isLoading}
            />
            <button 
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 disabled:bg-gray-300 transition-colors flex items-center justify-center w-10 h-10"
            >
                {isLoading ? (
                    <span className="animate-spin material-icons-outlined text-sm">refresh</span>
                ) : (
                    <span className="material-icons-outlined text-sm">send</span>
                )}
            </button>
        </div>
      </div>
    </div>
  );
};

const ModeButton = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: string, label: string }) => (
    <button 
        onClick={onClick}
        className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border ${
            active ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-100'
        }`}
    >
        <span className="material-icons-outlined text-[16px]">{icon}</span>
        {label}
    </button>
);

export default AiSidebar;
