
export type Category = 'AI' | '互联网' | '保险' | '商业';

export interface Article {
  id: string;
  title: string;
  source: string;
  url: string;
  summary: string;
  pmInsight: string;
  reconstructedContent: string;
  date: string;
  category: Category;
  readTime: string;
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}
