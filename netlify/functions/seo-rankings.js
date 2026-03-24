/**
 * Netlify Function: SEO Rankings
 * Fetches Google Search Console data via REST API
 */

const https = require('https');

function httpsRequest(url, options) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function refreshAccessToken(credentials) {
  const params = new URLSearchParams({
    client_id: credentials.client_id,
    client_secret: credentials.client_secret,
    refresh_token: credentials.refresh_token,
    grant_type: 'refresh_token'
  });
  
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString()
  });
  
  if (!response.ok) {
    throw new Error(`Token refresh failed: ${response.status}`);
  }
  
  const data = await response.json();
  return data.access_token;
}

async function querySearchConsole(accessToken, startDate, endDate) {
  const response = await fetch(
    'https://www.googleapis.com/webmasters/v3/sites/sc-domain%3Ateamltd.com/searchAnalytics/query',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        startDate,
        endDate,
        dimensions: ['query'],
        rowLimit: 100
      })
    }
  );
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`GSC query failed: ${response.status} - ${error}`);
  }
  
  return response.json();
}

exports.handler = async function(event, context) {
  try {
    // Parse credentials from env
    const credentials = JSON.parse(process.env.SEARCH_CONSOLE_TOKEN);
    
    // Refresh access token
    const accessToken = await refreshAccessToken(credentials);
    
    // Calculate date ranges
    const today = new Date();
    const currentWeekEnd = today.toISOString().split('T')[0];
    const currentWeekStart = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
      .toISOString().split('T')[0];
    
    const prevWeekEnd = new Date(today.getTime() - 8 * 24 * 60 * 60 * 1000)
      .toISOString().split('T')[0];
    const prevWeekStart = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000)
      .toISOString().split('T')[0];
    
    // Fetch both weeks
    const [currentWeekData, prevWeekData] = await Promise.all([
      querySearchConsole(accessToken, currentWeekStart, currentWeekEnd),
      querySearchConsole(accessToken, prevWeekStart, prevWeekEnd)
    ]);
    
    // Process data
    const currentWeek = {};
    const prevWeek = {};
    
    (currentWeekData.rows || []).forEach(row => {
      currentWeek[row.keys[0]] = {
        clicks: row.clicks || 0,
        impressions: row.impressions || 0,
        position: row.position || 0
      };
    });
    
    (prevWeekData.rows || []).forEach(row => {
      prevWeek[row.keys[0]] = {
        clicks: row.clicks || 0,
        impressions: row.impressions || 0,
        position: row.position || 0
      };
    });
    
    // Calculate movers
    const movers = [];
    Object.keys(currentWeek).forEach(query => {
      const curr = currentWeek[query];
      const prev = prevWeek[query];
      
      if (prev && prev.position > 0) {
        const change = prev.position - curr.position;
        if (change > 0.5) {
          movers.push({ keyword: query, change: change.toFixed(1), position: curr.position.toFixed(1) });
        }
      }
    });
    movers.sort((a, b) => parseFloat(b.change) - parseFloat(a.change));
    
    // Find opportunities
    const opportunities = [];
    Object.keys(currentWeek).forEach(query => {
      const data = currentWeek[query];
      const ctr = data.clicks / data.impressions;
      
      if (data.impressions > 100 && ctr < 0.05) {
        opportunities.push({
          keyword: query,
          impressions: data.impressions,
          position: data.position.toFixed(1)
        });
      }
    });
    opportunities.sort((a, b) => b.impressions - a.impressions);
    
    // Calculate totals
    const totalClicks = Object.values(currentWeek).reduce((sum, d) => sum + d.clicks, 0);
    const lastWeekClicks = Object.values(prevWeek).reduce((sum, d) => sum + d.clicks, 0);
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        topMovers: movers.slice(0, 3),
        opportunities: opportunities.slice(0, 3),
        totalClicks,
        lastWeekClicks,
        lastUpdated: today.toISOString()
      })
    };
    
  } catch (error) {
    console.error('SEO rankings error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: 'Failed to fetch SEO data',
        message: error.message 
      })
    };
  }
};
