# PythonAnywhere Quick Start Guide

## ⚠️ Important: Free Tier Limitation

**PythonAnywhere free tier does NOT include Always-on tasks.** You need the **Hacker plan ($5/month)** to run a Telegram bot continuously.

## If You Have Hacker Plan (or Free Trial)

### Step 1: Prepare Firebase Credentials (Optional)

If you want to use environment variable instead of file:

1. On your local machine:
   ```bash
   cd neymarexnessbot
   python setup_firebase_env.py
   ```
2. Copy the `FIREBASE_KEY_B64` value

### Step 2: Create Always-On Task

1. Go to **Tasks** tab in PythonAnywhere
2. Scroll to **"Always-on tasks"** section
3. Click **"Create a new always-on task"**

### Step 3: Configure the Task

Fill in the form:

**Command:**
```bash
cd /home/DanielKiama/neymarbot && python3.10 bot.py
```

**Working directory:**
```
/home/DanielKiama/neymarbot
```

**Environment Variables** (click "Add environment variable" for each):

1. `BOT_TOKEN` = (your bot token from .env file)
2. `ADMIN_ID` = (your admin ID from .env file)  
3. `API_SECRET` = (your API secret from .env file)
4. `FIREBASE_KEY_B64` = (optional - only if you converted Firebase key to base64)

**Settings:**
- Hourly task?: **No** (unchecked)
- Enabled?: **Yes** (checked)

### Step 4: Start the Bot

1. Click **"Create"** button
2. Find your task in the list
3. Click **"Run"** button (▶)
4. Click **"View log"** to see output
5. You should see: `🤖 Bot is starting…` and `Scheduler started`

### Step 5: Test

1. Open Telegram
2. Send `/start` to your bot
3. Check logs in PythonAnywhere to confirm it received the message

## Troubleshooting

### Bot Not Starting?

1. **Check logs** - Click "View log" on your Always-on task
2. **Common errors:**
   - Missing environment variables → Add them in task settings
   - Module not found → Install in Bash: `pip3.10 install --user package_name`
   - Firebase error → Verify `firebase-key.json` exists or `FIREBASE_KEY_B64` is set

### Bot Stops?

- Check CPU usage (free tier: 100 seconds/day)
- Check logs for errors
- Verify task is still enabled

## Alternative: Use Render.com (Free)

If you don't want to pay for PythonAnywhere, use **Render.com** instead:
- Free Background Workers (750 hours/month)
- No payment required
- See `RENDER_DEPLOYMENT.md` for instructions


