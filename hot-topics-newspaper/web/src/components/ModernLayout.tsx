import type { TopicsData } from '../types';

interface ModernLayoutProps {
  data: TopicsData;
  dateStr: string;
  generatedAt: string;
}

function Hero({ item, category }: { item: TopicsData['entertainment'][0]; category: 'entertainment' | 'digital' | 'ai' }) {
  const catLabel = { entertainment: '娱乐', digital: '数码', ai: 'AI' }[category];
  const body = `${item.title.slice(0, 50)}——这是今日最受关注的话题，引发全网热烈讨论。`;
  return (
    <div className="m-hero">
      <div className="m-hero-number">01</div>
      <div className="m-hero-content">
        <span className={`m-hero-badge ${category}`}>{catLabel} · TOP</span>
        <div className="m-hero-title"><a href={item.url} target="_blank">{item.title}</a></div>
        <div className="m-hero-body">{body}</div>
        {item.hot && <div className="m-hero-heat">{item.hot}</div>}
      </div>
    </div>
  );
}

function Cards({ items }: { items: TopicsData['entertainment'] }) {
  return (
    <>
      {items.map(it => {
        const rankCls = it.rank >= 1 && it.rank <= 3 ? ` rank-top${it.rank}` : '';
        return (
          <div className={`m-card${rankCls}`} key={it.rank}>
            <div className="m-card-num">{it.rank}</div>
            <div className="m-card-body">
              <div className="m-card-title"><a href={it.url} target="_blank">{it.title}</a></div>
              {it.hot && <div className="m-card-heat">{it.hot}</div>}
            </div>
          </div>
        );
      })}
    </>
  );
}

export function ModernLayout({ data, dateStr, generatedAt }: ModernLayoutProps) {
  return (
    <div className="modern-page">
      <header className="m-header">
        <div><h1>热点日报</h1><p className="m-tagline">每日热点 · 一文尽览</p></div>
        <div className="m-header-right"><div className="m-date">{dateStr}</div><div>{generatedAt}</div></div>
      </header>

      {data.entertainment[0] && <Hero item={data.entertainment[0]} category="entertainment" />}

      <section className="m-section">
        <div className="m-section-header">
          <div className="m-section-dot entertainment"></div>
          <h2>娱乐</h2>
          <span className="m-section-count">TOP 10</span>
        </div>
        <div className="m-grid"><Cards items={data.entertainment} /></div>
      </section>

      <section className="m-section">
        <div className="m-section-header">
          <div className="m-section-dot digital"></div>
          <h2>数码</h2>
          <span className="m-section-count">TOP 10</span>
        </div>
        <div className="m-grid"><Cards items={data.digital} /></div>
      </section>

      <section className="m-section">
        <div className="m-section-header">
          <div className="m-section-dot ai"></div>
          <h2>AI</h2>
          <span className="m-section-count">TOP 10</span>
        </div>
        <div className="m-grid"><Cards items={data.ai} /></div>
      </section>

      <footer className="m-footer"><p>Generated at {generatedAt} · Data from public sources</p></footer>
    </div>
  );
}
