import React, { useState, useEffect, useCallback } from 'react';
import ArticleList from './components/ArticleList';
import ArticleView from './components/ArticleView';
import { Article, Category } from './types';
import { fetchLatestIntel } from './services/geminiService';

const App: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<Category>('AI');
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [cache, setCache] = useState<Record<string, Article[]>>({});
  const [readArticleIds, setReadArticleIds] = useState<Set<string>>(new Set());
  const [isActivated, setIsActivated] = useState<boolean>(false);
  const [envError, setEnvError] = useState<string | null>(null);

  useEffect(() => {
    // 启动环境检测
    const key = process.env.API_KEY;
    if (!key || key === 'undefined' || key.length < 10) {
      setEnvError("未检测到有效的 API_KEY。请确保 Vercel 环境变量已配置并执行了 Redeploy。");
    }
  }, []);

  const loadCategoryIntel = useCallback(async (cat: Category, forceRefresh = false) => {
    if (!isActivated) return;
    
    // 如果已有缓存且不是强制刷新，直接读缓存
    if (cache[cat] && !forceRefresh) {
      setArticles(cache[cat]);
      if (!selectedArticleId) setSelectedArticleId(cache[cat][0]?.id || null);
      return;
    }

    setIsLoading(true);
    setArticles([]); // 清空旧列表显示加载状态
    
    try {
      const data = await fetchLatestIntel(cat);
      if (data && data.length > 0) {
        setArticles(data);
        setCache(prev => ({ ...prev, [cat]: data }));
        setSelectedArticleId(data[0].id);
      }
    } catch (e) {
      console.error("App Load Error:", e);
    } finally {
      setIsLoading(false);
    }
  }, [cache, selectedArticleId, isActivated]);

  // 监听类别切换或激活状态
  useEffect(() => {
    if (isActivated) {
      loadCategoryIntel(selectedCategory);
    }
  }, [selectedCategory, isActivated, loadCategoryIntel]);

  if (!isActivated) {
    return (
      <div className="h-screen w-full bg-[#0a0a0b] flex flex-col items-center justify-center p-6 text-white text-center">
        <div className="space-y-6 max-w-xl animate-in fade-in zoom-in duration-700">
          <h1 className="text-6xl font-black italic tracking-tighter">PD<span className="text-blue-500">.</span>INTEL</h1>
          <p className="text-slate-400 text-lg">产品经理智能情报舱 (V3.1-PRO)</p>
          
          <button 
            onClick={() => setIsActivated(true)}
            className="px-12 py-5 bg-white text-black font-black rounded-2xl hover:bg-blue-600 hover:text-white transition-all transform hover:scale-105 active:scale-95 shadow-2xl shadow-white/5"
          >
            开启雷达
          </button>

          {envError && (
            <div className="mt-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs">
              ⚠️ {envError}
            </div>
          )}
        </div>
        <div className="absolute bottom-6 text-[10px] text-white/10 font-mono tracking-widest">
          SYSTEM_READY // NO_IMPORTMAP_MODE
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-[#f8f9fa] overflow-hidden animate-in fade-in duration-500">
      <ArticleList 
        categories={['AI', '互联网', '保险', '商业', '社科']}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        articles={articles} 
        selectedArticleId={selectedArticleId} 
        setSelectedArticleId={setSelectedArticleId}
        isLoading={isLoading}
        readArticleIds={readArticleIds}
      />
      <div className="flex-1 overflow-hidden relative">
        <ArticleView 
          article={articles.find(a => a.id === selectedArticleId) || null} 
          isLoading={isLoading && articles.length === 0} 
        />
      </div>
    </div>
  );
};

export default App;