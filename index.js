require('dotenv').config();
const axios = require('axios');
const TelegramBot = require('node-telegram-bot-api');
const cron = require('node-cron');

// Telegram Bot Token and Chat ID
const token = process.env.TELEGRAM_BOT_TOKEN || '';
const chatId = process.env.TELEGRAM_CHAT_ID || '';
const bot = new TelegramBot(token, {polling: true});

// Function to fetch latest articles
async function fetchLatestArticles() {
  try {
    const response = await axios.get('https://www.xdc.dev/api/articles/latest');
    return response.data;
  } catch (error) {
    console.error(error);
    return [];
  }
}

// Function to send notification
function sendNotification(article) {
  const message = `New Article: ${article.title}\nLink: ${article.url}`;
  bot.sendMessage(chatId, message);
}

// Previous articles cache
let previousArticles = [];

// Scheduled task to check for new articles
cron.schedule('*/1 * * * *', async () => { // Runs every 30 minutes
  console.log('Checking for new articles...');
  const latestArticles = await fetchLatestArticles();

  const newArticles = latestArticles.filter(article => !previousArticles.includes(article.id));

  if (newArticles.length > 0) {
    newArticles.forEach(article => sendNotification(article));
    previousArticles = latestArticles.map(article => article.id); // Update cache
  }
});

console.log('Bot started...');
