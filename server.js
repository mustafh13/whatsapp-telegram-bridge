const express = require("express");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// Test route
app.get("/", (req, res) => {
  res.send("WhatsApp → Telegram Bridge is running!");
});

// Meta Webhook verification
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }

  return res.sendStatus(403);
});

// Receive WhatsApp messages
app.post("/webhook", async (req, res) => {
  // Respond to Meta immediately
  res.sendStatus(200);

  try {
    const entry = req.body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const message = value?.messages?.[0];

    if (!message) return;

    const sender = message.from || "Unknown";

    // Only process text messages for now
    if (message.type === "text") {
      const text = message.text?.body || "";

      const telegramText =
        `📱 WhatsApp Message\n\n` +
        `👤 From: ${sender}\n\n` +
        `💬 ${text}`;

      await sendToTelegram(telegramText);
    }
  } catch (error) {
    console.error("Webhook error:", error);
  }
});

// Send message to Telegram
async function sendToTelegram(text) {
  const url =
    `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text: text
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Telegram error:", errorText);
  }
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
