import { GoogleGenAI } from "@google/genai";
import { Article, Category } from "../types";

export const fetchLatestIntel = async (category: Category): Promise<Article[]> => {
  // 获取注入的 API_KEY
  const apiKey = process.env.API_KEY;
  
  if (!apiKey || apiKey === 'undefined' || apiKey === 'null') {
    throw new Error("ENV_KEY_MISSING: Vercel 环境变量未读取到，请检查配置并 Redeploy");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const categoryFocus: Record<Category, string> = {
    'AI': '聚焦全球大模型落地、AI Agent、AI 算力以及生成式 AI 在金融保险业的具体应用。',
    '互联网': '聚焦中国大厂动态、平台经济治理、出海趋势以及新一代交互产品。',
    '保险': '聚焦新能源车险（尤其是特斯拉/比亚迪等主机厂进场）、UBI保险、理赔数字化、保险营销科技创新。',
    '商业': '聚焦宏观商业评论、零售演进、供应链变革以及跨行业增长案例。',
    '社科': '聚焦行为心理学、社会学调查、组织行为演进以及其对用户行为和产品决策的潜在影响。'
  };

  const prompt = `
    你是一名服务于“互联网&车险行业”的高级产品专家。请针对 "${category}" 领域，检索过去7天内最具深度的 8 篇硬核报道。
    ${categoryFocus[category]}
    
    输出要求：
    [ITEM_START]
    [TITLE]: 标题
    [SOURCE]: 媒体名
    [URL]: 链接
    [SUMMARY]: 核心内容（背景+3个关键要点）
    [PM_INSIGHT]: 针对产品经理的3条决策参考
    [DETAIL]: 深度逻辑复盘（约 500 字）
    [ITEM_END]

    请直接开始输出，不要废话。
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.1,
      },
    });

    const text = response.text || "";
    const items = text.split('[ITEM_START]').filter(i => i.trim().length > 30);
    
    if (items.length === 0) {
      throw new Error("FORMAT_ERROR: 模型返回的内容无法被正确解析。");
    }

    return items.map((item, index) => {
      const title = item.match(/\[TITLE\]: (.*)/)?.[1]?.trim() || "深度研究报告";
      const source = item.match(/\[SOURCE\]: (.*)/)?.[1]?.trim() || "行业情报";
      const url = item.match(/\[URL\]: (https?:\/\/[^\s]+)/)?.[1]?.trim() || `https://www.google.com/search?q=${encodeURIComponent(title)}`;
      const summary = item.match(/\[SUMMARY\]: ([\s\S]*?)(?=\[PM_INSIGHT\]|$)/)?.[1]?.trim() || "内容解析中...";
      const pmInsight = item.match(/\[PM_INSIGHT\]: ([\s\S]*?)(?=\[DETAIL\]|$)/)?.[1]?.trim() || "洞察提取中...";
      const reconstructedContent = item.match(/\[DETAIL\]: ([\s\S]*?)(?=\[ITEM_END\]|$)/)?.[1]?.trim() || "详细分析生成中...";

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
  } catch (error: any) {
    console.error("Fetch Intel Failed:", error);
    // 将具体错误抛出，让 App 能捕获并显示
    let errorMessage = error.message || "未知错误";
    if (errorMessage.includes("403")) errorMessage = "API Key 无效或权限受限 (403)";
    if (errorMessage.includes("404")) errorMessage = "模型名称错误或 API 暂不可用 (404)";
    if (errorMessage.includes("500")) errorMessage = "Google 服务端繁忙，请稍后再试 (500)";

    return [{
      id: 'error',
      title: '情报舱连接失败',
      source: '系统',
      url: '#',
      summary: `错误原因：${errorMessage}`,
      pmInsight: '排查建议：1. 确认 Vercel 环境变量 API_KEY 结尾没有空格；2. 确认已手动执行 Redeploy；3. 检查 API Key 是否启用了 Gemini API 服务。',
      reconstructedContent: '错误详情: ' + (error instanceof Error ? error.stack : 'No Stack'),
      date: 'ERR',
      category: category,
      readTime: '0'
    }];
  }
};