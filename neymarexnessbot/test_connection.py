"""
Quick script to test network connectivity to Telegram API
"""
import os
import sys
import asyncio
from dotenv import load_dotenv
from telegram import Bot
from telegram.error import NetworkError, TimedOut

load_dotenv()
BOT_TOKEN = os.getenv("BOT_TOKEN")

async def test_connection():
    """Test if we can connect to Telegram API"""
    if not BOT_TOKEN:
        print("❌ BOT_TOKEN not found in environment variables")
        return False
    
    print("🔍 Testing connection to Telegram API...")
    print(f"Bot Token: {BOT_TOKEN[:10]}...{BOT_TOKEN[-5:]}")
    
    try:
        # Set event loop policy for Windows
        if sys.platform == 'win32':
            asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())
        
        bot = Bot(token=BOT_TOKEN)
        
        # Try to get bot info (this is what fails during initialization)
        print("\n📡 Attempting to connect...")
        me = await bot.get_me()
        
        print(f"✅ SUCCESS! Connected to Telegram API")
        print(f"   Bot Username: @{me.username}")
        print(f"   Bot ID: {me.id}")
        print(f"   Bot Name: {me.first_name}")
        return True
        
    except NetworkError as e:
        print(f"❌ NETWORK ERROR: {e}")
        print("\nPossible causes:")
        print("  1. No internet connection")
        print("  2. Firewall/antivirus blocking Telegram API")
        print("  3. VPN/proxy issues")
        print("  4. Telegram API temporarily down")
        return False
        
    except TimedOut as e:
        print(f"⏱️  TIMEOUT: Connection timed out")
        print(f"   Error: {e}")
        print("\nPossible causes:")
        print("  1. Slow/unstable internet connection")
        print("  2. Network congestion")
        print("  3. Firewall blocking connection")
        return False
        
    except Exception as e:
        print(f"❌ UNEXPECTED ERROR: {type(e).__name__}: {e}")
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("Telegram Bot Connection Test")
    print("=" * 60)
    
    try:
        result = asyncio.run(test_connection())
        sys.exit(0 if result else 1)
    except KeyboardInterrupt:
        print("\n\n⚠️  Test interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ Fatal error: {e}")
        sys.exit(1)
