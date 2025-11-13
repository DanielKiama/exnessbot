import os
import sys
import logging
import base64
import json
from datetime import datetime, timezone, timedelta, time as datetime_time
import time as pytime

import firebase_admin
from firebase_admin import credentials, firestore

from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import (
    Application,
    CommandHandler,
    MessageHandler,
    CallbackQueryHandler,
    filters,
    CallbackContext,
)
from telegram.error import NetworkError, RetryAfter, TimedOut
from dotenv import load_dotenv
import random
import string

# Load environment variables
load_dotenv()
BOT_TOKEN = os.getenv("BOT_TOKEN")
ADMIN_ID  = os.getenv("ADMIN_ID")  # your Telegram user ID if you use /signal

# Channel to which users will be invited
CHANNEL_ID = -1002493716889  # Updated with correct ID from image

# Initialize Firebase
# Support both file-based (local) and environment variable (cloud hosting) credentials
if os.getenv('FIREBASE_KEY_B64'):
    # Read from environment variable (for cloud hosting)
    firebase_key_json = json.loads(base64.b64decode(os.getenv('FIREBASE_KEY_B64')))
    cred = credentials.Certificate(firebase_key_json)
else:
    # Read from file (for local development)
    cred = credentials.Certificate("firebase-key.json")

firebase_admin.initialize_app(cred)
db = firestore.client()

# Logging setup
logging.basicConfig(
    format="%(asctime)s - %(levelname)s - %(message)s",
    level=logging.INFO,
)

# Add these imports at the top
from flask import Flask, request, jsonify
import threading
from datetime import datetime, timezone
import asyncio

# Add this import at the top with your other imports
from flask_cors import CORS

# Initialize Flask app
app = Flask(__name__)
# Add this line right after creating the Flask app
CORS(app)

# Add a secret key for API authentication
API_SECRET = os.getenv("API_SECRET", "your-secret-key")

