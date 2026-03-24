const { google } = require('googleapis');
require('dotenv').config();

exports.handler = async (event, context) => {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: 'teamltd-ga-reader@henry-march-22.iam.gserviceaccount.com',
        private_key: process.env.GA_PRIVATE_KEY.replace(/\\n/g, '\n')
      },
      scopes: ['https://www.googleapis.com/auth/analytics.readonly']
    });

    const analyticsreporting = google.analyticsreporting({ version: 'v4', auth });

    const response = await analyticsreporting.reports.batchGet({
      requestBody: {
        reportRequests: [{
          viewId: process.env.GA_PROPERTY_ID || '333133275',
          dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
          metrics: [
            { expression: 'ga:sessions' },
            { expression: 'ga:pageviews' },
            { expression: 'ga:transactionRevenue' }
          ]
        }]
      }
    });

    return {
      statusCode: 200,
      body: JSON.stringify(response.data)
    };
  } catch (error) {
    console.error('GA Fetch Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
Add GA metrics Netlify function
