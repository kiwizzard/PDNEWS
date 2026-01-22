
import React, { useState, useEffect, useCallback } from 'react';
import ArticleList from './components/ArticleList';
import ArticleView from './components/ArticleView';
import { Article, Category } from './types';
import { fetchLatestIntel } from './services/geminiService';

const CACHE_KEY = 'PM_INTEL_CACHE_PRO_V7';
const READ_STATUS_KEY = 'PM_INTEL_READ_STATUS_V1';

const App: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<Category>('AI');
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [cache, setCache] = useState<Record<string, Article[]>>({});
  const [readArticleIds, setReadArticleIds] = useState<Set<string>>(new Set());
  const [isActivated, setIsActivated] = useState<boolean>(false);
  const [showShareToast, setShowShareToast] = useState(false);

  // 检查是否已激活（拥有 API Key）
  useEffect(() => {
    const checkActivation = async () => {
      // 如果 process.env.API_KEY 已存在，直接进入
      if (process.env.API_KEY && process.env.API_KEY !== 'undefined') {
        setIsActivated(true);
        return;
      }
      
      // 否则检查 window.aistudio 状态
      // @ts-ignore - window.aistudio is pre-configured in the environment
      if (window.aistudio && await window.aistudio.hasSelectedApiKey()) {
        setIsActivated(true);
      }
    };
    checkActivation();
  }, []);

  // 激活处理函数
  const handleActivate = async () => {
    // @ts-ignore - window.aistudio is pre-configured in the environment
    if (window.aistudio) {
      // @ts-ignore - window.aistudio is pre-configured in the environment
      await window.aistudio.openSelectKey();
      // 按照指令：假设选择成功并继续
      setIsActivated(true);
    } else {
      // 如果不在 AISTUDIO 环境，提示需要环境支持
      alert("请在支持 Gemini API 的环境中打开此应用，或设置 process.env.API_KEY");
    }
  };

  // 初始化加载缓存和已读状态
  useEffect(() => {
    if (!isActivated) return;

    const savedCache = localStorage.getItem(CACHE_KEY);
    if (savedCache) {
      try {
        const parsed = JSON.parse(savedCache);
        setCache(parsed);
        if (parsed[selectedCategory]) {
          setArticles(parsed[selectedCategory]);
          setSelectedArticleId(parsed[selectedCategory][0]?.id || null);
        }
      } catch (e) {
        console.error("Cache recovery failed", e);
      }
    }

    const savedReadStatus = localStorage.getItem(READ_STATUS_KEY);
    if (savedReadStatus) {
      try {
        setReadArticleIds(new Set(JSON.parse(savedReadStatus)));
      } catch (e) {
        console.error("Read status recovery failed", e);
      }
    }
  }, [isActivated]);

  // 缓存持久化
  useEffect(() => {
    if (Object.keys(cache).length > 0) {
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    }
  }, [cache]);

  // 已读状态持久化
  useEffect(() => {
    localStorage.setItem(READ_STATUS_KEY, JSON.stringify(Array.from(readArticleIds)));
  }, [readArticleIds]);

  // 更新已读
  useEffect(() => {
    if (selectedArticleId && !readArticleIds.has(selectedArticleId)) {
      setReadArticleIds(prev => {
        const next = new Set(prev);
        next.add(selectedArticleId);
        return next;
      });
    }
  }, [selectedArticleId]);

  const loadCategoryIntel = useCallback(async (cat: Category, forceRefresh = false) => {
    if (!isActivated) return;
    const hasCache = !!cache[cat];
    
    if (hasCache && !forceRefresh) {
      setArticles(cache[cat]);
      if (!selectedArticleId || !cache[cat].find(a => a.id === selectedArticleId)) {
        setSelectedArticleId(cache[cat][0]?.id || null);
      }
      return;
    }

    setIsLoading(true);
    try {
      const data = await fetchLatestIntel(cat);
      if (data.length > 0) {
        setArticles(data);
        setCache(prev => ({ ...prev, [cat]: data }));
        setSelectedArticleId(data[0].id);
      }
    } catch (error: any) {
      if (error.message?.includes("Requested entity was not found")) {
        // 如果失效，重置激活状态
        setIsActivated(false);
      }
      console.error("Fetch failed", error);
    } finally {
      setIsLoading(false);
    }
  }, [cache, selectedArticleId, isActivated]);

  useEffect(() => {
    if (isActivated) {
      loadCategoryIntel(selectedCategory);
    }
  }, [selectedCategory, isActivated]);

  const handleRefresh = () => loadCategoryIntel(selectedCategory, true);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setShowShareToast(true);
    setTimeout(() => setShowShareToast(false), 2000);
  };

  const currentArticle = articles.find(a => a.id === selectedArticleId) || null;

  // 未激活状态的欢迎界面
  if (!isActivated) {
    return (
      <div className="h-screen w-full bg-[#0a0a0b] flex items-center justify-center p-6 text-white selection:bg-blue-500/30">
        <div className="max-w-2xl w-full text-center space-y-12 animate-in fade-in zoom-in duration-1000">
          <div className="space-y-4">
             <div className="inline-block px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black tracking-[0.3em] uppercase">
               Premium Intel Dashboard
             </div>
             <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-none italic">
               PD<span className="text-blue-500">.</span>INTEL
             </h1>
             <p className="text-slate-400 text-lg font-medium max-w-md mx-auto leading-relaxed">
               专为互联网、保险与车险产品经理打造的智能情报舱
             </p>
          </div>

          <button 
            onClick={handleActivate}
            className="group relative px-12 py-5 bg-white text-black font-black text-sm rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(255,255,255,0.1)] overflow-hidden"
          >
            <span className="relative z-10 flex items-center">
              启动智能情报中心
              <svg className="w-5 h-5 ml-3 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </button>

          <div className="pt-12 grid grid-cols-1 md:grid-cols-3 gap-8 text-left border-t border-white/5">
            {[
              { t: "精选情报", d: "每日自动聚合全球 10+ 深度商业报道" },
              { t: "AI 深度研读", d: "Gemini 3 Pro 提供行业视角洞察" },
              { t: "极简体验", d: "Ulysses 式沉浸阅读，专注策略思考" }
            ].map((item, i) => (
              <div key={i} className="space-y-2">
                <div className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{item.t}</div>
                <div className="text-slate-500 text-xs leading-relaxed">{item.d}</div>
              </div>
            ))}
          </div>
          
          <div className="text-[10px] text-slate-600 font-medium">
            需要选择一个具有计费账户的项目 API Key 以访问高性能模型。
            <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="ml-2 underline hover:text-slate-400">计费说明</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-[#f8f9fa] overflow-hidden">
      <ArticleList 
        categories={categories}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        articles={articles} 
        selectedArticleId={selectedArticleId} 
        setSelectedArticleId={setSelectedArticleId}
        isLoading={isLoading}
        readArticleIds={readArticleIds}
      />

      <div className="flex-1 overflow-hidden relative">
        <div className="absolute top-6 right-8 z-30 flex items-center space-x-3">
          {isLoading && (
            <div className="flex items-center bg-white/95 backdrop-blur px-5 py-2.5 rounded-2xl border border-blue-100 shadow-2xl shadow-blue-500/10 transition-all animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-ping mr-4"></div>
              <span className="text-[12px] font-black text-blue-600 uppercase tracking-[0.3em]">AI 同步中</span>
            </div>
          )}
          
          <button 
            onClick={handleShare}
            className="p-3.5 bg-white border border-slate-100 rounded-2xl shadow-xl hover:shadow-2xl transition-all active:scale-90 text-slate-400 hover:text-indigo-600"
            title="分享给小伙伴"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 100-3.316 3 3 0 000 3.316m0 0a3 3 0 100 3.316 3 3 0 000-3.316" />
            </svg>
          </button>

          <button 
            onClick={handleRefresh}
            disabled={isLoading}
            className="p-3.5 bg-white border border-slate-100 rounded-2xl shadow-xl hover:shadow-2xl transition-all active:scale-90 text-slate-500 hover:text-blue-600 disabled:opacity-30 group"
            title="刷新情报"
          >
            <svg className={`w-6 h-6 ${isLoading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-700'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>

        {/* Share Toast */}
        {showShareToast && (
          <div className="absolute top-24 right-8 z-50 bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-2xl animate-in slide-in-from-right-4 fade-in duration-300 flex items-center space-x-3">
            <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm font-bold">链接已复制，去分享给 PD 同友吧！</span>
          </div>
        )}

        <ArticleView article={currentArticle} isLoading={isLoading && articles.length === 0} />
      </div>
    </div>
  );
};

const categories: Category[] = ['AI', '互联网', '保险', '商业'];

export default App;
