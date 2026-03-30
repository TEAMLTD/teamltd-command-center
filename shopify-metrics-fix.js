function displayShopifyMetrics(data) {
    const shopifyMetricsContainer = document.getElementById('shopify-metrics');
    
    const metrics = [
        { 
            label: 'Total Revenue', 
            value: `$${parseFloat(data.totalRevenue).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, 
            type: 'positive' 
        },
        { 
            label: 'Total Orders', 
            value: data.totalOrders.toLocaleString(), 
            type: 'neutral' 
        },
        { 
            label: 'Avg Order Value', 
            value: `$${parseFloat(data.averageOrderValue).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, 
            type: 'positive' 
        }
    ];
    
    shopifyMetricsContainer.innerHTML = metrics.map(metric => `
        <div class="metric-card ${metric.type}">
            <div class="metric-label">${metric.label}</div>
            <div class="metric-value">${metric.value}</div>
            <div class="metric-subtext">${currentDateRange === 'yesterday' ? 'Yesterday' : currentDateRange === 'last_7d' ? 'Last 7 days' : 'Last 30 days'}</div>
        </div>
    `).join('');
}

async function fetchShopifyMetrics() {
    try {
        document.getElementById('shopify-loading').style.display = 'block';
        document.getElementById('shopify-metrics').innerHTML = '';
        document.getElementById('shopify-error').style.display = 'none';
        
        const response = await fetch('/.netlify/functions/shopify-insights', {
            method: 'POST',
            body: JSON.stringify({ dateRange: currentDateRange })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to fetch Shopify data');
        }
        
        displayShopifyMetrics(data.metrics);
        
        document.getElementById('shopify-loading').style.display = 'none';
        
    } catch (error) {
        document.getElementById('shopify-loading').style.display = 'none';
        document.getElementById('shopify-error').style.display = 'block';
        document.getElementById('shopify-error').textContent = `Error loading Shopify data: ${error.message}`;
        console.error('Shopify Error:', error);
    }
}
