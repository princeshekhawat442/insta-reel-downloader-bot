const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

// 👉 Handle /start command
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, `
👋 Hey there!

Welcome to the Instagram Reel/Post Downloader Bot 🌟

🎥 Send any public Instagram link — reel or post — and I’ll fetch it in seconds!

⚡ No login | Free | Instant HD
  `);
});

// 👉 Handle Instagram links
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  // Ignore non-instagram links or /start
  if (!text || !text.includes('instagram.com') || text.startsWith('/start')) return;

  try {
    const response = await axios.get('https://instagram-downloader-download-instagram-stories-videos4.p.rapidapi.com/convert', {
      params: { url: text },
      headers: {
        'x-rapidapi-host': 'instagram-downloader-download-instagram-stories-videos4.p.rapidapi.com',
        'x-rapidapi-key': process.env.RAPIDAPI_KEY
      }
    });

    const mediaItems = response.data.media;

    if (!mediaItems || mediaItems.length === 0) {
      return bot.sendMessage(chatId, '❌ No media found in this post.');
    }

    for (let i = 0; i < mediaItems.length; i++) {
      const media = mediaItems[i];
      const fileUrl = media.url;
      const isVideo = fileUrl.endsWith('.mp4');

      const filePath = path.resolve(__dirname, media-${i}.${isVideo ? 'mp4' : 'jpg'});
      const writer = fs.createWriteStream(filePath);

      const mediaResponse = await axios({
        url: fileUrl,
        method: 'GET',
        responseType: 'stream'
      });

      mediaResponse.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });

      if (isVideo) {
        await bot.sendVideo(chatId, filePath);
      } else {
        await bot.sendPhoto(chatId, filePath);
      }

      fs.unlinkSync(filePath);
    }

  } catch (err) {
    console.error(err.message);
    bot.sendMessage(chatId, '❌ Error fetching or sending media. Please try again later.');
  }
});
