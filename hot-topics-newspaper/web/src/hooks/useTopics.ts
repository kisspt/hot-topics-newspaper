import { useState, useEffect } from 'react';
import type { TopicsData } from '../types';
import { DEMO_DATA } from '../data/demo';

interface UseTopicsResult {
  data: TopicsData | null;
  loading: boolean;
  error: string | null;
  generatedAt: string;
}

export function useTopics(): UseTopicsResult {
  const [data, setData] = useState<TopicsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatedAt, setGeneratedAt] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function fetchTopics() {
      try {
        const resp = await fetch('/api/topics');
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const json = await resp.json();
        if (!cancelled) {
          setData(json.data);
          setGeneratedAt(json.generatedAt || new Date().toLocaleTimeString('zh-CN'));
          setLoading(false);
        }
      } catch {
        // Fallback to demo data if API unavailable
        if (!cancelled) {
          setData(DEMO_DATA);
          setGeneratedAt(new Date().toLocaleTimeString('zh-CN'));
          setError('使用演示数据（API 不可用）');
          setLoading(false);
        }
      }
    }

    fetchTopics();
    return () => { cancelled = true; };
  }, []);

  return { data, loading, error, generatedAt };
}
