import gplay from 'google-play-scraper';
import store from 'app-store-scraper';
import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';

// Get correct env file path
const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

async function scrapeAll() {
  const reviews = [
    {
      "id": "twitter_manual_001",
      "source": "twitter",
      "content": "Dear @gaana - please tell me you have more than just 10 songs in your library. The recommendations are painfully repetitive. Time to hit the refresh button on that algorithm! 🤦♂️ #Gaana #Frustrated #Music\n\nCurrently wrapping up product teardown of music streaming apps. It's becoming increasingly clear that local incumbents are struggling to keep pace with the UX and algorithmic maturity of leaders like @Spotify and @YouTubeMusic. Gap in recommendation engines is quite significant.",
      "rating": null,
      "timestamp": "2026-06-23T12:00:00.000Z",
      "author": "Aunkar Ranjan",
      "processing_status": "pending",
      "claude_output": null
    },
    {
      "id": "play_manual_001",
      "source": "play_store",
      "content": "The app suffers from a very repetitive recommendation system. It fails to offer fresh, relevant music, often recycling the same small library of tracks. When compared to the discovery features of other major streaming apps, this experience falls well short. I hope the team focuses on a serious update to the recommendation logic and overall UI responsiveness soon.",
      "rating": 1,
      "timestamp": "2026-06-23T12:00:00.000Z",
      "author": "Aunkar Ranjan",
      "processing_status": "pending",
      "claude_output": null
    },
    {
      "id": "medium_manual_spotify_gaana_comparison",
      "source": "medium",
      "content": "Comparative Analysis: Spotify vs Gaana. Spotify offers a straightforward, simple, and clean layout that is easy to navigate and highly intuitive. Gaana, on the other hand, suffers from a much more confusing design with too many buttons and cluttered sections. This excessive complexity creates a high cognitive load for users and causes significant confusion during the discovery process.",
      "rating": null,
      "timestamp": "2026-06-24T12:05:00.000Z",
      "author": "Praniel Gurung",
      "processing_status": "pending",
      "claude_output": null
    },
    {
      "id": "medium_manual_case_study",
      "source": "medium",
      "content": "Case Study on Gaana Home Screen Redesign: Current homepage is overwhelming with 20+ sections causing cognitive overload. Search screen is underutilized. Sharing music is clunky and manual outside the app. 87.5% of users listen based on mood/activity and want to share music, but find it hard to discover new or similar artists. Recommended solutions: Move 'Discover' genres to Search screen. Rename Home to 'My Gaana' with 'Your Daily' activity playlists. Add 'Favorite Artists' section. Implement an in-app social layer 'Music Stories' where friends can listen to 10-second previews and instantly play songs to improve social discovery.",
      "rating": null,
      "timestamp": "2026-06-24T12:00:00.000Z",
      "author": "Medium Design Bootcamp",
      "processing_status": "pending",
      "claude_output": null
    }
  ];
  
  // --- Google Play Store ---
  console.log('Scraping Play Store...');
  try {
    let token;
    for (let page = 0; page < 10; page++) { // Limited to 10 pages for speed
      const batch = await gplay.reviews({
        appId: 'com.gaana',
        lang: 'en',
        country: 'in',
        sort: gplay.sort.NEWEST,
        num: 100,
        paginate: true,
        nextPaginationToken: page === 0 ? undefined : token,
      });
      token = batch.nextPaginationToken;
      reviews.push(...batch.data.map(r => ({
        id: `play_${r.id}`,
        source: 'play_store',
        content: r.text,
        rating: r.score,
        timestamp: r.date,
        author: r.userName || 'anonymous',
        processing_status: 'pending',
        claude_output: null
      })));
      if (!token) break;
      await new Promise(r => setTimeout(r, 1000));
    }
    console.log(`- Got ${reviews.filter(r => r.source === 'play_store').length} reviews.`);
  } catch (e) { console.error('Play Store scraping error:', e.message); }

  // --- App Store ---
  console.log('Scraping App Store...');
  try {
    for (let page = 1; page <= 10; page++) { // Limited to 10 pages for speed
      const batch = await store.reviews({
        id: '585270521',
        country: 'in',
        page,
      });
      reviews.push(...batch.map(r => ({
        id: `appstore_${r.id}`,
        source: 'app_store',
        content: r.text,
        rating: r.score,
        timestamp: r.updated,
        author: r.userName || 'anonymous',
        processing_status: 'pending',
        claude_output: null
      })));
      await new Promise(r => setTimeout(r, 1000));
    }
    console.log(`- Got ${reviews.filter(r => r.source === 'app_store').length} reviews.`);
  } catch (e) { console.error('App Store scraping error:', e.message); }

  // --- Reddit ---
  console.log('Scraping Reddit...');
  try {
    const subreddits = ['indianmusic', 'gaana', 'bollywood'];
    const queries = ['gaana', 'gaana recommendations'];

    for (const sub of subreddits) {
      for (const q of queries) {
        const url = `https://www.reddit.com/r/${sub}/search.json?q=${encodeURIComponent(q)}&limit=15&sort=relevance`;
        const res = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' } });
        const posts = res.data?.data?.children || [];
        reviews.push(...posts.map(p => ({
          id: `reddit_${p.data.id}`,
          source: 'reddit',
          content: `${p.data.title} ${p.data.selftext}`.trim(),
          rating: null,
          timestamp: new Date(p.data.created_utc * 1000).toISOString(),
          author: p.data.author,
          processing_status: 'pending',
          claude_output: null
        })));
        await new Promise(r => setTimeout(r, 500));
      }
    }
    console.log(`- Got ${reviews.filter(r => r.source === 'reddit').length} posts.`);
  } catch (e) { console.error('Reddit scraping error:', e.message); }

  // --- Twitter ---
  console.log('Scraping Twitter (X)...');
  try {
    if (process.env.TWITTER_BEARER_TOKEN && !process.env.TWITTER_BEARER_TOKEN.includes('your_twitter')) {
      const url = `https://api.twitter.com/2/tweets/search/recent?query=gaana&max_results=50&tweet.fields=created_at,author_id`;
      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${process.env.TWITTER_BEARER_TOKEN.trim()}` }
      });
      const tweets = res.data?.data || [];
      reviews.push(...tweets.map(t => ({
        id: `twitter_${t.id}`,
        source: 'twitter',
        content: t.text,
        rating: null,
        timestamp: t.created_at,
        author: t.author_id,
        processing_status: 'pending',
        claude_output: null
      })));
      console.log(`- Got ${tweets.length} tweets.`);
    } else {
      console.log('- Twitter API token not configured properly, skipping...');
    }
  } catch (e) { console.error('Twitter scraping error:', e.response?.data?.title || e.message); }

  // --- Medium ---
  console.log('Scraping Medium...');
  try {
    const tags = ['gaana', 'music-streaming-india'];
    for (const tag of tags) {
      const res = await axios.get(`https://medium.com/feed/tag/${tag}`);
      const $ = cheerio.load(res.data, { xmlMode: true });
      $('item').each((_, el) => {
        const title = $(el).find('title').text();
        const link = $(el).find('link').text();
        const pubDate = $(el).find('pubDate').text();
        let content = $(el).find('content\\:encoded').text() || $(el).find('description').text();
        
        // Remove HTML tags for clean text
        content = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        
        // Take a max 1000 character snippet
        const snippet = content.slice(0, 1000);
        
        reviews.push({
          id: `medium_${crypto.createHash('md5').update(link).digest('hex')}`,
          source: 'medium',
          content: `Title: ${title}\n\n${snippet}`,
          rating: null,
          timestamp: new Date(pubDate).toISOString(),
          author: $(el).find('dc\\:creator').text() || 'medium_author',
          processing_status: 'pending',
          claude_output: null
        });
      });
    }
    console.log(`- Got ${reviews.filter(r => r.source === 'medium').length} articles.`);
  } catch (e) { console.error('Medium scraping error:', e.message); }

  // Deduplication & Length Check
  const seen = new Set();
  const deduped = reviews.filter(r => {
    if (!r.content || r.content.length < 20) return false;
    
    // Create hash from first 100 characters to catch slight variations
    const hash = crypto.createHash('md5').update(r.content.slice(0, 100)).digest('hex');
    if (seen.has(hash)) return false;
    seen.add(hash);
    return true;
  });

  // Ensure 'data' directory exists
  if (!fs.existsSync('data')) {
    fs.mkdirSync('data');
  }

  fs.writeFileSync('data/reviews_raw.json', JSON.stringify(deduped, null, 2));
  console.log(`\n✅ Scraped ${deduped.length} deduplicated reviews and posts → data/reviews_raw.json`);
}

scrapeAll().catch(console.error);
