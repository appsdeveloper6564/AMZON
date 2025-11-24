import React, { useState, useMemo } from 'react';
import ProductCard from './components/ProductCard';
import AiSidebar from './components/AiSidebar';
import { PRODUCTS } from './constants';
import { Product } from './types';

function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  
  // Sidebar State
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [aiMode, setAiMode] = useState<'chat' | 'visualize'>('chat');

  const categories = useMemo(() => {
    return ['All', ...Array.from(new Set(PRODUCTS.map(p => p.category)))];
  }, []);

  const filteredProducts = PRODUCTS.filter(product => {
    const matchesSearch = product.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || product.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleAskAi = (product: Product) => {
    setActiveProduct(product);
    setAiMode('chat');
    setIsAiOpen(true);
  };

  const handleVisualize = (product: Product) => {
    setActiveProduct(product);
    setAiMode('visualize');
    setIsAiOpen(true);
  };

  const handleGeneralChat = () => {
    setActiveProduct(null);
    setAiMode('chat');
    setIsAiOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <header className="sticky top-0 z-40 bg-gray-900 text-white shadow-lg">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
             <div className="bg-yellow-400 text-gray-900 p-1.5 rounded font-bold text-xl flex items-center justify-center w-10 h-10">
                A
             </div>
             <span className="text-xl font-bold tracking-tight hidden sm:block">AmzGen</span>
          </div>

          <div className="flex-grow max-w-2xl relative">
            <input 
              type="text" 
              placeholder="Search Amazon products..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full py-2.5 px-4 pr-10 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
            <span className="material-icons-outlined absolute right-3 top-2.5 text-gray-500">search</span>
          </div>

          <button 
            onClick={handleGeneralChat}
            className="flex items-center gap-2 hover:bg-gray-800 px-3 py-2 rounded-lg transition-colors"
          >
             <span className="material-icons-outlined text-yellow-400">smart_toy</span>
             <span className="hidden md:inline font-medium">AI Assistant</span>
          </button>
        </div>

        {/* Categories Bar */}
        <div className="bg-gray-800 py-2 overflow-x-auto">
           <div className="container mx-auto px-4 flex gap-4 text-sm whitespace-nowrap">
              {categories.map(cat => (
                <button 
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1 rounded-full transition-colors ${categoryFilter === cat ? 'bg-gray-100 text-gray-900 font-bold' : 'text-gray-300 hover:text-white'}`}
                >
                  {cat}
                </button>
              ))}
           </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow container mx-auto px-4 py-8">
        
        {filteredProducts.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
             <span className="material-icons-outlined text-6xl mb-4 text-gray-300">sentiment_dissatisfied</span>
             <p className="text-xl">No products found matching your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map(product => (
              <ProductCard 
                key={product.id} 
                product={product} 
                onAsk={handleAskAi}
                onVisualize={handleVisualize}
              />
            ))}
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8 mt-auto">
        <div className="container mx-auto px-4 text-center">
            <p className="mb-2">Disclaimer: We are a participant in the Amazon Services LLC Associates Program.</p>
            <p className="text-sm">&copy; {new Date().getFullYear()} AmzGen AI Store. All rights reserved.</p>
        </div>
      </footer>

      {/* Gemini AI Sidebar */}
      <AiSidebar 
        isOpen={isAiOpen} 
        onClose={() => setIsAiOpen(false)} 
        activeProduct={activeProduct}
        initialMode={aiMode}
      />
    </div>
  );
}

export default App;
