import { GoogleGenAI } from "@google/genai";
import { Article, Category } from "../types";

export const fetchLatestIntel = async (category: Category): Promise<Article[]> => {
  // 每次调用时重新创建实例，确保获取最新的 process.env.API_KEY
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const categoryFocus: Record<Category, string> = {
    'AI': '聚焦全球大模型落地、AI Agent、AI 算力以及生成式 AI 在金融保险业的具体应用。',
    '互联网': '聚焦中国大厂动态、平台经济治理、出海趋势以及新一代交互产品。',
    '保险': '聚焦新能源车险（尤其是特斯拉/比亚迪等主机厂进场）、UBI保险、理赔数字化、保险营销科技创新。',
    '商业': '聚焦宏观商业评论、零售演进、供应链变革以及跨行业增长案例。',
    '社科': '聚焦行为心理学、社会学调查、组织行为演进以及其对用户行为和产品决策的潜在影响。'
  };

  const prompt = `
    你是一名服务于“互联网&车险行业”的高级产品专家。请针对 "${category}" 领域，检索过去7天内最具深度、最硬核的 8 篇长文报道。
    ${categoryFocus[category]}
    
    输出要求：
    请直接输出 8 个情报项，每个项必须严格包含以下标记：
    [ITEM_START]
    [TITLE]: 标题
    [SOURCE]: 媒体名
    [URL]: 链接
    [SUMMARY]: 核心内容（背景+3个关键要点）
    [PM_INSIGHT]: 针对产品经理的3条决策参考（必看）
    [DETAIL]: 深度逻辑复盘（约 500 字，包含业务逻辑、风控或产品细节）
    [ITEM_END]

    注意：请不要输出任何开场白或结束语，直接开始输出 [ITEM_START]。
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', // 使用 Flash 版本以获得极速响应
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.2,
      },
    });

    const text = response.text || "";
    if (!text.includes('[ITEM_START]')) {
      console.warn("Gemini 返回内容格式不标准，尝试二次处理...");
    }

    const items = text.split('[ITEM_START]').filter(i => i.includes('[ITEM_END]') || i.includes('[TITLE]'));
    
    if (items.length === 0) {
      throw new Error("未能解析到任何情报内容");
    }

    return items.map((item, index) => {
      const cleanItem = item.split('[ITEM_END]')[0];
      
      const title = cleanItem.match(/\[TITLE\]: (.*)/)?.[1]?.trim() || "深度研究报告";
      const source = cleanItem.match(/\[SOURCE\]: (.*)/)?.[1]?.trim() || "行业情报";
      const urlMatch = cleanItem.match(/\[URL\]: (https?:\/\/[^\s]+)/);
      const summary = cleanItem.match(/\[SUMMARY\]: ([\s\S]*?)(?=\[PM_INSIGHT\]|$)/)?.[1]?.trim() || "内容解析中...";
      const pmInsight = cleanItem.match(/\[PM_INSIGHT\]: ([\s\S]*?)(?=\[DETAIL\]|$)/)?.[1]?.trim() || "洞察提取中...";
      const reconstructedContent = cleanItem.match(/\[DETAIL\]: ([\s\S]*)/)?.[1]?.trim() || "详细分析生成中...";
      
      // 提取 Grounding 元数据作为备选 URL
      let url = urlMatch ? urlMatch[1] : "";
      if (!url || url.length < 10) {
        const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        url = chunks[index]?.web?.uri || `https://www.google.com/search?q=${encodeURIComponent(title)}`;
      }

      return {
        id: `${category}-${index}-${Date.now()}`,
        title,
        source,
        url,
        summary,
        pmInsight,
        reconstructedContent,
        date: new Date().toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }),
        category,
        readTime: '6 分钟'
      };
    });
  } catch (error) {
    console.error("Fetch Intel Failed:", error);
    // 如果失败，返回一个友好的错误占位
    return [{
      id: 'error',
      title: '情报获取暂时中断',
      source: '系统提示',
      url: '#',
      summary: '由于网络波动或 API 限制，暂时无法获取最新情报。请检查 API_KEY 是否配置正确，或稍后再试。',
      pmInsight: '建议：1. 检查 Vercel 环境变量；2. 确认区域是否支持 Gemini。',
      reconstructedContent: '错误详情: ' + (error instanceof Error ? error.message : String(error)),
      date: 'ERR',
      category: category,
      readTime: '0'
    }];
  }
};