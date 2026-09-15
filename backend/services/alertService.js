let lastSmsSentAt = 0;

const SMS_COOLDOWN_MS = 60 * 60 * 1000; // 1 hour

function shouldSendSms(riskLevel) {
  if (riskLevel !== "VERY_HIGH") {
    return false;
  }

  const now = Date.now();

  if (now - lastSmsSentAt < SMS_COOLDOWN_MS) {
    return false;
  }

  return true;
}

function markSmsSent() {
  lastSmsSentAt = Date.now();
}

function getCooldownRemainingMs() {
  const elapsed = Date.now() - lastSmsSentAt;

  return Math.max(0, SMS_COOLDOWN_MS - elapsed);
}

module.exports = {
  shouldSendSms,
  markSmsSent,
  getCooldownRemainingMs,
};
