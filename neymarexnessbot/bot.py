import os
import logging
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
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
BOT_TOKEN = os.getenv("BOT_TOKEN")
ADMIN_ID  = os.getenv("ADMIN_ID")  # your Telegram user ID if you use /signal

# Channel to which users will be invited
CHANNEL_ID = -1002493716889  # Updated with correct ID from image

# Initialize Firebase
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
    app.run(host='0.0.0.0', port=5000)

async def start(update: Update, context: CallbackContext):
    keyboard = [[InlineKeyboardButton("🎟 Enter Access Code", callback_data="enter_code")]]
    await update.message.reply_text(
        "👋 Welcome! Choose an option below:",
        reply_markup=InlineKeyboardMarkup(keyboard)
    )

async def button_handler(update: Update, context: CallbackContext):
    query = update.callback_query
    await query.answer()
    if query.data == "enter_code":
        await query.message.reply_text("🔑 Please enter your access code:")

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

        # Mark token used
        doc_ref.update({"used": True})

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

async def remove_expired_users(context: CallbackContext):
    """Runs hourly: moves expired users into `expired_users` and removes them from the channel."""
    now = datetime.now(timezone.utc)
    for user_doc in db.collection("users").stream():
        data   = user_doc.to_dict()
        expiry = data.get("expiry_date")
        uid    = data.get("user_id")

        if hasattr(expiry, "timestamp"):
            expiry = datetime.fromtimestamp(expiry.timestamp(), tz=timezone.utc)

        if now > expiry:
            try:
                # Notify
                await context.bot.send_message(
                    chat_id=uid,
                    text="⚠️ Your access has expired and you've been removed. Contact support to renew."
                )
                # Ban & unban to fully remove
                await context.bot.ban_chat_member(chat_id=CHANNEL_ID, user_id=uid)
                await context.bot.unban_chat_member(chat_id=CHANNEL_ID, user_id=uid)

                # Mark as archived in the users collection instead of moving to expired_users
                db.collection("users").document(str(uid)).update({
                    "archived": True,
                    "archivedAt": now
                })

                logging.info(f"Archived & removed expired user {uid}")
            except Exception:
                logging.exception(f"Failed to remove expired user {uid}")

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

async def debug(update: Update, context: CallbackContext):
    me = await context.bot.get_me()
    try:
        m = await context.bot.get_chat_member(CHANNEL_ID, me.id)
        status = m.status
    except Exception as e:
        status = f"{e.__class__.__name__}: {e}"
        
    # Try to get chat info directly
    try:
        chat_info = await context.bot.get_chat(CHANNEL_ID)
        chat_details = f"Found chat: {chat_info.title} (type: {chat_info.type})"
    except Exception as e:
        chat_details = f"Error getting chat: {e.__class__.__name__}: {e}"
    
    # Try with string version of ID
    try:
        chat_info_str = await context.bot.get_chat(str(CHANNEL_ID))
        chat_details_str = f"Found chat with string ID: {chat_info_str.title}"
    except Exception as e:
        chat_details_str = f"Error with string ID: {e.__class__.__name__}: {e}"
    
    # Try to get chat administrators
    try:
        admins = await context.bot.get_chat_administrators(CHANNEL_ID)
        admin_names = [f"{a.user.first_name} ({a.user.id})" for a in admins]
        admin_details = f"Found {len(admin_names)} admins: {', '.join(admin_names)}"
    except Exception as e:
        admin_details = f"Error getting admins: {e.__class__.__name__}: {e}"
    
    await update.message.reply_text(
        f"BotID: {me.id}\n"
        f"ChanID: {CHANNEL_ID}\n"
        f"Status: {status}\n"
        f"Chat details: {chat_details}\n"
        f"String ID test: {chat_details_str}\n"
        f"Admin details: {admin_details}"
    )

async def delete_user(update: Update, context: CallbackContext) -> None:
    """Delete a user from the channel (admin only)."""
    # Check if the user is an admin
    if update.effective_user.id != int(ADMIN_ID):
        await update.message.reply_text("⛔️ This command is only available to admins.")
        return
    
    # Check if a user ID was provided
    if not context.args or len(context.args) != 1:
        await update.message.reply_text("⚠️ Usage: /deleteuser <user_id>")
        return
    
    try:
        user_id = int(context.args[0])
        
        # Try to remove the user
        result = await remove_user(user_id, context)
        
        if result:
            await update.message.reply_text(f"✅ User {user_id} has been removed and archived.")
        else:
            await update.message.reply_text(f"❌ Failed to remove user {user_id}.")
            
    except ValueError:
        await update.message.reply_text("⚠️ Invalid user ID. Please provide a numeric ID.")

