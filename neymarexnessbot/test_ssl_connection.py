"""
Test SSL connection to Telegram API to diagnose Windows SSL issues
"""
import sys
import asyncio
import ssl
import socket
from dotenv import load_dotenv
import os

load_dotenv()
BOT_TOKEN = os.getenv("BOT_TOKEN")

def test_ssl_connection():
    """Test basic SSL connection to Telegram API"""
    print("=" * 60)
    print("Testing SSL Connection to Telegram API")
    print("=" * 60)
    
    hostname = "api.telegram.org"
    port = 443
    
    try:
        print(f"\n1. Creating TCP socket to {hostname}:{port}...")
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(10)
        
        print("2. Connecting to server...")
        sock.connect((hostname, port))
        print("   [OK] TCP connection successful")
        
        print("3. Creating SSL context...")
        context = ssl.create_default_context()
        # Increase socket timeout for SSL handshake
        sock.settimeout(30)
        
        print("4. Wrapping socket with SSL (this may take a while)...")
        ssl_sock = context.wrap_socket(sock, server_hostname=hostname)
        print("   [OK] SSL handshake successful")
        print(f"   SSL Version: {ssl_sock.version()}")
        print(f"   Cipher: {ssl_sock.cipher()}")
        
        ssl_sock.close()
        print("\n[SUCCESS] SSL connection test PASSED")
        return True
        
    except socket.timeout:
        print("\n[FAILED] Connection timeout - network issue")
        return False
    except ssl.SSLError as e:
        print(f"\n[FAILED] SSL Error: {e}")
        print("   This indicates an SSL/TLS configuration problem")
        return False
    except ConnectionResetError as e:
        print(f"\n[FAILED] Connection reset: {e}")
        print("   Connection was forcibly closed - likely firewall/antivirus")
        return False
    except Exception as e:
        print(f"\n[FAILED] Error: {type(e).__name__}: {e}")
        return False

async def test_telegram_api_async():
    """Test async connection using httpx"""
    print("\n" + "=" * 60)
    print("Testing Async HTTP Connection (like the bot uses)")
    print("=" * 60)
    
    try:
        import httpx
        
        # Set event loop policy for Windows
        if sys.platform == 'win32':
            asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())
        
        print("\n1. Creating httpx client...")
        async with httpx.AsyncClient(timeout=60.0) as client:
            print("2. Making GET request to Telegram API...")
            url = f"https://api.telegram.org/bot{BOT_TOKEN}/getMe"
            response = await client.get(url)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('ok'):
                    bot_info = data.get('result', {})
                    print(f"\n[SUCCESS] API connection successful!")
                    print(f"   Bot: @{bot_info.get('username')} (ID: {bot_info.get('id')})")
                    return True
                else:
                    print(f"\n[FAILED] API returned error: {data.get('description')}")
                    return False
            else:
                print(f"\n[FAILED] HTTP {response.status_code}: {response.text}")
                return False
                
    except httpx.ConnectTimeout:
        print("\n[FAILED] Connection timeout")
        return False
    except httpx.ConnectError as e:
        print(f"\n[FAILED] Connection error: {e}")
        return False
    except Exception as e:
        print(f"\n[FAILED] Error: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("\nRunning SSL Connection Diagnostics\n")
    
    # Test 1: Basic SSL connection
    ssl_ok = test_ssl_connection()
    
    # Test 2: Async HTTP connection (what the bot actually uses)
    if ssl_ok and BOT_TOKEN:
        asyncio.run(test_telegram_api_async())
    elif not BOT_TOKEN:
        print("\n[WARNING] BOT_TOKEN not found - skipping API test")
    
    print("\n" + "=" * 60)
    print("Diagnostics complete")
    print("=" * 60)

