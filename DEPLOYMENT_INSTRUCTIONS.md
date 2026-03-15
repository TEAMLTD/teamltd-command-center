# Google Analytics Deployment Instructions

## ✅ Completed Tasks

1. ✅ Updated `index.html` with Google Analytics section
2. ✅ Added JavaScript to fetch from `/.netlify/functions/ga-data`
3. ✅ Implemented metrics display: Sessions, Users, Page Views, Transactions, Revenue, Avg Session Duration, Bounce Rate
4. ✅ Applied same card styling as Meta Ads section
5. ✅ Color coded metrics (transactions/revenue=green, bounce rate=red, others=blue)
6. ✅ Created `netlify.toml` configuration file
7. ✅ Updated README.md with environment variable setup
8. ✅ Git committed and pushed to main branch

## 🚀 Next Steps for Jamie

### Step 1: Deploy to Netlify (if not already deployed)

If the site is already deployed on Netlify and connected to the GitHub repo, it will auto-deploy from the latest push.

**If you need to set up Netlify for the first time:**

1. Go to https://app.netlify.com
2. Sign in with henry@teamltd.com
3. Click "Add new site" → "Import an existing project"
4. Choose "GitHub" and authorize Netlify
5. Select the `TEAMLTD/teamltd-command-center` repository
6. Click "Deploy site" (Netlify will auto-detect the settings from `netlify.toml`)

### Step 2: Configure Environment Variables (REQUIRED)

Google Analytics **will not work** until you set up these environment variables:

1. Go to your Netlify site dashboard
2. Navigate to **Site settings** → **Environment variables**
3. Click "Add a variable"

#### Variable 1: GOOGLE_SERVICE_ACCOUNT

- **Key:** `GOOGLE_SERVICE_ACCOUNT`
- **Value:** Copy the ENTIRE contents of `/Users/henry/.openclaw/workspace/teamltd-command-center/service-account.json`
- **Scope:** All (same value for all deploy contexts)

**How to get the value:**
```bash
cat /Users/henry/.openclaw/workspace/teamltd-command-center/service-account.json
```
Copy the entire JSON output (it should start with `{"type":"service_account"...`)

#### Variable 2: GA_PROPERTY_ID

- **Key:** `GA_PROPERTY_ID`
- **Value:** `333133275`
- **Scope:** All (same value for all deploy contexts)

### Step 3: Redeploy

After adding the environment variables:

1. Go to **Deploys** tab
2. Click **Trigger deploy** → **Deploy site**
3. Wait 1-2 minutes for the build to complete

### Step 4: Verify

1. Visit your Netlify URL (e.g., `https://teamltd-command-center.netlify.app`)
2. You should see:
   - Meta Ads section (already working)
   - **Google Analytics section** with 7 metrics
   - All data updating when you click date range buttons

## 🔍 Troubleshooting

### "Error loading Google Analytics data"

**Check:**
1. Are environment variables set correctly in Netlify?
2. Is the GA Property ID correct? (`333133275`)
3. Does the service account have access to the GA property?
4. Check Netlify function logs: Site settings → Functions → ga-data → View logs

### How to verify service account access

1. Go to https://analytics.google.com
2. Admin → Property settings → Property Access Management
3. Verify the service account email is listed with "Viewer" or higher permissions
   - Email should be: `teamltd-command-center@teamltd-439223.iam.gserviceaccount.com`

## 📋 File Locations

- **Dashboard:** `/Users/henry/.openclaw/workspace/teamltd-command-center/index.html`
- **Netlify Function:** `/Users/henry/.openclaw/workspace/teamltd-command-center/netlify/functions/ga-data.js`
- **Service Account (DO NOT COMMIT):** `/Users/henry/.openclaw/workspace/teamltd-command-center/service-account.json`
- **Config:** `/Users/henry/.openclaw/workspace/teamltd-command-center/netlify.toml`

## 🔐 Security Notes

- ✅ `service-account.json` is in `.gitignore` (not committed to GitHub)
- ✅ Credentials are stored in Netlify environment variables (secure)
- ✅ Service account has read-only access to Google Analytics

## 🎯 Deployment URL

Once deployed, your dashboard will be available at:
- **Custom domain:** (if configured) `https://command.teamltd.com`
- **Netlify domain:** `https://teamltd-command-center.netlify.app` (or similar)

Check your Netlify dashboard for the exact URL.