# Flask route for the API endpoint to remove users
@app.route('/api/remove-user', methods=['POST'])
def api_remove_user():
    # Check API secret for authentication
    if request.headers.get('X-API-Secret') != API_SECRET:
        return jsonify({'success': False, 'error': 'Unauthorized'}), 401
    
    # Get user_id from request
    data = request.json
    if not data or 'user_id' not in data:
        return jsonify({'success': False, 'error': 'Missing user_id parameter'}), 400
    
    user_id = data['user_id']
    
    try:
        # Create an application instance to access the bot
        application = Application.builder().token(BOT_TOKEN).build()
        
        # Use the application to create a context for the remove_user function
        async def process_removal():
            context = CallbackContext(application)
            result = await remove_user(int(user_id), context)
            return result
        
        # Run the async function and get the result
        import asyncio
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        result = loop.run_until_complete(process_removal())
        loop.close()
        
        if result:
            return jsonify({'success': True})
        else:
            return jsonify({'success': False, 'error': 'Failed to remove user'}), 500
    
    except Exception as e:
        logging.exception(f"API error removing user {user_id}: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

# Add this new API endpoint after the existing api_remove_user endpoint
@app.route('/api/broadcast-message', methods=['POST'])
def api_broadcast_message():
    # Check API secret for authentication
    if request.headers.get('X-API-Secret') != API_SECRET:
        return jsonify({'success': False, 'error': 'Unauthorized'}), 401
    
    # Get message and target group from request
    data = request.json
    if not data or 'message' not in data or 'target_group' not in data:
        return jsonify({'success': False, 'error': 'Missing required parameters'}), 400
    
    message = data['message']
    target_group = data['target_group']
    user_ids = data.get('user_ids', [])
    
    try:
        # Create an application instance to access the bot
        application = Application.builder().token(BOT_TOKEN).build()
        
        # Use the application to create a context for the broadcast function
        async def process_broadcast():
            context = CallbackContext(application)
            result = await broadcast_message(message, target_group, context, user_ids)
            return result
        
        # Run the async function and get the result
        import asyncio
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        result = loop.run_until_complete(process_broadcast())
        loop.close()
        
        return jsonify({'success': True, 'sent_count': result})
    
    except Exception as e:
        logging.exception(f"API error broadcasting message: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

# Function to run the Flask app
def run_flask():
    # Use PORT environment variable if available (for cloud hosting)
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port)

async def start(update: Update, context: CallbackContext):
    keyboard = [[InlineKeyboardButton("🎟 Enter Access Code", callback_data="enter_code")]]
    await update.message.reply_text(
        "👋 Welcome! Choose an option below:",
        reply_markup=InlineKeyboardMarkup(keyboard)
    )

async def admin_menu(update: Update, context: CallbackContext):
    """Admin-only command to show management interface."""
    if ADMIN_ID and str(update.effective_user.id) != ADMIN_ID:
        return await update.message.reply_text("❌ You're not authorized.")
    
    keyboard = [
        [InlineKeyboardButton("👥 View All Users", callback_data="admin_view_users")],
        [InlineKeyboardButton("🔄 Cleanup Archived", callback_data="admin_cleanup")],
        [InlineKeyboardButton("📢 Send Broadcast", callback_data="admin_broadcast")],
        [InlineKeyboardButton("🎫 Generate Code", callback_data="generate_code")]
    ]
    await update.message.reply_text(
        "🔧 Admin Control Panel:",
        reply_markup=InlineKeyboardMarkup(keyboard)
    )

async def generate_code_menu(update: Update, context: CallbackContext):
    """Show the code generation menu with expiry options."""
    keyboard = [
        [InlineKeyboardButton("1 Month", callback_data="gen_code_30")],
        [InlineKeyboardButton("3 Months", callback_data="gen_code_90")],
        [InlineKeyboardButton("6 Months", callback_data="gen_code_180")],
        [InlineKeyboardButton("1 Year", callback_data="gen_code_365")],
        [InlineKeyboardButton("🔙 Back to Menu", callback_data="admin_menu")]
    ]
    
    await update.callback_query.message.edit_text(
        "📝 Select expiry period for the new code:",
        reply_markup=InlineKeyboardMarkup(keyboard)
    )

async def generate_access_code(days: int) -> str:
    """Generate a unique access code."""
    while True:
        code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
        # Check if code already exists
        if not db.collection("access_tokens").document(code).get().exists:
            return code

async def create_access_token(update: Update, context: CallbackContext, days: int):
    """Create a new access token with specified expiry."""
    code = await generate_access_code(days)
    expiry = datetime.now(timezone.utc) + timedelta(days=days)
    
    # Save to database
    db.collection("access_tokens").document(code).set({
        "token": code,  # Add this field for dashboard compatibility
        "expiry_date": expiry,
        "expiry_timestamp": int(expiry.timestamp()),
        "created_at": datetime.now(timezone.utc),
        "created_timestamp": int(datetime.now(timezone.utc).timestamp()),
        "created_by": str(update.callback_query.from_user.id),
        "used": False,
        "active": True
    })
    
    # Create inline keyboard with copy buttons (UPDATED)
    expiry_str = expiry.strftime('%Y-%m-%d %H:%M UTC')
    keyboard = [
        [InlineKeyboardButton("📋 Copy Full Message", callback_data=f"copy_full_{code}_{expiry.timestamp()}")],
        [InlineKeyboardButton(f"📝 Copy Code: {code}", callback_data=f"copy_code_{code}")],
        [InlineKeyboardButton("🔗 Copy Bot Link", callback_data="copy_link")],
        [InlineKeyboardButton("🔙 Back to Menu", callback_data="admin_menu")]
    ]
    
    await update.callback_query.message.edit_text(
        f"Neymar's admin here\n\n"
        f"✅ New access code generated:\n\n"
        f"Code: `{code}`\n"
        f"Expires: {expiry.strftime('%Y-%m-%d %H:%M UTC')}\n\n"
        f"This code can be used once before expiry.\n\n"
        f"Please follow this steps to get your access to premium\n\n"
        f"https://t.me/neymarexnessbot\n"
        f"so i want you to message this bot\n"
        f"it will ask for a code\n"
        f"paste this code\n"
        f"Code: `{code}`",
        parse_mode="Markdown",
        reply_markup=InlineKeyboardMarkup(keyboard)
    )

# Add this function BEFORE the button_handler function (around line 226)
async def handle_copy_buttons(update: Update, context: CallbackContext):
    """Handle copy button callbacks"""
    query = update.callback_query
    await query.answer()
    
    if query.data.startswith("copy_full_"):
        # Extract code and timestamp from callback data
        parts = query.data.replace("copy_full_", "").split("_")
        code = parts[0]
        
        # Get expiry date from timestamp if available
        if len(parts) > 1:
            try:
                timestamp = float(parts[1])
                expiry = datetime.fromtimestamp(timestamp, tz=timezone.utc)
                expiry_str = expiry.strftime('%Y-%m-%d %H:%M UTC')
            except:
                expiry_str = "[EXPIRY_DATE]"
        else:
            expiry_str = "[EXPIRY_DATE]"
        
        full_message = (
            f"Neymar's admin here\n\n"
            f"✅ New access code generated:\n\n"
            f"Code: {code}\n"
            f"Expires: {expiry_str}\n\n"
            f"This code can be used once before expiry.\n\n"
            f"Please follow this steps to get your access to premium\n\n"
            f"https://t.me/neymarexnessbot\n"
            f"so i want you to message this bot\n"
            f"it will ask for a code\n"
            f"paste this code\n"
            f"Code: {code}"
        )
        await query.message.reply_text(
            f"📋 **Full message copied:**\n\n```\n{full_message}\n```\n\n*Tap and hold the message above to copy*",
            parse_mode="Markdown"
        )
    
    elif query.data.startswith("copy_code_"):
        code = query.data.replace("copy_code_", "")
        await query.message.reply_text(
            f"📝 **Access code:**\n\n`{code}`\n\n*Tap the code above to copy*",
            parse_mode="Markdown"
        )
    
    elif query.data == "copy_link":
        await query.message.reply_text(
            f"🔗 **Bot link:**\n\n`https://t.me/neymarexnessbot`\n\n*Tap the link above to copy*",
            parse_mode="Markdown"
        )

async def button_handler(update: Update, context: CallbackContext):
    query = update.callback_query
    await query.answer()

    # Regular user buttons
    if query.data == "enter_code":
        await query.message.reply_text("🔑 Please enter your access code:")
        return
    
    # Admin-only buttons
    if ADMIN_ID and str(update.effective_user.id) != ADMIN_ID:
        await query.message.reply_text("❌ You're not authorized.")
        return
    
    # Handle copy buttons - ADD THIS SECTION
    if query.data.startswith("copy_"):
        await handle_copy_buttons(update, context)
        return
    
    # Admin menu options
    if query.data == "generate_code":
        await generate_code_menu(update, context)
    elif query.data.startswith("gen_code_"):
        days = int(query.data.split("_")[2])
        await create_access_token(update, context, days)
    elif query.data == "admin_view_users":
        # Get all non-archived users
        users_ref = db.collection("users")
        query_ref = users_ref.where("archived", "==", False)
        users = list(query_ref.stream())
        
        # Sort users by expiry date
        sorted_users = sorted(
            [doc.to_dict() for doc in users],
            key=lambda x: x.get("expiry_date").timestamp() if hasattr(x.get("expiry_date"), "timestamp") else 0
        )
        
        # Get page number from context or default to 0
        page = context.user_data.get('page', 0)
        users_per_page = 10
        total_pages = (len(sorted_users) + users_per_page - 1) // users_per_page
        
        # Get users for current page
        start_idx = page * users_per_page
        end_idx = start_idx + users_per_page
        current_users = sorted_users[start_idx:end_idx]
        
        # Create message with user list and remove buttons
        message = f"👥 Active Users (Page {page + 1}/{total_pages}):\n\n"
        keyboard = []
        
        for user in current_users:
            expiry = user.get("expiry_date")
            if hasattr(expiry, "timestamp"):
                expiry = datetime.fromtimestamp(expiry.timestamp(), tz=timezone.utc)
            uid = user.get("user_id")
            username = user.get("username", "Unknown")
            access_code = user.get("access_code", "N/A")
            
            # Format user info as requested
            message += f"User: {username}\n"
            message += f"Code: {access_code}\n"
            message += f"Exp: {expiry.strftime('%Y-%m-%d %H:%M UTC')}\n\n"
            
            # Add remove button for this user
            keyboard.append([
                InlineKeyboardButton(f"❌ Remove {username}", callback_data=f"remove_user_{uid}")
            ])
        
        # Add navigation buttons
        nav_buttons = []
        if page > 0:
            nav_buttons.append(InlineKeyboardButton("⬅️ Previous", callback_data="users_prev_page"))
        if page < total_pages - 1:
            nav_buttons.append(InlineKeyboardButton("➡️ Next", callback_data="users_next_page"))
        if nav_buttons:
            keyboard.append(nav_buttons)
        
        # Add back button
        keyboard.append([InlineKeyboardButton("🔙 Back to Menu", callback_data="admin_menu")])
        
        await query.message.edit_text(
            message,
            reply_markup=InlineKeyboardMarkup(keyboard)
        )
    elif query.data == "users_prev_page":
        context.user_data['page'] = max(0, context.user_data.get('page', 0) - 1)
        await button_handler(update, context)  # Show updated page
    elif query.data == "users_next_page":
        context.user_data['page'] = context.user_data.get('page', 0) + 1
        await button_handler(update, context)  # Show updated page
    # Add other missing cases here if needed

async def check_access(update: Update, context: CallbackContext):
    if update.message.forward_date:
        return  # ignore forwards

    user_id  = update.effective_chat.id
    username = update.effective_user.username or "Unknown"
    token    = update.message.text.strip()

    try:
        doc_ref = db.collection("access_tokens").document(token)
        token_doc = doc_ref.get()
        if not token_doc.exists:
            await update.message.reply_text(
                "❌ Invalid token.",
                reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("🔄 Try Again", callback_data="enter_code")]])
            )
            return

        data   = token_doc.to_dict()
        expiry = data.get("expiry_date")
        used   = data.get("used", False)

        if used:
            await update.message.reply_text(
                "❌ This token has already been used.",
                reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("🔄 Try Again", callback_data="enter_code")]])
            )
            return

        # Firestore Timestamp → datetime
        if hasattr(expiry, "timestamp"):
            expiry = datetime.fromtimestamp(expiry.timestamp(), tz=timezone.utc)

        now = datetime.now(timezone.utc)
        if now >= expiry:
            await update.message.reply_text(
                "❌ Token has expired.",
                reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("🔄 Try Again", callback_data="enter_code")]])
            )
            return

        # Create single-use invite link (24h)
        logging.info(f"Attempting to create invite link for channel ID: {CHANNEL_ID}")
        invite = await context.bot.create_chat_invite_link(
            chat_id=CHANNEL_ID,
            member_limit=1,
            expire_date=now + timedelta(hours=24),
            creates_join_request=False,
        )
        logging.info("Successfully created invite link")

        # In the check_access function, replace the "Mark token used" section with:
        # Mark token used with user info
        doc_ref.update({
            "used": True,
            "used_by_id": user_id,
            "used_by_username": username,
            "used_at": datetime.now(timezone.utc)
        })

        # Save user record
        db.collection("users").document(str(user_id)).set({
            "user_id":      user_id,
            "username":     username,
            "expiry_date":  expiry,
            "invite_link":  invite.invite_link,
            "access_code":  token,
            "archived":     False,
        })

        await update.message.reply_text(
            f"✅ Access granted!\n\n🔗 Your invite link (valid 24h): {invite.invite_link}\n\n⚠️ IMPORTANT: This link can only be used ONCE. If you share this link with someone else, you will lose your access to the channel."
        )

    except Exception as e:
        logging.error(f"Detailed error in check_access: {str(e)}")
        logging.error(f"Error type: {type(e).__name__}")
        # rollback
        try:
            db.collection("access_tokens").document(token).update({"used": False})
        except: pass
        await update.message.reply_text(
            "❌ Could not create invite link. Make sure the bot is an admin with 'Invite Users' permission."
        )

