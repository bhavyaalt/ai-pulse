/**
 * Moltbook Scraper
 * Attempts to fetch posts from moltbook.com
 */

const https = require('https');
const http = require('http');

// Try different endpoints
const ENDPOINTS = [
  'https://www.moltbook.com',
  'https://www.moltbook.com/m/all',
  'https://www.moltbook.com/m/hot',
  'https://www.moltbook.com/api/v1/posts',
  'https://www.moltbook.com/api/posts',
  'https://www.moltbook.com/api/trpc/post.list',
  'https://www.moltbook.com/_next/data/development/index.json',
];

function fetch(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    
    const req = client.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'text/html,application/json,*/*',
        'Accept-Language': 'en-US,en;q=0.9',
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data, headers: res.headers }));
    });
    
    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
  });
}

async function findDataInHTML(html) {
  // Look for __NEXT_DATA__ script tag (Next.js apps embed data here)
  const nextDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (nextDataMatch) {
    try {
      const data = JSON.parse(nextDataMatch[1]);
      console.log('\n✅ Found __NEXT_DATA__!');
      console.log('Props:', JSON.stringify(data.props?.pageProps, null, 2).slice(0, 2000));
      return data;
    } catch (e) {
      console.log('Failed to parse __NEXT_DATA__');
    }
  }

  // Look for any JSON-like data in script tags
  const scriptMatches = html.match(/<script[^>]*>([\s\S]*?)<\/script>/g) || [];
  for (const script of scriptMatches) {
    if (script.includes('posts') || script.includes('agents') || script.includes('submolt')) {
      console.log('\n📦 Found potential data script:', script.slice(0, 500));
    }
  }

  // Look for API calls in the HTML
  const apiMatches = html.match(/["'](\/api\/[^"']+)["']/g) || [];
  if (apiMatches.length > 0) {
    console.log('\n🔗 Found API endpoints:', apiMatches);
  }

  return null;
}

async function main() {
  console.log('🦞 Moltbook Scraper\n');

  for (const url of ENDPOINTS) {
    console.log(`\n📡 Trying: ${url}`);
    try {
      const { status, data, headers } = await fetch(url);
      console.log(`   Status: ${status}`);
      console.log(`   Content-Type: ${headers['content-type']}`);
      console.log(`   Size: ${data.length} bytes`);

      if (status === 200) {
        // Check if it's JSON
        if (headers['content-type']?.includes('json')) {
          console.log('   📦 JSON Response!');
          try {
            const json = JSON.parse(data);
            console.log('   Data:', JSON.stringify(json, null, 2).slice(0, 1000));
          } catch (e) {
            console.log('   Failed to parse JSON');
          }
        } else {
          // It's HTML, look for embedded data
          await findDataInHTML(data);
        }
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }

  // Try to find build ID for Next.js data routes
  console.log('\n\n🔍 Looking for Next.js build ID...');
  try {
    const { data } = await fetch('https://www.moltbook.com');
    const buildIdMatch = data.match(/"buildId":"([^"]+)"/);
    if (buildIdMatch) {
      const buildId = buildIdMatch[1];
      console.log(`   Build ID: ${buildId}`);
      
      // Try fetching with build ID
      const dataUrl = `https://www.moltbook.com/_next/data/${buildId}/index.json`;
      console.log(`   Trying: ${dataUrl}`);
      
      const dataRes = await fetch(dataUrl);
      console.log(`   Status: ${dataRes.status}`);
      if (dataRes.status === 200) {
        console.log('   📦 Data:', dataRes.data.slice(0, 1000));
      }
    }
  } catch (e) {
    console.log(`   Error: ${e.message}`);
  }
}

main().catch(console.error);
