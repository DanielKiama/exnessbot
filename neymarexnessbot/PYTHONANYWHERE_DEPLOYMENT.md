# PythonAnywhere Deployment Guide

Complete step-by-step guide to deploy your Telegram bot on PythonAnywhere.

## 📋 Overview

**PythonAnywhere Free Tier:**
- ✅ Always-on tasks (for bots)
- ✅ 512 MB disk space
- ✅ Limited CPU time (100 seconds/day for free tier)
- ⚠️ Web apps only respond to HTTP requests (not suitable for polling bots)
- ✅ Perfect for Telegram bots using Always-on tasks

## 🚀 Step-by-Step Deployment

### Step 1: Sign Up
1. Go to [pythonanywhere.com](https://www.pythonanywhere.com)
2. Click "Beginner: Start a free account"
3. Sign up with email or GitHub

### Step 2: Upload Your Code

#### Option A: Using Files Tab (Easiest)
1. Click **Files** tab in the top menu
2. Navigate to `/home/yourusername/` (replace `yourusername` with your actual username)
3. Click **Upload a file** button
4. Upload these files one by one:
   - `bot.py`
   - `requirements.txt`
   - `firebase-key.json`
   - `.env` (or create it manually - see Step 3)

#### Option B: Using Git (Recommended)
1. Push your code to GitHub (if not already)
2. In PythonAnywhere, open **Consoles** tab
3. Click **Bash** to open a console
4. Run:
   ```bash
   cd ~
   git clone https://github.com/yourusername/your-repo-name.git
   cd your-repo-name/neymarexnessbot
   ```

### Step 3: Set Up Environment Variables

**Important:** PythonAnywhere doesn't support `.env` files directly in Always-on tasks. We'll use environment variables.

1. Go to **Files** tab
2. Create a new file: `/home/yourusername/.env`
3. Add your environment variables:
   ```
   BOT_TOKEN=your_bot_token_here
   ADMIN_ID=your_admin_id_here
   API_SECRET=your_api_secret_here
   ```

**OR** set them in the Always-on task (see Step 5)

### Step 4: Install Dependencies

1. Go to **Consoles** tab
2. Click **Bash** to open a console
3. Navigate to your bot directory:
   ```bash
   cd ~/neymarexnessbot
   # or if you cloned from git:
   # cd ~/your-repo-name/neymarexnessbot
   ```
4. Install dependencies:
   ```bash
   pip3.10 install --user -r requirements.txt
   ```
   (Use `pip3.10` for Python 3.10, or `pip3.11` for Python 3.11)

### Step 5: Set Up Always-On Task

This is the key step - PythonAnywhere uses "Always-on tasks" for long-running processes like bots.

1. Go to **Tasks** tab
2. Click **Create a new always-on task**
3. Fill in the form:
   - **Command**: 
     ```bash
     cd /home/yourusername/neymarexnessbot && /home/yourusername/.local/bin/python3.10 bot.py
     ```
     (Adjust path and Python version as needed)
   
   - **Working directory**: `/home/yourusername/neymarexnessbot`
   
   - **Environment variables** (click "Add environment variable" for each):
     - `BOT_TOKEN` = `your_bot_token`
     - `ADMIN_ID` = `your_admin_id`
     - `API_SECRET` = `your_api_secret`
     - `FIREBASE_KEY_B64` = (run `python setup_firebase_env.py` locally to get this)
   
   - **Hourly task?**: No (unchecked)
   
   - **Enabled?**: Yes (checked)

4. Click **Create**

### Step 6: Verify Firebase Credentials

Since PythonAnywhere doesn't easily support file uploads for Always-on tasks, use the environment variable method:

1. On your local machine, run:
   ```bash
   python setup_firebase_env.py
   ```
2. Copy the `FIREBASE_KEY_B64` value
3. Add it as an environment variable in the Always-on task (Step 5)

**OR** if you prefer using the file:
1. Upload `firebase-key.json` to `/home/yourusername/neymarexnessbot/`
2. Make sure the path in `bot.py` is correct (it should auto-detect)

### Step 7: Start the Bot

1. Go to **Tasks** tab
2. Find your Always-on task
3. Click the **▶ Run** button (or it should start automatically)
4. Click **View log** to see the output
5. You should see: `🤖 Bot is starting…` and `Scheduler started`

### Step 8: Test the Bot

1. Open Telegram
2. Send `/start` to your bot
3. Check the log in PythonAnywhere to see if it received the message

## 🔧 Troubleshooting

### Bot Not Starting?

1. **Check the log:**
   - Go to **Tasks** tab
   - Click **View log** on your Always-on task
   - Look for error messages

2. **Common issues:**
   - **Module not found**: Install missing packages in Bash console
   - **Permission denied**: Check file permissions
   - **Firebase error**: Verify `firebase-key.json` path or `FIREBASE_KEY_B64` env var
   - **Token error**: Verify `BOT_TOKEN` is set correctly

### Bot Stops After Some Time?

- **Free tier limitation**: Free tier has CPU time limits (100 seconds/day)
- **Solution**: Upgrade to Hacker plan ($5/month) for unlimited CPU time
- **Or**: Optimize your bot to use less CPU

### Can't Install Packages?

1. Use `pip3.10 install --user package_name` (with `--user` flag)
2. Or install in a virtual environment:
   ```bash
   python3.10 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```
   Then update your Always-on task command to use the venv Python

### Flask API Not Working?

The Flask API endpoints won't work on Always-on tasks. If you need the API:
1. Create a separate **Web app** (free tier supports one)
2. Deploy the Flask routes there
3. Keep the bot in the Always-on task

## 📝 Important Notes

### Free Tier Limitations:
- ⚠️ **100 seconds of CPU time per day** - Your bot will stop if it exceeds this
- ✅ **Always-on tasks** - Bot stays running (but limited CPU)
- ✅ **512 MB disk space** - Usually enough for small bots
- ⚠️ **No custom domains** on free tier

### Recommended for Production:
- **Hacker Plan ($5/month)**: Unlimited CPU time, better for production bots
- **Web Developer ($10/month)**: Includes web app + always-on tasks

### Alternative: Use Webhooks (Advanced)

If you want to use webhooks instead of polling (better for free tier):
1. Create a **Web app** in PythonAnywhere
2. Set up webhook endpoint
3. Configure Telegram to send updates to your webhook URL

This is more complex but uses less CPU time.

## 🎯 Quick Command Reference

```bash
# Navigate to bot directory
cd ~/neymarexnessbot

# Install dependencies
pip3.10 install --user -r requirements.txt

# Test bot locally (in console)
python3.10 bot.py

# View logs
# Go to Tasks tab → Click "View log" on your Always-on task

# Restart bot
# Go to Tasks tab → Click "Stop" then "Run" on your Always-on task
```

## ✅ Success Checklist

- [ ] Code uploaded to PythonAnywhere
- [ ] Dependencies installed
- [ ] Environment variables set
- [ ] Firebase credentials configured
- [ ] Always-on task created and enabled
- [ ] Bot started successfully (check logs)
- [ ] Tested with `/start` command in Telegram

## 🆘 Need Help?

- PythonAnywhere Help: [help.pythonanywhere.com](https://help.pythonanywhere.com)
- PythonAnywhere Forums: [www.pythonanywhere.com/forums](https://www.pythonanywhere.com/forums)
- Check bot logs in **Tasks** tab → **View log**

---

**Note**: The free tier is great for testing, but for a production bot with scheduled tasks, consider upgrading to the Hacker plan ($5/month) for unlimited CPU time.

