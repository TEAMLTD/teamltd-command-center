/**
 * Netlify Function: SEO Rankings
 * Serves latest SEO ranking data from Google Search Console
 */

const { google } = require('googleapis');

exports.handler = async function(event, context) {
  try {
    // Load OAuth credentials from environment
    const credentials = JSON.parse(process.env.SEARCH_CONSOLE_TOKEN);
    
    const auth = new google.auth.OAuth2();
    auth.setCredentials(credentials);
    
    const searchconsole = google.searchconsole({ version: 'v1', auth });
    
    // Calculate date ranges
    const today = new Date();
    const currentWeekEnd = today.toISOString().split('T')[0];
    const currentWeekStart = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
      .toISOString().split('T')[0];
    
    const prevWeekEnd = new Date(today.getTime() - 8 * 24 * 60 * 60 * 1000)
      .toISOString().split('T')[0];
    const prevWeekStart = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000)
      .toISOString().split('T')[0];
    
    // Fetch current week data
    const currentWeekData = await searchconsole.searchanalytics.query({
      siteUrl: 'sc-domain:teamltd.com',
      requestBody: {
        startDate: currentWeekStart,
        endDate: currentWeekEnd,
        dimensions: ['query'],
        rowLimit: 100
      }
    });
    
    // Fetch previous week data
    const prevWeekData = await searchconsole.searchanalytics.query({
      siteUrl: 'sc-domain:teamltd.com',
      requestBody: {
        startDate: prevWeekStart,
        endDate: prevWeekEnd,
        dimensions: ['query'],
        rowLimit: 100
      }
    });
    
    // Process data
    const currentWeek = {};
    const prevWeek = {};
    
    (currentWeekData.data.rows || []).forEach(row => {
      currentWeek[row.keys[0]] = {
        clicks: row.clicks || 0,
        impressions: row.impressions || 0,
        position: row.position || 0
      };
    });
    
    (prevWeekData.data.rows || []).forEach(row => {
      prevWeek[row.keys[0]] = {
        clicks: row.clicks || 0,
        impressions: row.impressions || 0,
        position: row.position || 0
      };
    });
    
    // Calculate top movers (improvements)
    const movers = [];
    Object.keys(currentWeek).forEach(query => {
      const curr = currentWeek[query];
      const prev = prevWeek[query];
      
      if (prev && prev.position > 0) {
        const change = prev.position - curr.position; // Positive = improvement
        if (change > 0.5) {
          movers.push({ keyword: query, change, position: curr.position });
        }
      }
    });
    
    movers.sort((a, b) => b.change - a.change);
    
    // Find opportunities (high impressions, low CTR)
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
    
    // Calculate total clicks
    const totalClicks = Object.values(currentWeek)
      .reduce((sum, data) => sum + data.clicks, 0);
    
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
        lastUpdated: today.toISOString()
      })
    };
    
  } catch (error) {
    console.error('SEO rankings error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch SEO data' })
    };
  }
};
