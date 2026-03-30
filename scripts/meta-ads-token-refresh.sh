#!/bin/bash

# Meta Ads Token Refresh Script for TEAMLTD Command Center

# Exit on any error
set -e

# Logging function
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $*"
}

# Path to store token securely
TOKEN_FILE="/Users/henry/.openclaw/secrets/meta-ads-token.json"
CONFIG_FILE="/Users/henry/.openclaw/secrets/meta-ads-config.json"

# Ensure secrets directory exists
mkdir -p "$(dirname "$TOKEN_FILE")"

# Create configuration file with app details if not exists
if [ ! -f "$CONFIG_FILE" ]; then
    cat > "$CONFIG_FILE" << INNEREOF
{
    "app_id": "26318289024471194",
    "app_secret": "PLACEHOLDER_APP_SECRET",
    "access_token_type": "PAGE",
    "ad_account_id": "act_23302665"
}
INNEREOF
    log "Created initial configuration file. PLEASE UPDATE WITH ACTUAL APP SECRET!"
    exit 1
fi

# Function to refresh access token
refresh_token() {
    local app_id=$(jq -r '.app_id' "$CONFIG_FILE")
    local app_secret=$(jq -r '.app_secret' "$CONFIG_FILE")
    local ad_account_id=$(jq -r '.ad_account_id' "$CONFIG_FILE")

    log "Refreshing Meta Ads access token..."

    # Use curl to get new token
    local response=$(curl -s "https://graph.facebook.com/v21.0/oauth/access_token" \
        -d "grant_type=fb_exchange_token" \
        -d "client_id=$app_id" \
        -d "client_secret=$app_secret" \
        -d "fb_exchange_token=$(jq -r '.access_token' "$TOKEN_FILE")")

    # Check for errors
    if echo "$response" | jq -e '.error' > /dev/null; then
        log "Token refresh failed: $(echo "$response" | jq -r '.error.message')"
        exit 1
    fi

    # Save new token
    echo "$response" | jq '. + {
        "obtained_at": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'", 
        "expires_at": "'$(date -u -v+60d +"%Y-%m-%dT%H:%M:%SZ")'"
    }' > "$TOKEN_FILE"

    log "Token successfully refreshed and stored securely."

    # Update Netlify environment variables
    netlify env:set META_ADS_ACCESS_TOKEN "$(jq -r '.access_token' "$TOKEN_FILE")"
    netlify env:set META_ADS_APP_ID "$app_id"
    netlify env:set META_ADS_ACCOUNT_ID "$ad_account_id"

    log "Updated Netlify environment variables"
}

# Main execution
if [ ! -f "$TOKEN_FILE" ]; then
    log "No existing token found. Please obtain initial token manually."
    exit 1
fi

# Check token expiration
current_time=$(date -u +%s)
token_obtained=$(jq -r '.obtained_at' "$TOKEN_FILE" | xargs -I {} date -u -j -f "%Y-%m-%dT%H:%M:%SZ" {} +%s)
token_expires=$(jq -r '.expires_at' "$TOKEN_FILE" | xargs -I {} date -u -j -f "%Y-%m-%dT%H:%M:%SZ" {} +%s)

if [ $current_time -ge $token_expires ]; then
    refresh_token
else
    log "Current token is still valid."
fi
