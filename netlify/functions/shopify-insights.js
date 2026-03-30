const axios = require('axios');

exports.handler = async (event, context) => {
    // Validate request
    if (event.httpMethod !== 'POST') {
        return { 
            statusCode: 405, 
            body: JSON.stringify({ error: 'Method not allowed' }) 
        };
    }

    try {
        // Get credentials from environment variables
        const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;
        const shopDomain = process.env.SHOPIFY_SHOP_DOMAIN;

        if (!accessToken || !shopDomain) {
            throw new Error('Missing Shopify credentials');
        }

        // Parse request body
        const { dateRange } = JSON.parse(event.body);

        // Fetch Shopify orders
        const response = await axios.get(`https://${shopDomain}/admin/api/2023-04/orders.json`, {
            headers: {
                'X-Shopify-Access-Token': accessToken,
                'Content-Type': 'application/json'
            },
            params: {
                status: 'any',
                created_at_min: dateRange === 'yesterday' ? 
                    new Date(Date.now() - 24*60*60*1000).toISOString() : 
                    (dateRange === 'last_7d' ? 
                        new Date(Date.now() - 7*24*60*60*1000).toISOString() : 
                        new Date(Date.now() - 30*24*60*60*1000).toISOString())
            }
        });

        // Process order data
        const orders = response.data.orders;
        const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.total_price), 0);
        const totalOrders = orders.length;
        const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

        // Prepare response
        return {
            statusCode: 200,
            body: JSON.stringify({
                metrics: {
                    totalRevenue: totalRevenue.toFixed(2),
                    totalOrders: totalOrders,
                    averageOrderValue: averageOrderValue.toFixed(2)
                }
            })
        };
    } catch (error) {
        console.error('Shopify Insights Error:', error);
        return { 
            statusCode: 500, 
            body: JSON.stringify({ 
                error: error.message || 'Failed to fetch Shopify insights' 
            }) 
        };
    }
};
