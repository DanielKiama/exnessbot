import { json } from "@remix-run/node";
import axios from "axios";

export async function loader() {
  try {
    const TELEGRAM_API_URL = 'https://api.telegram.org/bot';
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
    
    if (!BOT_TOKEN || !CHAT_ID) {
      return json({ error: "Bot token or chat ID not configured" }, { status: 500 });
    }
    
    const response = await axios.get(`${TELEGRAM_API_URL}${BOT_TOKEN}/getChatAdministrators`, {
      params: {
        chat_id: CHAT_ID
      }
    });
    
    if (response.data.ok) {
      return json({ admins: response.data.result });
    } else {
      return json({ error: response.data.description }, { status: 500 });
    }
  } catch (error) {
    console.error("Error fetching Telegram admins:", error);
    return json({ 
      error: error instanceof Error ? error.message : "Failed to fetch Telegram admins" 
    }, { status: 500 });
  }
}