# Render.com Deployment Guide

Complete step-by-step guide to deploy your Telegram bot on Render.com.

## 📋 Overview

**Render Free Tier:**
- ✅ Background Workers (for bots) - 750 hours/month
- ✅ Automatic HTTPS
- ✅ Easy GitHub integration
- ⚠️ Spins down after 15 min inactivity (but wakes up automatically)
- ✅ Perfect for Telegram bots

## 🚀 Step-by-Step Deployment

### Step 1: Push Code to GitHub

1. Make sure your code is in a GitHub repository
2. If not already pushed:
   ```bash
   git add .
   git commit -m "Prepare for Render deployment"
   git push origin main
   ```

### Step 2: Sign Up for Render

1. Go to [render.com](https://render.com)
2. Click **"Get Started for Free"**
3. Sign up with GitHub (recommended) or email

### Step 3: Create a New Background Worker

1. Once logged in, click **"New +"** button (top right)
2. Select **"Background Worker"** (NOT Web Service)
3. Connect your GitHub account if prompted
4. Select your repository
5. Select the branch (usually `main` or `master`)

### Step 4: Configure the Service

Fill in the configuration form:

#### Basic Settings:
- **Name**: `telegram-bot` (or any name you like)
- **Region**: Choose closest to you (e.g., `Oregon (US West)`)
- **Branch**: `main` (or your default branch)

#### Build & Deploy:
- **Root Directory**: Leave empty (or `neymarexnessbot` if your bot is in a subdirectory)
- **Environment**: `Python 3`
- **Build Command**: 
  ```bash
  pip install -r requirements.txt
  ```
- **Start Command**: 
  ```bash
  python bot.py
  ```

#### Environment Variables:
Click **"Add Environment Variable"** and add these one by one:

1. **BOT_TOKEN**
   - Key: `BOT_TOKEN`
   - Value: Your Telegram bot token

2. **ADMIN_ID**
   - Key: `ADMIN_ID`
   - Value: Your Telegram user ID

3. **API_SECRET**
   - Key: `API_SECRET`
   - Value: Your API secret key

4. **FIREBASE_KEY_B64** (for Firebase credentials)
   - Key: `FIREBASE_KEY_B64`
   - Value: Run `python setup_firebase_env.py` locally to get this value
   - OR: You can upload `firebase-key.json` as a secret file (see Step 5)

5. **PORT** (optional - Render sets this automatically)
   - Key: `PORT`
   - Value: `5000`

### Step 5: Set Up Firebase Credentials

You have two options:

#### Option A: Using Environment Variable (Recommended)
1. On your local machine, run:
   ```bash
   cd neymarexnessbot
   python setup_firebase_env.py
   ```
2. Copy the `FIREBASE_KEY_B64` value
3. Add it as an environment variable in Render (Step 4)

#### Option B: Using Secret Files (Alternative)
1. In Render, go to your service settings
2. Look for "Secret Files" section
3. Upload `firebase-key.json`
4. Update the path in your code if needed

### Step 6: Deploy

1. Scroll down and click **"Create Background Worker"**
2. Render will start building and deploying your bot
3. Watch the build logs - you should see:
   - Installing dependencies
   - Starting your bot
   - `🤖 Bot is starting…`
   - `Scheduler started`

### Step 7: Monitor Your Bot

1. Once deployed, go to your service dashboard
2. Click on **"Logs"** tab to see real-time logs
3. You should see your bot starting up
4. Test in Telegram by sending `/start` to your bot

## 🔧 Using render.yaml (Optional - Advanced)

If you prefer configuration as code, you can use the `render.yaml` file:

1. Make sure `render.yaml` is in your repository root
2. In Render, when creating the service, select **"Apply render.yaml"**
3. Render will read the configuration from the file

The `render.yaml` file is already created in your project!

## 📝 Important Notes

### Free Tier Limitations:
- ⚠️ **750 hours/month** - Usually enough for 24/7 operation
- ⚠️ **Spins down after 15 min inactivity** - Bot will wake up when it receives a message
- ✅ **Automatic restarts** - Bot restarts if it crashes
- ✅ **Free SSL** - Automatic HTTPS

### About the 15-Minute Spin-Down:
- Your bot will automatically wake up when Telegram sends an update
- There might be a slight delay (few seconds) on the first message after spin-down
- For always-on (no spin-down), upgrade to **Starter plan ($7/month)**

### Environment Variables:
- All sensitive data should be in environment variables
- Never commit `.env` files or `firebase-key.json` to GitHub
- Use Render's environment variable interface

## 🐛 Troubleshooting

### Bot Not Starting?

1. **Check Logs:**
   - Go to your service dashboard
   - Click **"Logs"** tab
   - Look for error messages

2. **Common Issues:**
   - **Module not found**: Check `requirements.txt` includes all packages
   - **Firebase error**: Verify `FIREBASE_KEY_B64` is set correctly
   - **Token error**: Verify `BOT_TOKEN` is correct
   - **Port error**: Make sure bot uses `PORT` environment variable

### Bot Stops Working?

1. Check if it exceeded free tier hours (750 hours/month)
2. Check logs for errors
3. Verify environment variables are still set
4. Try restarting the service (click "Manual Deploy")

### Build Fails?

1. Check build logs for specific errors
2. Verify `requirements.txt` is correct
3. Make sure Python version is compatible
4. Check that all files are committed to GitHub

### Bot Not Responding?

1. Check if service is running (should show "Live" status)
2. Check logs for any errors
3. Verify bot token is correct
4. Test with `/start` command in Telegram

## 🔄 Updating Your Bot

To update your bot:

1. Push changes to GitHub:
   ```bash
   git add .
   git commit -m "Update bot"
   git push origin main
   ```

2. Render will automatically detect the change and redeploy
3. Or manually trigger deploy: Go to service → Click **"Manual Deploy"**

## 📊 Monitoring

### View Logs:
- Go to your service dashboard
- Click **"Logs"** tab
- See real-time output from your bot

### Metrics:
- Free tier includes basic metrics
- See CPU, memory usage
- Monitor uptime

## ✅ Success Checklist

- [ ] Code pushed to GitHub
- [ ] Render account created
- [ ] Background Worker created
- [ ] Environment variables set (BOT_TOKEN, ADMIN_ID, API_SECRET, FIREBASE_KEY_B64)
- [ ] Service deployed successfully
- [ ] Logs show bot starting
- [ ] Tested with `/start` in Telegram

## 🆘 Need Help?

- Render Docs: [render.com/docs](https://render.com/docs)
- Render Community: [community.render.com](https://community.render.com)
- Check service logs for specific errors

## 💡 Pro Tips

1. **Use GitHub integration** - Automatic deploys on push
2. **Monitor logs regularly** - Catch issues early
3. **Set up alerts** - Get notified if service goes down (paid feature)
4. **Use environment variables** - Never hardcode secrets
5. **Test locally first** - Make sure bot works before deploying

---

**Note**: The free tier is great for testing and small bots. For production with guaranteed uptime, consider the Starter plan ($7/month) which keeps your bot always-on.


