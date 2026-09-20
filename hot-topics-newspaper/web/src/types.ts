export interface TopicItem {
  rank: number;
  title: string;
  url: string;
  hot: string;
}

export interface TopicsData {
  entertainment: TopicItem[];
  digital: TopicItem[];
  ai: TopicItem[];
}

export type Theme = 'vintage' | 'modern';
