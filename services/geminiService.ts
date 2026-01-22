
import { GoogleGenAI } from "@google/genai";
import { Article, Category } from "../types";

export const fetchLatestIntel = async (category: Category): Promise<Article[]> => {
  // 按照指令：在每次请求前创建新实例
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const categoryFocus: Record<Category, string> = {
    'AI': '聚焦全球及中国最新的 AI 科技动态、大模型应用、AI Agent 实践及 AI 算力趋势。',
    '互联网': '聚焦腾讯、阿里、字节跳动、美团等互联网大厂的核心动作、组织架构调整及新业务尝试。',
    '保险': '聚焦保险行业数字化转型、车险科技、新能源车险政策、非车险创新及行业深度研报。',
    '商业': '聚焦极具深度和趣味性的商业案例分析、消费趋势洞察及全球宏观商业评论。'
  };

  const prompt = `
    你是一名深耕互联网与保险行业、具备极强商业敏感度的顶尖分析师。
    请针对 "${category}" 领域，检索过去7天内最具深度、最值得产品经理研读的 10 篇精选报道或深度长文。
    ${categoryFocus[category]}
    
    输出格式极其严格：
    使用标记 [ITEM_START] 开始每一篇文章，[ITEM_END] 结束。
    
    内部结构：
    [TITLE]: 文章标题
    [SOURCE]: 媒体/公众号名称
    [URL]: 文章的原始直达链接
    [SUMMARY]: 结构化摘要（背景 + 3个关键点）
    [PM_INSIGHT]: 
    1. 业务重构启示：分析其对价值链的影响。
    2. 产品与体验创新：具体的功能或场景灵感。
    3. 演进预判：未来 12 个月的关键趋势。
    [DETAIL]: 深度内容还原（约 500 字）。
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview', // 升级为 Pro 以获得更深度的 PM 洞察
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.2, // 进一步降低随机性，确保链接准确
      },
    });

    const text = response.text || "";
    const items = text.split('[ITEM_START]').filter(i => i.includes('[ITEM_END]'));
    
    return items.map((item, index) => {
      const cleanItem = item.split('[ITEM_END]')[0];
      
      const title = cleanItem.match(/\[TITLE\]: (.*)/)?.[1]?.trim() || "行业深度洞察";
      const source = cleanItem.match(/\[SOURCE\]: (.*)/)?.[1]?.trim() || "分析师频道";
      const urlMatch = cleanItem.match(/\[URL\]: (https?:\/\/[^\s]+)/);
      const summary = cleanItem.match(/\[SUMMARY\]: ([\s\S]*?)(?=\[PM_INSIGHT\]|$)/)?.[1]?.trim() || "内容摘要生成中...";
      const pmInsight = cleanItem.match(/\[PM_INSIGHT\]: ([\s\S]*?)(?=\[DETAIL\]|$)/)?.[1]?.trim() || "战略洞察生成中...";
      const reconstructedContent = cleanItem.match(/\[DETAIL\]: ([\s\S]*)/)?.[1]?.trim() || "深度全文还原中...";
      
      let url = urlMatch ? urlMatch[1] : "";
      if (!url) {
        const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        const foundUrls = chunks.map((c: any) => c.web?.uri).filter(Boolean);
        url = foundUrls[index] || (foundUrls.length > 0 ? foundUrls[index % foundUrls.length] : "https://www.google.com/search?q=" + encodeURIComponent(title));
      }

      return {
        id: `${category}-${index}-${Date.now()}`,
        title,
        source,
        url,
        summary,
        pmInsight,
        reconstructedContent,
        date: new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' }),
        category,
        readTime: `${Math.floor(Math.random() * 3) + 5} 分钟`
      };
    });
  } catch (error) {
    console.error("Error fetching intel:", error);
    throw error; // 抛出错误供 App.tsx 处理（如重置激活状态）
  }
};