async def remove_archived_users(context: CallbackContext):
    """Runs hourly: removes any archived users who are still in the channel."""
    logging.info("Starting archived users cleanup check")
    
    # Get all archived users
    users_ref = db.collection("users")
    query = users_ref.where("archived", "==", True)
    
    removed_count = 0
    error_count = 0
    
    for user_doc in query.stream():
        data = user_doc.to_dict()
        uid = data.get("user_id")
        username = data.get("username", "Unknown")
        
        try:
            # Check if user is still in channel
            try:
                member = await context.bot.get_chat_member(CHANNEL_ID, uid)
                if member.status not in ["left", "kicked"]:
                    # User is still in channel, remove them
                    await context.bot.ban_chat_member(chat_id=CHANNEL_ID, user_id=uid)
                    await context.bot.unban_chat_member(chat_id=CHANNEL_ID, user_id=uid)
                    removed_count += 1
                    logging.info(f"Removed archived user {uid} ({username}) who was still in channel")
            except Exception as e:
                if "user not found" in str(e).lower():
                    # User is already not in the channel, which is good
                    pass
                else:
                    raise e
                    
        except Exception as e:
            error_count += 1
            logging.exception(f"Error checking/removing archived user {uid} ({username}): {e}")
    
    logging.info(f"Archived users cleanup completed: {removed_count} users removed, {error_count} errors")

