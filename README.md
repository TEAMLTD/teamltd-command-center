# TEAMLTD Command Center

A real-time Meta Ads dashboard that pulls performance data directly from the Facebook Marketing API.

## Features

- **Real-time data**: Pulls fresh metrics every 5 minutes
- **No server needed**: Runs entirely in the browser
- **7-day metrics**: Website Purchases, Revenue, Spend, ROAS, Link Clicks, CTR, CPM, CPC, Impressions
- **Auto-refresh**: Updates automatically
- **Clean design**: TEAMLTD branded with company logo

## Deployment to Netlify

### Quick Deploy

1. **Create Netlify account** (if not already):
   - Go to https://app.netlify.com
   - Sign in with henry@teamltd.com

2. **Deploy via Netlify CLI**:
   ```bash
   npm install -g netlify-cli
   cd /Users/henry/.openclaw/workspace/teamltd-command-center
   netlify login
   netlify deploy --prod --dir .
   ```

3. **Or deploy via drag-and-drop**:
   - Go to https://app.netlify.com/drop
   - Drag the entire `teamltd-command-center` folder
   - Site will be live immediately

### Manual Upload

1. Log in to https://app.netlify.com with henry@teamltd.com
2. Click "Add new site" → "Deploy manually"
3. Drag the `teamltd-command-center` folder into the upload area
4. Your site will be live at a random URL (e.g., `https://random-name-123.netlify.app`)
5. Rename it: Site settings → Change site name → `teamltd-command-center`

## Configuration

The dashboard is pre-configured with:
- **Ad Account**: act_23302665
- **Access Token**: Embedded in code (currently valid)
- **Date Range**: Last 7 days

### Token Expiration

Meta access tokens expire. When that happens:
1. Generate a new token at https://developers.facebook.com/tools/explorer
2. Edit `index.html` line 127 and replace `ACCESS_TOKEN` value
3. Redeploy to Netlify

## Local Testing

Open `index.html` directly in a browser or:

```bash
python3 -m http.server 8000
# Visit http://localhost:8000
```

## Metrics Displayed

| Metric | Description |
|--------|-------------|
| Website Purchases | Total purchase conversions |
| Revenue | Total purchase value |
| Spend | Total ad spend |
| ROAS | Return on ad spend (Revenue ÷ Spend) |
| Link Clicks | Total link clicks |
| CTR | Click-through rate |
| CPM | Cost per 1000 impressions |
| CPC | Cost per click |
| Impressions | Total impressions |

## Cost

- **Hosting**: Free (Netlify free tier)
- **API calls**: Free (Meta Marketing API has no cost, only rate limits)
- **No AI usage**: Dashboard runs in browser, no OpenRouter costs

## Support

Built for TEAMLTD by Henry (henry@teamltd.com)
