#!/bin/bash

# Shopify Token Refresh Script for TEAMLTD

# Path to store token securely
TOKEN_FILE="/Users/henry/.openclaw/secrets/shopify-token.json"
CONFIG_FILE="/Users/henry/.openclaw/secrets/shopify-config.json"

# Ensure secrets directory exists
mkdir -p "$(dirname "$TOKEN_FILE")"

# Create configuration file with app details if not exists
if [ ! -f "$CONFIG_FILE" ]; then
    cat > "$CONFIG_FILE" << INNEREOF
{
    "shop_domain": "teamltd.myshopify.com",
    "client_id": "PLACEHOLDER_CLIENT_ID",
    "client_secret": "PLACEHOLDER_CLIENT_SECRET"
}
INNEREOF
    echo "Created initial Shopify configuration file. PLEASE UPDATE WITH ACTUAL CREDENTIALS!"
    exit 1
fi

# Function to refresh access token
refresh_token() {
    local shop_domain=$(jq -r '.shop_domain' "$CONFIG_FILE")
    local client_id=$(jq -r '.client_id' "$CONFIG_FILE")
    local client_secret=$(jq -r '.client_secret' "$CONFIG_FILE")

    echo "Refreshing Shopify access token..."

    # Use curl to get new token
    local response=$(curl -s "https://$shop_domain/admin/oauth/access_token" \
        -d "client_id=$client_id" \
        -d "client_secret=$client_secret" \
        -d "grant_type=refresh_token" \
        -d "refresh_token=$(jq -r '.refresh_token' "$TOKEN_FILE")")

    # Check for errors
    if echo "$response" | jq -e '.error' > /dev/null; then
        echo "Token refresh failed: $(echo "$response" | jq -r '.error_description')"
        exit 1
    fi

    # Save new token
    echo "$response" | jq '. + {
        "obtained_at": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'", 
        "expires_at": "'$(date -u -v+60d +"%Y-%m-%dT%H:%M:%SZ")'"
    }' > "$TOKEN_FILE"

    echo "Token successfully refreshed and stored securely."

    # Update Netlify environment variables
    netlify env:set SHOPIFY_ACCESS_TOKEN "$(jq -r '.access_token' "$TOKEN_FILE")"
    netlify env:set SHOPIFY_SHOP_DOMAIN "$shop_domain"

    echo "Updated Netlify environment variables"
}

# Main execution
if [ ! -f "$TOKEN_FILE" ]; then
    echo "No existing token found. Please obtain initial token manually."
    exit 1
fi

# Check token expiration
current_time=$(date -u +%s)
token_obtained=$(jq -r '.obtained_at' "$TOKEN_FILE" | xargs -I {} date -u -j -f "%Y-%m-%dT%H:%M:%SZ" {} +%s)
token_expires=$(jq -r '.expires_at' "$TOKEN_FILE" | xargs -I {} date -u -j -f "%Y-%m-%dT%H:%M:%SZ" {} +%s)

if [ $current_time -ge $token_expires ]; then
    refresh_token
else
    echo "Current token is still valid."
fi