async def remove_expired_users(context: CallbackContext):
    """Runs hourly: removes expired users from the channel and archives them."""
    now = datetime.now(timezone.utc)
    logging.info(f"Starting expired users check at {now}")
    
    # Only get non-archived users
    users_ref = db.collection("users")
    query = users_ref.where("archived", "==", False)
    
    removed_count = 0
    error_count = 0
    
    for user_doc in query.stream():
        data = user_doc.to_dict()
        expiry = data.get("expiry_date")
        uid = data.get("user_id")
        username = data.get("username", "Unknown")

        if not expiry:
            logging.warning(f"User {uid} ({username}) has no expiry date")
            continue

        if hasattr(expiry, "timestamp"):
            expiry = datetime.fromtimestamp(expiry.timestamp(), tz=timezone.utc)

        if now > expiry:
            # Track success of each operation
            notification_sent = False
            removed_from_channel = False
            database_updated = False
            
            # Step 1: Try to notify user (non-critical)
            try:
                await context.bot.send_message(
                    chat_id=uid,
                    text="⚠️ Your access has expired and you've been removed. Contact support to renew."
                )
                notification_sent = True
                logging.info(f"Notification sent to user {uid} ({username})")
            except Exception as e:
                logging.warning(f"Failed to notify user {uid} ({username}): {str(e)}")
            
            # Step 2: Remove from channel (critical)
            try:
                await context.bot.ban_chat_member(chat_id=CHANNEL_ID, user_id=uid)
                await context.bot.unban_chat_member(chat_id=CHANNEL_ID, user_id=uid)
                removed_from_channel = True
                logging.info(f"Removed user {uid} ({username}) from channel")
            except Exception as e:
                logging.error(f"Failed to remove user {uid} ({username}) from channel: {str(e)}")
            
            # Step 3: Update database (critical)
            try:
                db.collection("users").document(str(uid)).update({
                    "archived": True,
                    "archivedAt": now,
                    "archiveReason": "expired"
                })
                database_updated = True
                logging.info(f"Database updated for user {uid} ({username})")
            except Exception as e:
                logging.error(f"Failed to update database for user {uid} ({username}): {str(e)}")
            
            # Determine overall success
            if database_updated and removed_from_channel:
                removed_count += 1
                logging.info(f"Successfully processed expired user {uid} ({username}), expired at {expiry}")
            elif database_updated:
                removed_count += 1
                logging.warning(f"User {uid} ({username}) archived in database but may still be in channel")
            else:
                error_count += 1
                logging.error(f"Failed to fully process expired user {uid} ({username})")

    logging.info(f"Expired users check completed: {removed_count} users removed, {error_count} errors")

