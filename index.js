require('dotenv').config();
const axios = require('axios');
const TelegramBot = require('node-telegram-bot-api');
const cron = require('node-cron');
const fs = require('fs');


// Telegram Bot Token and Chat ID
const token = process.env.TELEGRAM_BOT_TOKEN || '';
const chatIds = process.env.TELEGRAM_CHAT_ID ? process.env.TELEGRAM_CHAT_ID.split(',') : [];
const bot = new TelegramBot(token, { polling: true });

async function fetchLatestArticles() {
  try {
    const response = await axios.get('https://www.xdc.dev/api/articles/latest');
    return response.data;
  } catch (error) {
    console.error(error);
    return [];
  }
}

// Function to read previously notified article IDs from a file
function readPreviousArticleIds() {
  try {
    const data = fs.readFileSync('previousArticleIds.json', 'utf-8');
    return new Set(JSON.parse(data));
  } catch (error) {
    // If the file doesn't exist or there is an error, return an empty set
    return new Set();
  }
}

// Function to write currently notified article IDs to a file
function writePreviousArticleIds(previousArticleIds) {
  const data = JSON.stringify(Array.from(previousArticleIds));
  fs.writeFileSync('previousArticleIds.json', data, 'utf-8');
}

// Function to send a notification to a specific chat
function sendNotification(chatId, article) {
  const message = `New Article: ${article.title}\nLink: ${article.url}`;
  console.log('Sending notification to chat ID:', chatId);
  bot.sendMessage(chatId, message)
    .then(() => console.log('Notification sent to chat ID:', chatId))
    .catch(error => console.error('Error sending notification:', error.message));
}

console.log('Bot started with the following chat IDs:', chatIds);

// Initialize previousArticleIds with the values read from the file
let previousArticleIds = readPreviousArticleIds();

// Scheduled task to check for new articles
cron.schedule('*/1 * * * *', async () => { // Runs every minute
  console.log('Checking for new articles...');
  const latestArticles = await fetchLatestArticles();

  // Get the latest 10 articles
  const latest10Articles = latestArticles.slice(0, 10);

  // Iterate through the latest articles and send notifications for new ones
  for (const article of latest10Articles) {
    if (!previousArticleIds.has(article.id)) {
      // Send notification for the new article to each chat
      chatIds.forEach(chatId => {
        sendNotification(chatId, article);
      });

      // Update cache with the ID of the latest article
      previousArticleIds.add(article.id);
    }
  }

  // Write the updated article IDs to the file
  writePreviousArticleIds(previousArticleIds);
});

console.log('Bot started...');