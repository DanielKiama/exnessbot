"""
Enhanced network diagnostic script for Telegram Bot
"""
import os
import sys
import socket
import urllib.request
import urllib.error
from dotenv import load_dotenv

load_dotenv()

def test_basic_internet():
    """Test basic internet connectivity"""
    print("🌐 Testing basic internet connectivity...")
    try:
        # Try to connect to Google DNS
        socket.create_connection(("8.8.8.8", 53), timeout=3)
        print("   ✅ Basic internet connection: OK")
        return True
    except OSError:
        print("   ❌ Basic internet connection: FAILED")
        return False

def test_dns_resolution():
    """Test DNS resolution"""
    print("\n🔍 Testing DNS resolution...")
    try:
        import socket
        ip = socket.gethostbyname("api.telegram.org")
        print(f"   ✅ DNS resolution: OK (api.telegram.org -> {ip})")
        return True
    except socket.gaierror as e:
        print(f"   ❌ DNS resolution: FAILED - {e}")
        return False

def test_telegram_api_http():
    """Test HTTP connectivity to Telegram API"""
    print("\n📡 Testing HTTP connectivity to Telegram API...")
    try:
        url = "https://api.telegram.org"
        req = urllib.request.Request(url)
        req.add_header('User-Agent', 'Mozilla/5.0')
        with urllib.request.urlopen(req, timeout=10) as response:
            status = response.getcode()
            print(f"   ✅ HTTP connectivity: OK (Status: {status})")
            return True
    except urllib.error.URLError as e:
        print(f"   ❌ HTTP connectivity: FAILED - {e}")
        return False
    except Exception as e:
        print(f"   ❌ HTTP connectivity: FAILED - {type(e).__name__}: {e}")
        return False

def test_bot_token():
    """Test bot token connectivity"""
    print("\n🤖 Testing bot token connectivity...")
    BOT_TOKEN = os.getenv("BOT_TOKEN")
    if not BOT_TOKEN:
        print("   ❌ BOT_TOKEN not found in .env file")
        return False
    
    print(f"   Bot Token: {BOT_TOKEN[:10]}...{BOT_TOKEN[-5:]}")
    
    try:
        import asyncio
        from telegram import Bot
        from telegram.error import NetworkError, TimedOut
        
        # Set event loop policy for Windows
        if sys.platform == 'win32':
            asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())
        
        async def test():
            bot = Bot(token=BOT_TOKEN)
            me = await bot.get_me()
            print(f"   ✅ Bot API connection: OK")
            print(f"      Bot: @{me.username} (ID: {me.id})")
            return True
        
        return asyncio.run(test())
        
    except NetworkError as e:
        print(f"   ❌ Bot API connection: NETWORK ERROR")
        print(f"      Details: {e}")
        return False
    except TimedOut as e:
        print(f"   ⏱️  Bot API connection: TIMEOUT")
        print(f"      Details: {e}")
        return False
    except Exception as e:
        print(f"   ❌ Bot API connection: ERROR - {type(e).__name__}: {e}")
        return False

def check_proxy_settings():
    """Check for proxy environment variables"""
    print("\n🔐 Checking proxy settings...")
    proxy_vars = ['HTTP_PROXY', 'HTTPS_PROXY', 'http_proxy', 'https_proxy', 'ALL_PROXY']
    found_proxy = False
    for var in proxy_vars:
        value = os.getenv(var)
        if value:
            print(f"   ⚠️  Found {var}: {value}")
            found_proxy = True
    if not found_proxy:
        print("   ✅ No proxy settings detected")
    return found_proxy

def main():
    print("=" * 70)
    print("Telegram Bot Network Diagnostic Tool")
    print("=" * 70)
    print()
    
    results = []
    
    # Run all tests
    results.append(("Basic Internet", test_basic_internet()))
    results.append(("DNS Resolution", test_dns_resolution()))
    results.append(("HTTP Connectivity", test_telegram_api_http()))
    check_proxy_settings()
    results.append(("Bot Token", test_bot_token()))
    
    # Summary
    print("\n" + "=" * 70)
    print("SUMMARY")
    print("=" * 70)
    
    all_passed = True
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{test_name:.<30} {status}")
        if not result:
            all_passed = False
    
    print()
    if all_passed:
        print("✅ All tests passed! Your network connection is working.")
        print("   The bot should be able to connect to Telegram API.")
    else:
        print("❌ Some tests failed. Possible solutions:")
        print()
        print("1. Check your internet connection")
        print("2. Disable VPN/proxy temporarily to test")
        print("3. Check Windows Firewall settings:")
        print("   - Allow Python through firewall")
        print("   - Allow outbound connections to api.telegram.org")
        print("4. Check antivirus software:")
        print("   - Temporarily disable to test")
        print("   - Add Python to exceptions")
        print("5. Try using a different network (mobile hotspot)")
        print("6. Check if your ISP blocks Telegram API")
    
    return 0 if all_passed else 1

if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print("\n\n⚠️  Test interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ Fatal error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)