async def allexpiredusers(update: Update, context: CallbackContext):
    """Lists everyone in `expired_users`."""
    docs = list(db.collection("expired_users").stream())
    if not docs:
        await update.message.reply_text("✅ No expired users archived.")
        return

    lines = []
    for doc in docs:
        d = doc.to_dict()
        uname = d.get("username", "Unknown")
        uid = d.get("user_id")
        exp_at = d.get("expired_at")
        if hasattr(exp_at, "timestamp"):
            exp_at = datetime.fromtimestamp(exp_at.timestamp(), tz=timezone.utc)
        lines.append(f"{uname} ({uid}) — expired {exp_at.strftime('%Y-%m-%d %H:%M UTC')}")

    text = "🚨 Expired Users Archive:\n" + "\n".join(lines)
    # split into 4k chunks
    for chunk in [text[i:i+4000] for i in range(0, len(text), 4000)]:
        await update.message.reply_text(chunk)

async def send_monday_message(context: CallbackContext):
    message = (
        "🌅 *Monday Motivation*\n"
        "Get ready for a week of pip-hunting! Be patient, manage risk, and trade smart 💰"
    )
    for u in db.collection("users").stream():
        uid = u.to_dict().get("user_id")
        try:
            await context.bot.send_message(chat_id=uid, text=message, parse_mode="Markdown")
            pytime.sleep(0.1)
        except:
            pass

async def send_trading_signal(update: Update, context: CallbackContext):
    if ADMIN_ID and str(update.effective_user.id) != ADMIN_ID:
        return await update.message.reply_text("❌ You're not authorized.")
    if not context.args:
        return await update.message.reply_text("❌ Usage: /signal <your message>")
    sig = " ".join(context.args)
    formatted = (
        "🚨 *PREMIUM SIGNAL* 🚨\n\n"
        f"{sig}\n\n"
        f"⏰ {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}"
    )
    for u in db.collection("users").stream():
        uid = u.to_dict().get("user_id")
        try:
            await context.bot.send_message(chat_id=uid, text=formatted, parse_mode="Markdown")
            pytime.sleep(0.1)
        except:
            pass
    await update.message.reply_text("✅ Signal broadcast complete.")

