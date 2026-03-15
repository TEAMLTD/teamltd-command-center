const { google } = require('googleapis');

exports.handler = async (event) => {
  try {
    const { dateRange = 'last_7d' } = event.queryStringParameters || {};
    
    // Parse service account from environment
    const serviceAccount = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);
    const propertyId = process.env.GA_PROPERTY_ID;
    
    // Calculate date range
    const today = new Date();
    let startDate, endDate;
    
    if (dateRange === 'yesterday') {
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      startDate = yesterday.toISOString().split('T')[0];
      endDate = yesterday.toISOString().split('T')[0];
    } else if (dateRange === 'last_7d') {
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(today.getDate() - 7);
      startDate = sevenDaysAgo.toISOString().split('T')[0];
      endDate = today.toISOString().split('T')[0];
    } else if (dateRange === 'last_30d') {
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(today.getDate() - 30);
      startDate = thirtyDaysAgo.toISOString().split('T')[0];
      endDate = today.toISOString().split('T')[0];
    }
    
    // Authenticate with service account
    const auth = new google.auth.GoogleAuth({
      credentials: serviceAccount,
      scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
    });
    
    const analyticsData = google.analyticsdata('v1beta');
    
    // Fetch data
    const response = await analyticsData.properties.runReport({
      auth,
      property: `properties/${propertyId}`,
      requestBody: {
        dateRanges: [{ startDate, endDate }],
        metrics: [
          { name: 'sessions' },
          { name: 'totalUsers' },
          { name: 'screenPageViews' },
          { name: 'conversions' },
          { name: 'ecommercePurchases' },
          { name: 'totalRevenue' },
          { name: 'averageSessionDuration' },
          { name: 'bounceRate' }
        ],
      },
    });
    
    const rows = response.data.rows || [];
    const values = rows[0]?.metricValues || [];
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        sessions: parseInt(values[0]?.value || 0),
        users: parseInt(values[1]?.value || 0),
        pageViews: parseInt(values[2]?.value || 0),
        conversions: parseInt(values[3]?.value || 0),
        transactions: parseInt(values[4]?.value || 0),
        revenue: parseFloat(values[5]?.value || 0),
        avgSessionDuration: parseFloat(values[6]?.value || 0),
        bounceRate: parseFloat(values[7]?.value || 0) * 100,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
