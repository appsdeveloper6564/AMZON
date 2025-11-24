import React, { useState, useMemo } from 'react';
import ProductCard from './components/ProductCard';
import AiSidebar from './components/AiSidebar';
import { PRODUCTS } from './constants';
import { Product } from './types';
import { searchProducts } from './services/geminiService';

function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  
  // Data State
  const [displayedProducts, setDisplayedProducts] = useState<Product[]>(PRODUCTS);
  const [isSearching, setIsSearching] = useState(false);
  
  // Sidebar State
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [aiMode, setAiMode] = useState<'chat' | 'visualize'>('chat');

  const categories = useMemo(() => {
    return ['All', ...Array.from(new Set(PRODUCTS.map(p => p.category)))];
  }, []);

  const handleSearchSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!searchTerm.trim()) {
      setDisplayedProducts(PRODUCTS);
      return;
    }

    setIsSearching(true);
    try {
      // Use Gemini to "search" Amazon (generate results), respecting current category context
      const results = await searchProducts(searchTerm, categoryFilter);
      setDisplayedProducts(results);
      // We reset the filter to 'All' so the user sees all the AI-generated results,
      // which might be mixed if the AI decided to include complementary items,
      // or strictly filtered if the AI respected the category parameter.
      setCategoryFilter('All');
    } catch (error) {
      console.error("Search failed", error);
      // Fallback to local filter if AI fails
      const filtered = PRODUCTS.filter(p => p.title.toLowerCase().includes(searchTerm.toLowerCase()));
      setDisplayedProducts(filtered);
    } finally {
      setIsSearching(false);
    }
  };

  const filteredProducts = displayedProducts.filter(product => {
    // If we just did an AI search, we trust the results and only apply category filter if user changes it
    // But typically for search results we just show them.
    // Let's keep category filtering active even on search results if they have categories.
    const matchesCategory = categoryFilter === 'All' || product.category === categoryFilter;
    return matchesCategory;
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
          <div 
            className="flex items-center gap-2 cursor-pointer" 
            onClick={() => {
              setDisplayedProducts(PRODUCTS);
              setSearchTerm('');
            }}
          >
             <div className="bg-yellow-400 text-gray-900 p-1.5 rounded font-bold text-xl flex items-center justify-center w-10 h-10">
                A
             </div>
             <span className="text-xl font-bold tracking-tight hidden sm:block">AmzGen</span>
          </div>

          <form onSubmit={handleSearchSubmit} className="flex-grow max-w-2xl relative">
            <input 
              type="text" 
              placeholder={categoryFilter !== 'All' ? `Search in ${categoryFilter}...` : "Search for anything on Amazon..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full py-2.5 px-4 pr-10 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
            <button 
              type="submit"
              className="absolute right-2 top-1.5 text-gray-500 hover:text-yellow-600 p-1 rounded transition-colors"
            >
              {isSearching ? (
                <span className="material-icons-outlined animate-spin">refresh</span>
              ) : (
                <span className="material-icons-outlined">search</span>
              )}
            </button>
          </form>

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
        
        {isSearching ? (
          <div className="flex flex-col items-center justify-center py-20">
             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mb-4"></div>
             <p className="text-lg text-gray-600 font-medium">Searching Amazon Catalog with AI...</p>
             <p className="text-sm text-gray-400 mt-2">Finding best matches for "{searchTerm}" {categoryFilter !== 'All' ? `in ${categoryFilter}` : ''}</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
             <span className="material-icons-outlined text-6xl mb-4 text-gray-300">sentiment_dissatisfied</span>
             <p className="text-xl">No products found.</p>
             <button 
               onClick={() => setDisplayedProducts(PRODUCTS)}
               className="mt-4 text-blue-600 hover:underline"
             >
               Go back to Best Sellers
             </button>
          </div>
        ) : (
          <>
            {displayedProducts !== PRODUCTS && (
               <div className="mb-6 flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-800">
                    Results for "{searchTerm}"
                  </h2>
                  <button 
                    onClick={() => {
                        setDisplayedProducts(PRODUCTS);
                        setSearchTerm('');
                    }}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Clear Search
                  </button>
               </div>
            )}
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
          </>
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