async def send_support_reminder(context: CallbackContext):
    """Sends a reminder to all users about support channels."""
    message = (
        "📢 HOW ARE YOU DOING MATES\n"
        "For support or questions, please contact:\n"
        "👉 IT SUPPORT WhatsApp: +254796806232\n\n"
        "Thank you for being part of our community!\n\n"
        "NeymarKim Management Team"
    )
    
    # Send to all active users
    for user_doc in db.collection("users").stream():
        user_id = user_doc.to_dict().get("user_id")
        try:
            await context.bot.send_message(
                chat_id=user_id,
                text=message,
                parse_mode="Markdown"
            )
            pytime.sleep(0.1)  # Avoid rate limiting
        except Exception as e:
            logging.warning(f"Failed to send support reminder to {user_id}: {e}")

async def get_chat_id(update: Update, context: CallbackContext):
    """Returns the chat ID of the current chat."""
    await update.message.reply_text(f"Chat ID: {update.effective_chat.id}")

async def debug(update: Update, context: CallbackContext):
    """Debug command to show user information."""
    if ADMIN_ID and str(update.effective_user.id) != ADMIN_ID:
        return await update.message.reply_text("❌ You're not authorized.")
        
    user_id = str(update.effective_user.id)
    user_doc = db.collection("users").document(user_id).get()
    
    if not user_doc.exists:
        await update.message.reply_text("❌ No user record found.")
        return
        
    data = user_doc.to_dict()
    expiry = data.get("expiry_date")
    if hasattr(expiry, "timestamp"):
        expiry = datetime.fromtimestamp(expiry.timestamp(), tz=timezone.utc)
        expiry_str = expiry.strftime("%Y-%m-%d %H:%M UTC")  # Format with time
        
    info = [
        f"🆔 User ID: {data.get('user_id')}",
        f"👤 Username: {data.get('username')}",
        f"⏰ Expiry: {expiry_str}",  # Use formatted string with time
        f"🔗 Invite Link: {data.get('invite_link')}",
        f"🎫 Access Code: {data.get('access_code')}",
        f"📊 Archived: {data.get('archived', False)}"
    ]
    
    await update.message.reply_text("\n".join(info))

async def cleanup_archived_command(update: Update, context: CallbackContext):
    """Manually trigger cleanup of archived users from the channel."""
    if ADMIN_ID and str(update.effective_user.id) != ADMIN_ID:
        return await update.message.reply_text("❌ You're not authorized.")
    
    await update.message.reply_text("🔄 Starting archived users cleanup...")
    await remove_archived_users(context)
    await update.message.reply_text("✅ Archived users cleanup completed!")

async def send_expiry_reminders(context: CallbackContext):
    """Sends reminders to users whose access will expire in 2 days."""
    now = datetime.now(timezone.utc)
    two_days_from_now = now + timedelta(days=2)
    
    # Get non-archived users
    users_ref = db.collection("users")
    query = users_ref.where("archived", "==", False)
    
    for user_doc in query.stream():
        data = user_doc.to_dict()
        expiry = data.get("expiry_date")
        uid = data.get("user_id")
        
        if not expiry:
            continue
            
        if hasattr(expiry, "timestamp"):
            expiry = datetime.fromtimestamp(expiry.timestamp(), tz=timezone.utc)
            
        # Check if expiry is within 2 days
        if now < expiry <= two_days_from_now:
            try:
                await context.bot.send_message(
                    chat_id=uid,
                    text=f"⚠️ Your access will expire in {(expiry - now).days} days. Please contact support to renew."
                )
                logging.info(f"Sent expiry reminder to user {uid}")
            except Exception as e:
                logging.warning(f"Failed to send expiry reminder to {uid}: {e}")

async def cleanup_archived_command(update: Update, context: CallbackContext):
    """Manually trigger cleanup of archived users from the channel."""
    if ADMIN_ID and str(update.effective_user.id) != ADMIN_ID:
        return await update.message.reply_text("❌ You're not authorized.")
    
    await update.message.reply_text("🔄 Starting archived users cleanup...")
    await remove_archived_users(context)
    await update.message.reply_text("✅ Archived users cleanup completed!")

async def delete_user(update: Update, context: CallbackContext):
    """Admin command to delete a user and remove them from the channel."""
    if ADMIN_ID and str(update.effective_user.id) != ADMIN_ID:
        return await update.message.reply_text("❌ You're not authorized.")
    
    if not context.args:
        return await update.message.reply_text("❌ Usage: /deleteuser <user_id>")
    
    target_id = context.args[0]
    
    try:
        # Remove from channel
        await context.bot.ban_chat_member(chat_id=CHANNEL_ID, user_id=target_id)
        await context.bot.unban_chat_member(chat_id=CHANNEL_ID, user_id=target_id)
        
        # Mark as archived in database
        now = datetime.now(timezone.utc)
        db.collection("users").document(str(target_id)).update({
            "archived": True,
            "archivedAt": now,
            "archiveReason": "admin_delete"
        })
        
        # Try to notify the user
        try:
            await context.bot.send_message(
                chat_id=target_id,
                text="⚠️ Your access has been revoked by an administrator."
            )
        except Exception as e:
            logging.warning(f"Could not notify user {target_id}: {e}")
        
        await update.message.reply_text(f"✅ User {target_id} has been removed and archived.")
        
    except Exception as e:
        await update.message.reply_text(f"❌ Error removing user: {str(e)}")

