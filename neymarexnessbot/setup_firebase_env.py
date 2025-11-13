"""
Helper script to convert firebase-key.json to environment variable format
for platforms that don't support file uploads easily.
"""
import json
import os
import base64

def convert_firebase_to_env():
    """Convert firebase-key.json to base64 encoded environment variable"""
    if not os.path.exists('firebase-key.json'):
        print("❌ firebase-key.json not found!")
        return
    
    with open('firebase-key.json', 'r') as f:
        firebase_data = json.load(f)
    
    # Convert to base64
    json_str = json.dumps(firebase_data)
    base64_str = base64.b64encode(json_str.encode()).decode()
    
    print("=" * 60)
    print("Firebase Credentials as Environment Variable")
    print("=" * 60)
    print("\nAdd this to your hosting platform's environment variables:")
    print(f"\nFIREBASE_KEY_B64={base64_str}")
    print("\n" + "=" * 60)
    print("\nThen update bot.py to read from environment variable:")
    print("""
# In bot.py, replace the Firebase initialization:
import base64
import json

if os.getenv('FIREBASE_KEY_B64'):
    # Read from environment variable (for cloud hosting)
    firebase_key_json = json.loads(base64.b64decode(os.getenv('FIREBASE_KEY_B64')))
    cred = credentials.Certificate(firebase_key_json)
else:
    # Read from file (for local development)
    cred = credentials.Certificate("firebase-key.json")
""")

if __name__ == "__main__":
    convert_firebase_to_env()

