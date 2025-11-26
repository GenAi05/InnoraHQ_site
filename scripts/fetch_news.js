/**
 * fetch_news.js
 * - Reads NEWSAPI_KEY from env
 * - Fetches top AI news (everything endpoint)
 * - Keeps top 10 unique by title
 * - Writes data/news.json
 */

const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

const KEY = process.env.NEWSAPI_KEY;
if(!KEY){
  console.error("Missing NEWSAPI_KEY env var");
  process.exit(1);
}

const OUT = path.join(__dirname, "..", "data", "news.json");
const QUERY = encodeURIComponent("artificial intelligence OR AI OR machine learning OR deep learning OR ChatGPT OR OpenAI");
const URL = `https://newsapi.org/v2/everything?q=${QUERY}&language=en&sortBy=publishedAt&pageSize=30&apiKey=${KEY}`;

(async ()=>{
  try{
    const r = await fetch(URL);
    const j = await r.json();
    if(!j.articles || !Array.isArray(j.articles)){
      console.error("No articles from NewsAPI:", j);
      process.exit(1);
    }
    // dedupe titles
    const seen = new Set();
    const out = [];
    for(const a of j.articles){
      if(!a.title) continue;
      const t = a.title.trim();
      if(seen.has(t)) continue;
      seen.add(t);
      out.push({
        title: a.title,
        description: a.description || "",
        summary: a.description || "",
        url: a.url,
        image: a.urlToImage || null,
        source: a.source && a.source.name ? a.source.name : "",
        publishedAt: a.publishedAt || new Date().toISOString()
      });
      if(out.length>=10) break;
    }

    // if any items have null image, we keep null (frontend uses fallback)
    fs.mkdirSync(path.dirname(OUT), {recursive:true});
    fs.writeFileSync(OUT, JSON.stringify(out, null, 2), 'utf8');
    console.log(`Saved ${out.length} articles to ${OUT}`);
  }catch(err){
    console.error("Error fetch:", err);
    process.exit(1);
  }
})();