async def update_missing_archived(update: Update, context: CallbackContext):
    """Admin command to add archived=False to users who don't have the field."""
    if ADMIN_ID and str(update.effective_user.id) != ADMIN_ID:
        return await update.message.reply_text("❌ You're not authorized.")
    
    users_ref = db.collection("users")
    docs = users_ref.stream()
    updated_count = 0
    
    for doc in docs:
        data = doc.to_dict()
        if 'archived' not in data:
            doc.reference.update({
                'archived': False
            })
            updated_count += 1
    
    await update.message.reply_text(f"✅ Added archived=False to {updated_count} users.")

# Move the broadcast_message function before main()
async def broadcast_message(message_text, target_group, context, specific_user_ids=None):
    """Sends a message to specified user group (active, archived, all, or specific users)."""
    sent_count = 0
    formatted_message = (
        "📢 *HELLO MATES* 📢\n\n"
        f"{message_text}\n\n"
        f"⏰ {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}\n\n"
         "For support or questions, please contact:\n"
        "👉 IT SUPPORT WhatsApp: +254796806232\n\n"
        "Thank you for being part of our community!\n\n"
        "NeymarKim Management Team"
    )
    
    # Determine which users to target
    if target_group == "specific" and specific_user_ids:
        logging.info(f"Broadcasting to specific users: {specific_user_ids}")
        # Get specific users by their document IDs
        user_docs = []
        for user_id in specific_user_ids:
            try:
                doc_ref = db.collection("users").document(user_id)
                doc = doc_ref.get()
                if doc.exists:
                    user_docs.append(doc)
                    logging.info(f"Found user document: {doc.id}")
                else:
                    logging.warning(f"User document not found: {user_id}")
            except Exception as e:
                logging.exception(f"Error retrieving user {user_id}: {e}")
    elif target_group == "active":
        # Get all non-archived users
        query = db.collection("users").where("archived", "==", False)
        user_docs = query.stream()
    elif target_group == "archived":
        # Get all archived users
        query = db.collection("users").where("archived", "==", True)
        user_docs = query.stream()
    else:  # "all"
        # Get all users regardless of archived status
        query = db.collection("users")
        user_docs = query.stream()
    
    for user_doc in user_docs:
        data = user_doc.to_dict()
        uid = data.get("user_id")
        
        if uid:
            try:
                await context.bot.send_message(
                    chat_id=uid,
                    text=formatted_message,
                    parse_mode="Markdown"
                )
                sent_count += 1
                logging.info(f"Broadcast message sent to user {uid}")
                pytime.sleep(0.1)  # Avoid rate limiting
            except Exception as e:
                logging.warning(f"Failed to send broadcast to {uid}: {e}")
    
    return sent_count

# Helper function to setup the Telegram application
def setup_application():
    """Create and configure the Telegram bot application."""
    # Configure with longer timeouts for better reliability on Windows
    from telegram.request import HTTPXRequest
    
    request = HTTPXRequest(
        connection_pool_size=8,
        read_timeout=60.0,  # Increased timeout for slow connections
        write_timeout=60.0,
        connect_timeout=60.0,
        pool_timeout=60.0,
    )
    
    application = Application.builder().token(BOT_TOKEN).request(request).build()
    jq = application.job_queue
    
    # Schedule all periodic tasks
    jq.run_repeating(remove_expired_users, interval=3600, first=10)
    jq.run_daily(send_monday_message, time=datetime_time(8,0,tzinfo=timezone.utc), days=(0,))
    jq.run_once(send_support_reminder, when=1)
    
    # Add daily check for users expiring in 2 days - runs at 9:00 UTC every day
    jq.run_daily(send_expiry_reminders, time=datetime_time(9,0,tzinfo=timezone.utc))

    # Add command handlers
    application.add_handler(CommandHandler("start", start))
    application.add_handler(CallbackQueryHandler(button_handler))
    application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, check_access))
    application.add_handler(CommandHandler("getchatid", get_chat_id))
    application.add_handler(CommandHandler("debug", debug))
    application.add_handler(CommandHandler("allexpiredusers", allexpiredusers))
    application.add_handler(CommandHandler("signal", send_trading_signal))
    application.add_handler(CommandHandler("mondaymessage", lambda u,c: send_monday_message(c)))
    application.add_handler(CommandHandler("deleteuser", delete_user))
    application.add_handler(CommandHandler("neymar_admin_25", admin_menu))
    application.add_handler(CommandHandler("cleanup_archived", cleanup_archived_command))
    application.add_handler(CommandHandler("sendreminder", lambda u,c: send_support_reminder(c)))
    
    return application

