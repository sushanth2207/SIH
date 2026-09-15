const twilio = require("twilio");

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN,
);

async function sendHeatAlert() {
  return client.messages.create({
    body: "sms_account_alerts",
    from: process.env.TWILIO_PHONE_NUMBER,
    to: process.env.ALERT_PHONE_NUMBER,
  });
}

module.exports = {
  sendHeatAlert,
};
