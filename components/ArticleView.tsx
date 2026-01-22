
import React, { useState, useEffect } from 'react';
import { Article } from '../types';

interface ArticleViewProps {
  article: Article | null;
  isLoading: boolean;
}

const ArticleView: React.FC<ArticleViewProps> = ({ article, isLoading }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);

  const loadingMessages = [
    "连接全球情报中心...",
    "Gemini 正在深度研读...",
    "AI 驱动的 PM 洞察提取中...",
    "重构行业知识图谱...",
    "情报库同步完成..."
  ];

  useEffect(() => {
    setIsExpanded(true);
  }, [article?.id]);

  useEffect(() => {
    let interval: any;
    if (isLoading) {
      interval = setInterval(() => {
        setLoadingMsgIdx(prev => (prev + 1) % loadingMessages.length);
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  if (isLoading) {
    return (
      <div className="flex-1 bg-white h-screen flex flex-col items-center justify-center p-12">
        <div className="max-w-md w-full flex flex-col items-center space-y-10">
          {/* Simplified Centered Pulse */}
          <div className="relative group">
            <div className="absolute inset-0 bg-blue-500/10 rounded-3xl blur-2xl group-hover:bg-blue-500/20 transition-all duration-1000"></div>
            <div className="relative w-16 h-16 bg-white border border-blue-50 rounded-[1.5rem] flex items-center justify-center shadow-2xl shadow-blue-500/10">
               <div className="w-4 h-4 bg-blue-600 rounded-full animate-ping opacity-40"></div>
               <div className="absolute w-2 h-2 bg-blue-600 rounded-full"></div>
            </div>
          </div>

          <div className="text-center space-y-3">
            <div className="h-8 relative overflow-hidden">
              <div 
                key={loadingMsgIdx} 
                className="text-lg font-bold text-slate-800 tracking-tight animate-in fade-in slide-in-from-bottom-2 duration-700 fill-mode-forwards"
              >
                {loadingMessages[loadingMsgIdx]}
              </div>
            </div>
            <p className="text-[11px] font-black text-slate-300 uppercase tracking-[0.2em] animate-pulse">
              Deep Thinking in Progress
            </p>
          </div>

          {/* Simple, Elegant Single Progress Line */}
          <div className="w-48 h-[1px] bg-slate-100 relative overflow-hidden rounded-full">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500 to-transparent w-full h-full animate-shimmer"></div>
          </div>
        </div>

        <style>{`
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
          .animate-shimmer {
            animation: shimmer 1.8s infinite cubic-bezier(0.4, 0, 0.2, 1);
          }
        `}</style>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="flex-1 bg-[#fcfcfc] h-screen flex flex-col items-center justify-center text-slate-300 select-none">
        <div className="text-center animate-in slide-in-from-bottom-4 duration-700">
          <div className="w-20 h-20 mx-auto mb-8 bg-white rounded-[2rem] flex items-center justify-center text-slate-100 border border-slate-100 shadow-xl shadow-slate-200/50">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <p className="text-xl font-black text-slate-400 tracking-tight">请选择情报开始研读</p>
        </div>
      </div>
    );
  }

  const formatText = (text: string, isLightInsight: boolean = false) => {
    if (!text) return null;
    return text.split('\n').map((line, i) => {
      const trimmed = line.trim();
      if (!trimmed) return null;
      
      if (trimmed.match(/^\d+\./)) {
        return (
          <p key={i} className={`mt-6 mb-3 font-black text-[17px] border-l-4 pl-4 py-1 tracking-tight ${
            isLightInsight ? 'border-indigo-500 text-indigo-900' : 'border-blue-600 text-slate-900'
          }`}>
            {trimmed}
          </p>
        );
      }
      
      if (trimmed.startsWith('-') || trimmed.startsWith('*') || trimmed.startsWith('•')) {
        return (
          <li key={i} className={`ml-4 mb-3 font-normal leading-relaxed pl-1 list-disc text-[15px] ${
            isLightInsight ? 'text-slate-700 marker:text-indigo-400' : 'text-gray-700 marker:text-blue-600'
          }`}>
            {trimmed.replace(/^[-*•]\s*/, '').trim()}
          </li>
        );
      }
      
      return (
        <p key={i} className={`mb-4 font-normal text-[15px] leading-relaxed ${
          isLightInsight ? 'text-slate-600' : 'text-gray-600'
        }`}>
          {trimmed}
        </p>
      );
    });
  };

  return (
    <div className="flex-1 bg-white h-screen overflow-y-auto selection:bg-blue-100 scroll-smooth animate-in fade-in duration-500">
      <div className="max-w-6xl mx-auto px-6 md:px-12 py-10">
        
        <header className="mb-12 border-b border-slate-50 pb-10">
          <div className="flex items-center space-x-3 text-[10px] font-black tracking-[0.2em] uppercase mb-5 text-blue-600">
            <span className="bg-blue-50 px-3 py-1 rounded-lg border border-blue-100 shadow-sm">{article.category}</span>
            <span className="text-slate-300 font-mono">{article.date}</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-400">{article.readTime}</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8">
            <h1 className="text-3xl md:text-[44px] font-black text-slate-900 leading-[1.1] tracking-tighter flex-1">
              {article.title}
            </h1>
            <div className="flex items-center space-x-3 bg-slate-50 px-5 py-2.5 rounded-2xl shrink-0 border border-slate-100 shadow-sm">
               <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white font-black text-lg">
                 {article.source.substring(0,1)}
               </div>
               <div>
                 <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest leading-none mb-1">Source</p>
                 <p className="text-sm font-bold text-slate-700 leading-none">{article.source}</p>
               </div>
            </div>
          </div>
        </header>

        <main className="space-y-16">
          {/* 1. 关键概览 */}
          <section>
            <div className="flex items-center mb-6 space-x-3">
              <div className="w-2 h-7 bg-blue-600 rounded-full"></div>
              <h2 className="text-[20px] font-black text-slate-800 tracking-tight">关键概览</h2>
            </div>
            <div className="bg-slate-50/50 p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="prose-container max-w-4xl">
                {formatText(article.summary)}
              </div>
            </div>
          </section>

          {/* 2. 对产品经理启示 */}
          <section className="pt-4">
            <div className="flex items-center mb-6 space-x-3">
              <div className="w-2 h-7 bg-indigo-600 rounded-full"></div>
              <h2 className="text-[20px] font-black text-slate-800 tracking-tight">对产品经理启示</h2>
            </div>
            <div className="bg-indigo-50/30 rounded-[2.5rem] p-10 border border-indigo-100 relative overflow-hidden group">
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/5 rounded-full blur-[80px] group-hover:bg-indigo-500/10 transition-colors duration-700"></div>
              
              <div className="relative z-10">
                <div className="grid grid-cols-1 gap-4">
                  {formatText(article.pmInsight, true)}
                </div>
              </div>
            </div>
          </section>

          {/* 3. AI 原文解读 */}
          <section className="pt-4 pb-20">
             <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
               <div className="flex items-center space-x-3">
                 <div className="w-2 h-7 bg-green-500 rounded-full shadow-[0_0_12px_rgba(34,197,94,0.3)]"></div>
                 <h2 className="text-[20px] font-black text-slate-800 tracking-tight">AI 原文解读</h2>
               </div>
               
               <div className="flex items-center space-x-3">
                 <button 
                   onClick={() => setIsExpanded(!isExpanded)}
                   className="px-5 py-2.5 bg-blue-50 text-blue-600 text-[11px] font-black rounded-xl hover:bg-blue-100 transition-all active:scale-95 flex items-center space-x-2 uppercase tracking-widest border border-blue-100 shadow-sm"
                 >
                   <span>{isExpanded ? '收起详情' : '展开全文'}</span>
                   <svg className={`w-3.5 h-3.5 transition-transform duration-500 ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                   </svg>
                 </button>
               </div>
             </div>
             
             <div className={`relative transition-all duration-700 ease-in-out overflow-hidden ${isExpanded ? 'max-h-[8000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="bg-[#fcfbf7] p-10 md:p-14 rounded-[3rem] border border-[#f0eee4] shadow-inner mb-4 flex flex-col">
                   <div className="prose prose-slate max-w-none text-slate-800 leading-[1.8] font-medium text-[16px]">
                      {article.reconstructedContent.split('\n').map((line, i) => {
                        const content = line.trim();
                        if (!content) return <div key={i} className="h-6" />;
                        return <p key={i} className="mb-6 last:mb-0">{content}</p>;
                      })}
                   </div>
                   
                   <div className="mt-14 flex justify-center pt-10 border-t border-slate-200/40">
                     <a 
                        href={article.url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="group relative flex items-center space-x-4 bg-slate-900 px-12 py-5 rounded-2xl font-black text-[13px] text-white overflow-hidden transition-all hover:bg-blue-600 hover:shadow-2xl hover:shadow-blue-500/30 hover:-translate-y-1 active:scale-95 uppercase tracking-[0.2em]"
                     >
                       <span className="relative z-10">查看原始长文</span>
                       <div className="relative z-10 w-6 h-6 bg-white/10 rounded-lg flex items-center justify-center group-hover:bg-white/20 transition-colors">
                         <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                         </svg>
                       </div>
                       <div className="absolute inset-0 bg-gradient-to-r from-blue-600/0 via-white/5 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                     </a>
                   </div>
                </div>
             </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default ArticleView;