# Keep only one main() function with all handlers
def main():
    # Set event loop policy for Windows BEFORE creating application
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())
    
    application = setup_application()

    # Start the Flask server in a separate thread
    flask_thread = threading.Thread(target=run_flask)
    flask_thread.daemon = True
    flask_thread.start()

    logging.info("🤖 Bot is starting…")
    
    # Retry logic for network errors
    max_retries = 5
    retry_delay = 5  # Start with 5 seconds
    
    for attempt in range(max_retries):
        # Reset event loop state before each attempt (especially important on Windows)
        if attempt > 0:
            try:
                # Close any existing event loop
                try:
                    loop = asyncio.get_event_loop()
                    if not loop.is_closed():
                        loop.close()
                except RuntimeError:
                    # No event loop exists, which is fine
                    pass
                # Create a new event loop for the retry
                # On Windows, use ProactorEventLoopPolicy for better compatibility
                if sys.platform == 'win32':
                    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())
                new_loop = asyncio.new_event_loop()
                asyncio.set_event_loop(new_loop)
            except Exception as e:
                logging.debug(f"Error resetting event loop: {e}")
        
        try:
            application.run_polling(
                stop_signals=None,  # Fix Windows signal handler warning
                drop_pending_updates=True,
                allowed_updates=None
            )
            break  # If successful, exit the retry loop
        except (NetworkError, ConnectionError, OSError, TimedOut) as e:
            error_msg = str(e)
            if attempt < max_retries - 1:
                logging.warning(f"Network error on attempt {attempt + 1}/{max_retries}: {error_msg}")
                logging.info(f"Retrying in {retry_delay} seconds...")
                # Clean up and recreate event loop before retry
                try:
                    try:
                        loop = asyncio.get_event_loop()
                        if not loop.is_closed():
                            loop.close()
                    except RuntimeError:
                        pass
                    if sys.platform == 'win32':
                        asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())
                    new_loop = asyncio.new_event_loop()
                    asyncio.set_event_loop(new_loop)
                except Exception as cleanup_error:
                    logging.debug(f"Error during cleanup: {cleanup_error}")
                pytime.sleep(retry_delay)
                retry_delay *= 2  # Exponential backoff
                # Recreate application for retry to ensure clean state
                application = setup_application()
            else:
                logging.error(f"Failed to start bot after {max_retries} attempts: {error_msg}")
                logging.error("This might be due to:")
                logging.error("1. Internet connection issues")
                logging.error("2. Firewall/antivirus blocking Telegram API")
                logging.error("3. VPN/proxy configuration problems")
                logging.error("4. Telegram API temporarily unavailable")
                raise
        except RuntimeError as e:
            # Handle event loop errors
            error_msg = str(e)
            if "Event loop is closed" in error_msg or "no current event loop" in error_msg.lower() or "coroutine" in error_msg.lower():
                if attempt < max_retries - 1:
                    logging.warning(f"Event loop error on attempt {attempt + 1}/{max_retries}: {error_msg}")
                    logging.info("Creating new event loop and retrying...")
                    # Create a new event loop
                    try:
                        try:
                            loop = asyncio.get_event_loop()
                            if not loop.is_closed():
                                loop.close()
                        except RuntimeError:
                            pass
                        if sys.platform == 'win32':
                            asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())
                        new_loop = asyncio.new_event_loop()
                        asyncio.set_event_loop(new_loop)
                    except Exception as cleanup_error:
                        logging.debug(f"Error during cleanup: {cleanup_error}")
                    pytime.sleep(retry_delay)
                    retry_delay *= 2
                    # Recreate application for retry
                    application = setup_application()
                else:
                    logging.error(f"Failed to start bot after {max_retries} attempts due to event loop issues")
                    raise
            else:
                raise
        except Exception as e:
            logging.error(f"Unexpected error starting bot: {e}")
            raise

# Add this at the end of the file
if __name__ == "__main__":
    main()