async def remove_user(user_id: int, context):
    """Removes a user from the channel and archives them."""
    try:
        # Notify the user
        try:
            await context.bot.send_message(
                chat_id=user_id,
                text="⚠️ Your access has been revoked by an administrator."
            )
        except Exception as e:
            logging.warning(f"Could not notify user {user_id}: {e}")
        
        # Ban & unban to fully remove
        await context.bot.ban_chat_member(chat_id=CHANNEL_ID, user_id=user_id)
        await context.bot.unban_chat_member(chat_id=CHANNEL_ID, user_id=user_id)
        
        # Get user data from Firestore
        user_doc = db.collection("users").document(str(user_id)).get()
        
        if user_doc.exists:
            # Update user document to mark as archived
            db.collection("users").document(str(user_id)).update({
                "archived": True,
                "archivedAt": datetime.now(timezone.utc)
            })
            
            logging.info(f"Successfully removed and archived user {user_id}")
            return True
        else:
            logging.warning(f"User {user_id} not found in database")
            return False
            
    except Exception as e:
        logging.exception(f"Failed to remove user {user_id}: {e}")
        return False

async def send_expiry_reminders(context: CallbackContext):
    """Sends reminders to users who will expire in 1 day."""
    now = datetime.now(timezone.utc)
    one_day_from_now = now + timedelta(days=1)
    
    for user_doc in db.collection("users").stream():
        data = user_doc.to_dict()
        expiry = data.get("expiry_date")
        uid = data.get("user_id")
        
        if hasattr(expiry, "timestamp"):
            expiry = datetime.fromtimestamp(expiry.timestamp(), tz=timezone.utc)
        
        # Check if expiry is within the next 24 hours (1 day)
        if now < expiry <= one_day_from_now:
            try:
                # Format the expiry date for the message
                expiry_formatted = expiry.strftime('%Y-%m-%d %H:%M UTC')
                
                # Send reminder message
                await context.bot.send_message(
                    chat_id=uid,
                    text=(
                        "⚠️ *SUBSCRIPTION EXPIRY REMINDER* ⚠️\n\n"
                        f"Your access will expire in less than 24 hours on: {expiry_formatted}\n\n"
                        "To continue receiving signals and maintain channel access, please contact:\n"
                        "👉 IT SUPPORT WhatsApp: +254796806232\n\n"
                        "Thank you for being part of our community!\n"
                        "NeymarKim Management Team"
                    ),
                    parse_mode="Markdown"
                )
                logging.info(f"Sent expiry reminder to user {uid}, expires on {expiry_formatted}")
                pytime.sleep(0.1)  # Avoid rate limiting
            except Exception as e:
                logging.warning(f"Failed to send expiry reminder to {uid}: {e}")

def main():
    application = Application.builder().token(BOT_TOKEN).build()
    jq = application.job_queue
    jq.run_repeating(remove_expired_users, interval=3600, first=10)
    jq.run_daily(send_monday_message, time=datetime_time(8,0,tzinfo=timezone.utc), days=(0,))
    jq.run_once(send_support_reminder, when=1)
    
    # Add daily check for users expiring in 2 days - runs at 9:00 UTC every day
    jq.run_daily(send_expiry_reminders, time=datetime_time(9,0,tzinfo=timezone.utc))

    application.add_handler(CommandHandler("start", start))
    application.add_handler(CallbackQueryHandler(button_handler))
    application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, check_access))
    application.add_handler(CommandHandler("getchatid", get_chat_id))
    application.add_handler(CommandHandler("debug", debug))
    application.add_handler(CommandHandler("allexpiredusers", allexpiredusers))
    application.add_handler(CommandHandler("signal", send_trading_signal))
    application.add_handler(CommandHandler("mondaymessage", lambda u,c: send_monday_message(c)))
    application.add_handler(CommandHandler("deleteuser", delete_user))

    # Add this line with your other command handlers
    application.add_handler(CommandHandler("sendreminder", lambda u,c: send_support_reminder(c)))

    # Start the Flask server in a separate thread
    flask_thread = threading.Thread(target=run_flask)
    flask_thread.daemon = True
    flask_thread.start()

    logging.info("🤖 Bot is starting…")
    application.run_polling()

# Add this function before the main() function
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

    
def main():
    application = Application.builder().token(BOT_TOKEN).build()
    jq = application.job_queue
    jq.run_repeating(remove_expired_users, interval=3600, first=10)
    jq.run_daily(send_monday_message, time=datetime_time(8,0,tzinfo=timezone.utc), days=(0,))
    jq.run_once(send_support_reminder, when=1)
    
    # Add daily check for users expiring in 2 days - runs at 9:00 UTC every day
    jq.run_daily(send_expiry_reminders, time=datetime_time(9,0,tzinfo=timezone.utc))

    application.add_handler(CommandHandler("start", start))
    application.add_handler(CallbackQueryHandler(button_handler))
    application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, check_access))
    application.add_handler(CommandHandler("getchatid", get_chat_id))
    application.add_handler(CommandHandler("debug", debug))
    application.add_handler(CommandHandler("allexpiredusers", allexpiredusers))
    application.add_handler(CommandHandler("signal", send_trading_signal))
    application.add_handler(CommandHandler("mondaymessage", lambda u,c: send_monday_message(c)))
    application.add_handler(CommandHandler("deleteuser", delete_user))

    # Add this line with your other command handlers
    application.add_handler(CommandHandler("sendreminder", lambda u,c: send_support_reminder(c)))

    # Start the Flask server in a separate thread
    flask_thread = threading.Thread(target=run_flask)
    flask_thread.daemon = True
    flask_thread.start()

    logging.info("🤖 Bot is starting…")
    application.run_polling()

if __name__ == "__main__":
    main()
