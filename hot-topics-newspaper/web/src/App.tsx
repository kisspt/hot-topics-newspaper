import { useState, useEffect } from 'react';
import type { Theme } from './types';
import { useTopics } from './hooks/useTopics';
import { ThemeSwitch } from './components/ThemeSwitch';
import { VintageLayout } from './components/VintageLayout';
import { ModernLayout } from './components/ModernLayout';
import './App.css';

function App() {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('newspaper-theme');
    return (saved === 'modern' ? 'modern' : 'vintage') as Theme;
  });

  const { data, loading, generatedAt } = useTopics();

  useEffect(() => {
    document.body.className = theme;
    localStorage.setItem('newspaper-theme', theme);
  }, [theme]);

  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  const issueNo = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000);

  if (loading || !data) {
    return (
      <div className="loading-screen">
        <div className="loading-title">The Daily Scoop</div>
        <div className="loading-sub">正在获取今日热点...</div>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <>
      <ThemeSwitch theme={theme} onThemeChange={setTheme} />

      {theme === 'vintage' && (
        <VintageLayout
          data={data}
          dateStr={dateStr}
          issueNo={issueNo}
          generatedAt={generatedAt}
        />
      )}

      {theme === 'modern' && (
        <ModernLayout
          data={data}
          dateStr={dateStr}
          generatedAt={generatedAt}
        />
      )}
    </>
  );
}

export default App;
