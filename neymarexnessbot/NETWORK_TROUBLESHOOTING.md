# Network Troubleshooting Guide for Telegram Bot

## The Problem
Your bot is failing to connect to Telegram's API with error: `[WinError 64] The specified network name is no longer available`

This error occurs during SSL/TLS handshake, meaning the connection is being established but then immediately dropped.

## Quick Fixes to Try (in order):

### 1. **Check Windows Firewall** ⚠️ MOST COMMON FIX
```powershell
# Run PowerShell as Administrator, then:
netsh advfirewall firewall add rule name="Python Telegram Bot" dir=out action=allow program="C:\Program Files\Python312\python.exe" enable=yes
```

Or manually:
- Open Windows Defender Firewall
- Click "Allow an app through firewall"
- Find Python and ensure both Private and Public are checked
- If Python isn't listed, click "Allow another app" and add Python

### 2. **Check Antivirus Software**
- Temporarily disable your antivirus and test
- If it works, add Python to antivirus exceptions
- Some antivirus software blocks SSL/TLS connections

### 3. **Reset Windows Network Stack**
```powershell
# Run PowerShell as Administrator:
netsh winsock reset
netsh int ip reset
ipconfig /flushdns
# Then restart your computer
```

### 4. **Check VPN/Proxy**
- If you're using a VPN, try disconnecting it
- Check if you have proxy settings enabled:
  ```powershell
  netsh winhttp show proxy
  ```
- If proxy is set, try clearing it:
  ```powershell
  netsh winhttp reset proxy
  ```

### 5. **Try Different Network**
- Connect to mobile hotspot to test
- This will tell you if it's your network/ISP blocking Telegram

### 6. **Check if Telegram API is Accessible**
Open browser and try:
- https://api.telegram.org
- Should show "Not Found" (this is normal - means API is reachable)

### 7. **Update Network Drivers**
- Outdated network drivers can cause SSL/TLS issues
- Update from Device Manager or manufacturer's website

### 8. **Check Windows Event Viewer**
- Open Event Viewer
- Look under Windows Logs > System
- Check for network adapter errors around the time you run the bot

## Test Your Connection
Run the diagnostic script:
```powershell
python test_network.py
```

This will tell you exactly where the connection is failing.

## If Nothing Works
Consider using a proxy server or running the bot on a different machine/cloud server.





