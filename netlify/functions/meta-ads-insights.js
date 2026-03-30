const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

// Secure token management
async function getMetaAdsCredentials() {
    const configPath = path.join(process.env.HOME, '.openclaw/secrets/meta-ads-config.json');
    const tokenPath = path.join(process.env.HOME, '.openclaw/secrets/meta-ads-token.json');

    try {
        const configData = await fs.readFile(configPath, 'utf8');
        const tokenData = await fs.readFile(tokenPath, 'utf8');

        const config = JSON.parse(configData);
        const token = JSON.parse(tokenData);

        return {
            accessToken: token.access_token,
            adAccountId: config.ad_account_id
        };
    } catch (error) {
        console.error('Failed to read Meta Ads credentials:', error);
        throw new Error('Credentials retrieval failed');
    }
}

exports.handler = async (event, context) => {
    // Validate request is POST
    if (event.httpMethod !== 'POST') {
        return { 
            statusCode: 405, 
            body: JSON.stringify({ error: 'Method not allowed' }) 
        };
    }

    try {
        // Parse request body
        const { dateRange } = JSON.parse(event.body);

        // Get credentials dynamically
        const { accessToken, adAccountId } = await getMetaAdsCredentials();

        // Fetch insights from Meta Ads API
        const response = await axios.get(`https://graph.facebook.com/v21.0/${adAccountId}/insights`, {
            params: {
                access_token: accessToken,
                date_preset: dateRange,
                fields: 'spend,purchase_roas,impressions,clicks,ctr,cpm,cpc,actions,action_values',
                level: 'account'
            }
        });

        // Extract insights
        const insights = response.data.data[0];
        
        // Extract purchase data
        const purchases = insights.actions?.find(a => 
            a.action_type === 'purchase' || a.action_type === 'offsite_conversion.fb_pixel_purchase'
        )?.value || 0;
        
        const revenue = insights.action_values?.find(a => 
            a.action_type === 'purchase' || a.action_type === 'offsite_conversion.fb_pixel_purchase'
        )?.value || 0;
        
        // Extract link clicks
        const linkClicks = insights.actions?.find(a => a.action_type === 'link_click')?.value || 0;
        
        // Extract funnel data
        const landingPageViews = insights.actions?.find(a => a.action_type === 'landing_page_view')?.value || 0;
        const addToCart = insights.actions?.find(a => 
            a.action_type === 'add_to_cart' || a.action_type === 'offsite_conversion.fb_pixel_add_to_cart'
        )?.value || 0;
        const initiateCheckout = insights.actions?.find(a => 
            a.action_type === 'initiate_checkout' || a.action_type === 'offsite_conversion.fb_pixel_initiate_checkout'
        )?.value || 0;
        
        // Calculate ROAS
        const spend = parseFloat(insights.spend || 0);
        const roas = spend > 0 ? (parseFloat(revenue) / spend).toFixed(2) : '0.00';

        // Prepare response
        return {
            statusCode: 200,
            body: JSON.stringify({
                metrics: {
                    purchases: parseInt(purchases).toLocaleString(),
                    revenue: parseFloat(revenue).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}),
                    spend: spend.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}),
                    roas: roas,
                    linkClicks: parseInt(linkClicks).toLocaleString(),
                    ctr: parseFloat(insights.ctr || 0).toFixed(2),
                    cpm: parseFloat(insights.cpm || 0).toFixed(2),
                    cpc: parseFloat(insights.cpc || 0).toFixed(2),
                    impressions: parseInt(insights.impressions || 0).toLocaleString()
                },
                funnel: {
                    landingPageViews: parseInt(landingPageViews),
                    addToCart: parseInt(addToCart),
                    initiateCheckout: parseInt(initiateCheckout),
                    purchases: parseInt(purchases)
                }
            })
        };
    } catch (error) {
        console.error('Meta Ads Insights Error:', error);
        return { 
            statusCode: 500, 
            body: JSON.stringify({ 
                error: error.message || 'Failed to fetch Meta Ads insights' 
            }) 
        };
    }
};
