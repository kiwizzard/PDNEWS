
import React from 'react';
import { Article, Category } from '../types';

interface ArticleListProps {
  categories: Category[];
  selectedCategory: Category;
  setSelectedCategory: (cat: Category) => void;
  articles: Article[];
  selectedArticleId: string | null;
  setSelectedArticleId: (id: string) => void;
  isLoading: boolean;
  readArticleIds: Set<string>;
}

const ArticleList: React.FC<ArticleListProps> = ({ 
  categories, 
  selectedCategory, 
  setSelectedCategory, 
  articles, 
  selectedArticleId, 
  setSelectedArticleId, 
  isLoading,
  readArticleIds
}) => {
  return (
    <div className="w-72 md:w-[380px] flex flex-col h-screen bg-white border-r border-gray-100 overflow-hidden shrink-0 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
      <div className="p-4 border-b border-gray-50 bg-white z-10">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[10px] font-black tracking-[0.2em] text-gray-400 uppercase italic">Intelligence Radar</h2>
          <div className="flex space-x-1">
             <div className={`w-2 h-2 rounded-full ${isLoading ? 'bg-blue-500 animate-pulse' : 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]'}`}></div>
             <div className="w-2 h-2 rounded-full bg-slate-200"></div>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                if (selectedCategory !== cat) setSelectedCategory(cat);
              }}
              disabled={isLoading && selectedCategory !== cat}
              className={`px-3 py-2 rounded-xl text-[12px] font-bold transition-all duration-300 relative overflow-hidden ${
                selectedCategory === cat 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
                : 'bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-700 border border-transparent active:scale-95 disabled:opacity-50'
              }`}
            >
              {cat}
              {selectedCategory === cat && isLoading && (
                <span className="absolute bottom-0 left-0 h-[2px] bg-white/40 animate-loading-bar w-full"></span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-white scrollbar-hide">
        {isLoading && articles.length === 0 ? (
          <div className="p-5 space-y-8">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
              <div key={n} className="space-y-4 animate-pulse">
                <div className="flex justify-between items-center">
                  <div className="h-3.5 bg-slate-100 rounded-md w-20"></div>
                  <div className="h-3 bg-slate-50 rounded w-10"></div>
                </div>
                <div className="h-5 bg-slate-100 rounded-lg w-full"></div>
                <div className="h-3.5 bg-slate-50 rounded-md w-4/5"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {articles.map((article, index) => {
              const isRead = readArticleIds.has(article.id);
              const isSelected = selectedArticleId === article.id;
              
              return (
                <div
                  key={article.id}
                  onClick={() => setSelectedArticleId(article.id)}
                  className={`p-5 cursor-pointer transition-all duration-300 relative border-l-4 group flex gap-4 ${
                    isSelected 
                    ? 'bg-blue-50/50 border-blue-600' 
                    : 'hover:bg-gray-50 border-transparent'
                  } ${!isSelected && isRead ? 'opacity-60' : 'opacity-100'}`}
                >
                  <div className="flex flex-col items-center shrink-0 pt-1">
                    <span className={`text-[10px] font-mono font-black ${isSelected ? 'text-blue-600' : 'text-slate-300'}`}>
                      {(index + 1).toString().padStart(2, '0')}
                    </span>
                    {!isRead && !isSelected && (
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shadow-[0_0_6px_rgba(59,130,246,0.5)]"></div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-md tracking-tighter uppercase ${
                        isSelected ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-400'
                      }`}>
                        {article.source}
                      </span>
                      <span className="text-[10px] text-slate-300 font-mono font-medium">{article.date}</span>
                    </div>
                    <h3 className={`text-[15px] font-bold leading-snug mb-1.5 transition-colors line-clamp-2 ${
                      isSelected ? 'text-blue-900' : isRead ? 'text-slate-500' : 'text-slate-800 group-hover:text-blue-700'
                    }`}>
                      {article.title}
                    </h3>
                    <p className={`text-[11px] line-clamp-1 font-medium italic transition-colors ${
                      isSelected ? 'text-blue-400' : 'text-slate-400'
                    }`}>
                      {article.summary.replace(/[#\-*•]/g, '').trim()}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <style>{`
        @keyframes loading-bar {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-loading-bar {
          animation: loading-bar 1.5s infinite linear;
        }
      `}</style>
    </div>
  );
};

export default ArticleList;
