import { GoogleGenAI } from "@google/genai";
import { Article, Category } from "../types";

export const fetchLatestIntel = async (category: Category): Promise<Article[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const categoryFocus: Record<Category, string> = {
    'AI': '聚焦全球大模型落地、AI Agent、AI 算力以及生成式 AI 在金融保险业的具体应用。',
    '互联网': '聚焦中国大厂动态、平台经济治理、出海趋势以及新一代交互产品。',
    '保险': '聚焦新能源车险（尤其是特斯拉/比亚迪等主机厂进场）、UBI保险、理赔数字化、保险营销科技创新。',
    '商业': '聚焦宏观商业评论、零售演进、供应链变革以及极具参考价值的跨行业增长案例。',
    '社科': '聚焦行为心理学、社会学调查、组织行为演进以及其对用户行为和产品决策的潜在影响。'
  };

  const prompt = `
    你是一名服务于“互联网&车险行业”的高级产品专家。请针对 "${category}" 领域，检索过去7天内最具深度、最硬核的 8 篇长文报道。
    ${categoryFocus[category]}
    
    输出要求：
    1. 标题必须有冲击力且专业。
    2. URL必须是真实的直达链接（如财新、36氪、晚点LatePost等）。
    3. PM_INSIGHT 部分必须从产品策略、业务重构、风控创新角度出发。
    
    输出格式标记：
    [ITEM_START]
    [TITLE]: 标题
    [SOURCE]: 媒体名
    [URL]: 链接
    [SUMMARY]: 核心内容（背景+3要点）
    [PM_INSIGHT]: 针对产品经理的3条决策参考（必看）
    [DETAIL]: 深度逻辑复盘（约 500 字）
    [ITEM_END]
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.1,
      },
    });

    const text = response.text || "";
    const items = text.split('[ITEM_START]').filter(i => i.includes('[ITEM_END]'));
    
    return items.map((item, index) => {
      const cleanItem = item.split('[ITEM_END]')[0];
      
      const title = cleanItem.match(/\[TITLE\]: (.*)/)?.[1]?.trim() || "深度研究报告";
      const source = cleanItem.match(/\[SOURCE\]: (.*)/)?.[1]?.trim() || "PM Intelligence";
      const urlMatch = cleanItem.match(/\[URL\]: (https?:\/\/[^\s]+)/);
      const summary = cleanItem.match(/\[SUMMARY\]: ([\s\S]*?)(?=\[PM_INSIGHT\]|$)/)?.[1]?.trim() || "内容正在研读中...";
      const pmInsight = cleanItem.match(/\[PM_INSIGHT\]: ([\s\S]*?)(?=\[DETAIL\]|$)/)?.[1]?.trim() || "洞察提取中...";
      const reconstructedContent = cleanItem.match(/\[DETAIL\]: ([\s\S]*)/)?.[1]?.trim() || "详细分析生成中...";
      
      let url = urlMatch ? urlMatch[1] : "";
      if (!url) {
        const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        url = chunks[index]?.web?.uri || "https://www.google.com/search?q=" + encodeURIComponent(title);
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
    throw error;
  }
};