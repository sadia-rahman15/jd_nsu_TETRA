const db = require("./db");

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

// Fire-and-forget: never throws, never blocks/fails the caller's request.
const sendPushToUser = async (userId, { title, body, data }) => {
  try {
    const [tokens] = await db.execute(
      `SELECT expo_push_token
       FROM device_push_tokens
       WHERE user_id = ?`,
      [userId]
    );

    if (!tokens.length) {
      return;
    }

    const messages = tokens.map((row) => ({
      to: row.expo_push_token,
      sound: "default",
      title,
      body,
      data: data || {},
    }));

    await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(messages),
    });
  } catch (error) {
    console.error("Push notification send failed:", error);
  }
};

module.exports = { sendPushToUser };
