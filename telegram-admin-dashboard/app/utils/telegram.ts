import axios from 'axios';

// You'll need to set these environment variables in your .env file
const TELEGRAM_API_URL = 'https://api.telegram.org/bot';
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const CHAT_ID = process.env.TELEGRAM_CHAT_ID || '';

// Get all chat members
export async function getChatMembers() {
  try {
    // For testing, return an empty array to avoid API errors
    // Replace this with actual API call when you have proper credentials
    console.log('Getting chat members (mock)');
    return [];
    
    // Actual implementation:
    // const response = await axios.get(`${TELEGRAM_API_URL}${BOT_TOKEN}/getChatAdministrators`, {
    //   params: {
    //     chat_id: CHAT_ID
    //   }
    // });
    // return response.data.result;
  } catch (error) {
    console.error('Error fetching chat members:', error);
    throw error;
  }
}

// Ban a user from the chat
export async function banChatMember(userId: string) {
  try {
    // For testing, just log and return success to avoid API errors
    // Replace this with actual API call when you have proper credentials
    console.log('Banning chat member (mock):', userId);
    return true;
    
    // Actual implementation:
    // const response = await axios.get(`${TELEGRAM_API_URL}${BOT_TOKEN}/banChatMember`, {
    //   params: {
    //     chat_id: CHAT_ID,
    //     user_id: userId
    //   }
    // });
    // return response.data.result;
  } catch (error) {
    console.error('Error banning chat member:', error);
    throw error;
  }
}

// Remove user from channel and archive them
export async function removeAndArchiveUser(userId: string) {
  try {
    const response = await axios.post(`${TELEGRAM_API_URL}${BOT_TOKEN}/banChatMember`, {
      chat_id: CHAT_ID,
      user_id: userId,
      revoke_messages: false
    });
    
    // Unban immediately after banning (this removes them without allowing them to rejoin)
    if (response.data.ok) {
      await axios.post(`${TELEGRAM_API_URL}${BOT_TOKEN}/unbanChatMember`, {
        chat_id: CHAT_ID,
        user_id: userId,
        only_if_banned: true
      });
    }
    
    return response.data.ok;
  } catch (error) {
    console.error('Error removing user from channel:', error);
    throw error;
  }
}