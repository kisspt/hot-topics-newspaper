import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { fetchAll } from './fetchers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());

// Cache: refresh every 30 minutes
let cache = null;
let cacheTime = 0;
const CACHE_TTL = 30 * 60 * 1000; // 30 min

app.get('/api/topics', async (req, res) => {
  const now = Date.now();
  if (cache && (now - cacheTime) < CACHE_TTL) {
    return res.json(cache);
  }
  try {
    const data = await fetchAll();
    cache = {
      data,
      generatedAt: new Date().toLocaleTimeString('zh-CN'),
      cachedAt: now,
    };
    cacheTime = now;
    res.json(cache);
  } catch (err) {
    console.error('Fetch error:', err);
    // Return stale cache if available
    if (cache) {
      return res.json(cache);
    }
    res.status(500).json({ error: 'Failed to fetch topics' });
  }
});

// Serve static build in production
const distPath = join(__dirname, '..', 'dist');
app.use(express.static(distPath));
app.get('*', (req, res) => {
  res.sendFile(join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
