import React from 'react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  onVisualize: (product: Product) => void;
  onAsk: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onVisualize, onAsk }) => {
  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300 flex flex-col h-full overflow-hidden border border-gray-100">
      <div className="relative group">
        <img 
          src={product.image} 
          alt={product.title} 
          className="w-full h-64 object-cover p-6 group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-2 right-2 bg-yellow-400 text-xs font-bold px-2 py-1 rounded-full flex items-center shadow-sm">
          <span className="material-icons-outlined text-[14px] mr-1">star</span>
          {product.rating}
        </div>
      </div>
      
      <div className="p-5 flex flex-col flex-grow">
        <div className="mb-2 text-xs text-gray-500 uppercase tracking-wide font-semibold">{product.category}</div>
        <h3 className="text-lg font-bold text-gray-800 leading-tight mb-2 line-clamp-2" title={product.title}>
          {product.title}
        </h3>
        
        <p className="text-sm text-gray-600 mb-4 line-clamp-2 flex-grow">
          {product.description}
        </p>

        <div className="flex flex-wrap gap-1 mb-4">
            {product.features.slice(0, 2).map((feat, idx) => (
                <span key={idx} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-1 rounded-md border border-gray-200">
                    {feat}
                </span>
            ))}
        </div>

        <div className="flex items-end justify-between mb-4">
            <div>
                 <span className="text-sm text-gray-400 line-through mr-2">M.R.P.</span>
                 <span className="text-2xl font-bold text-gray-900">{product.price}</span>
            </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-auto">
            <button 
                onClick={() => window.open(product.affiliate_link, '_blank')}
                className="col-span-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-2.5 px-4 rounded-lg flex items-center justify-center transition-colors shadow-sm"
            >
                Buy on Amazon
                <span className="material-icons-outlined ml-1 text-lg">open_in_new</span>
            </button>
            <button 
                onClick={() => onAsk(product)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold py-2 px-3 rounded-lg flex items-center justify-center transition-colors"
            >
                <span className="material-icons-outlined mr-1 text-sm">chat_bubble_outline</span>
                Ask AI
            </button>
            <button 
                onClick={() => onVisualize(product)}
                className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold py-2 px-3 rounded-lg flex items-center justify-center transition-colors"
            >
                <span className="material-icons-outlined mr-1 text-sm">image</span>
                Visualize
            </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
