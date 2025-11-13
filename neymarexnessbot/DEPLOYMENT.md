# Free Hosting Options for Telegram Bot

This guide covers free hosting platforms for your Telegram bot.

## 🚀 Recommended Free Hosting Platforms

### 1. **Railway.app** ⭐ (Recommended)
- **Free Tier**: $5 credit/month (usually enough for small bots)
- **Pros**: Easy deployment, automatic HTTPS, great for beginners
- **Setup**: Connect GitHub repo, auto-detects Python

**Deployment Steps:**
1. Push code to GitHub
2. Go to [railway.app](https://railway.app)
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repository
5. Add environment variables:
   - `BOT_TOKEN`
   - `ADMIN_ID`
   - `API_SECRET`
6. Upload `firebase-key.json` as a secret file
7. Deploy!

---

### 2. **Render.com** ⭐ (Great Free Tier)
- **Free Tier**: 750 hours/month (enough for 24/7)
- **Pros**: Reliable, easy setup, free SSL
- **Cons**: Spins down after 15 min inactivity (wakes on request)

**Deployment Steps:**
1. Push code to GitHub
2. Go to [render.com](https://render.com)
3. Click "New" → "Web Service"
4. Connect your GitHub repo
5. Settings:
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python bot.py`
   - **Environment**: Python 3
6. Add environment variables in "Environment" tab
7. Deploy!

**Note**: For 24/7 uptime, use Render's "Background Worker" instead of "Web Service"

---

### 3. **Fly.io** ⭐ (Best Performance)
- **Free Tier**: 3 shared VMs, 3GB persistent storage
- **Pros**: Fast, global edge network, great performance
- **Setup**: Uses Docker

**Deployment Steps:**
1. Install Fly CLI: `iwr https://fly.io/install.ps1 -useb | iex` (PowerShell)
2. Run: `fly launch`
3. Follow prompts
4. Set secrets: `fly secrets set BOT_TOKEN=xxx ADMIN_ID=xxx API_SECRET=xxx`
5. Upload firebase-key.json: `fly secrets set FIREBASE_KEY="$(cat firebase-key.json)"`
6. Deploy: `fly deploy`

---

### 4. **PythonAnywhere** ⭐ (Great for Beginners)
- **Free Tier**: Always-on tasks, 100 seconds CPU/day, 512 MB disk
- **Pros**: Python-focused, easy for beginners, browser-based IDE
- **Cons**: Limited CPU time on free tier (upgrade to $5/mo for unlimited)
- **Best For**: Learning, testing, small bots

**Deployment Steps:**
1. Sign up at [pythonanywhere.com](https://www.pythonanywhere.com)
2. Upload your code via Files tab or Git
3. Install dependencies: `pip3.10 install --user -r requirements.txt`
4. Create an **Always-on task** (not Web App - bots need Always-on tasks)
5. Set environment variables in the task
6. Start the task

**📖 See `PYTHONANYWHERE_DEPLOYMENT.md` for detailed step-by-step guide!**

---

### 5. **Koyeb**
- **Free Tier**: 1 service, 512 MB RAM
- **Pros**: Simple deployment, good for small bots
- **Setup**: GitHub integration

**Deployment Steps:**
1. Push to GitHub
2. Go to [koyeb.com](https://www.koyeb.com)
3. Create new App → GitHub
4. Select repo
5. Add environment variables
6. Deploy

---

### 6. **Replit** (For Development/Testing)
- **Free Tier**: Always-on option available
- **Pros**: Great for testing, browser-based IDE
- **Cons**: Less reliable for production

---

## 📋 Pre-Deployment Checklist

### 1. Update Port Configuration
The bot needs to use the `PORT` environment variable provided by hosting platforms:

```python
# In bot.py, update run_flask() function:
def run_flask():
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
```

### 2. Environment Variables Needed
- `BOT_TOKEN` - Your Telegram bot token
- `ADMIN_ID` - Your Telegram user ID
- `API_SECRET` - Secret for API authentication
- `PORT` - Port number (usually auto-set by platform)

### 3. Firebase Credentials
You need to upload `firebase-key.json` as:
- **Railway**: Secret file
- **Render**: Environment variable (base64 encoded) or secret file
- **Fly.io**: Secret using `fly secrets set`
- **Others**: Upload via their file management interface

### 4. Update Requirements
Make sure `requirements.txt` includes all dependencies.

---

## 🔧 Platform-Specific Notes

### Railway.app
- Auto-detects Python projects
- Supports both web services and background workers
- Use "Background Worker" for bots (not web service)

### Render.com
- Use "Background Worker" for 24/7 bots
- Free tier has 15-min spin-down (bot will restart when needed)
- Consider upgrading to "Starter" ($7/mo) for always-on

### Fly.io
- Best for production
- Global edge network = low latency
- More complex setup but best performance

---

## 🐳 Docker Deployment (Optional)

If you want to use Docker on any platform:

```dockerfile
FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["python", "bot.py"]
```

---

## 📊 Comparison Table

| Platform | Free Tier | Always-On | Ease of Use | Best For |
|----------|-----------|-----------|-------------|----------|
| Railway | $5 credit/mo | ✅ | ⭐⭐⭐⭐⭐ | Beginners |
| Render | 750 hrs/mo | ⚠️ (spins down) | ⭐⭐⭐⭐ | Small bots |
| Fly.io | 3 VMs | ✅ | ⭐⭐⭐ | Production |
| Koyeb | 1 service | ✅ | ⭐⭐⭐⭐ | Simple bots |
| PythonAnywhere | Limited | ⚠️ | ⭐⭐⭐ | Learning |

---

## 🆘 Troubleshooting

### Bot not starting?
- Check logs in platform dashboard
- Verify all environment variables are set
- Ensure firebase-key.json is uploaded correctly

### Connection timeouts?
- Hosting platforms usually have better network than local
- Should resolve SSL issues you're experiencing locally

### Bot stops working?
- Check platform status page
- Verify you haven't exceeded free tier limits
- Check bot logs for errors

---

## 🎯 Quick Start Recommendation

**For beginners**: Start with **Railway.app** - easiest setup
**For production**: Use **Fly.io** or **Render.com** (paid tier)

Need help? Check platform documentation or their Discord communities!

