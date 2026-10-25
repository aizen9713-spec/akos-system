const DAILY_TRANSMISSION_CATEGORIES =
  Object.keys(DAILY_TRANSMISSIONS);

function getDailyTransmission() {
  const categoryIndex =
    state.dailyMessageIndex %
    DAILY_TRANSMISSION_CATEGORIES.length;

  const category =
    DAILY_TRANSMISSION_CATEGORIES[categoryIndex];

  const messages =
    DAILY_TRANSMISSIONS[category];

  const messageCycle =
    Math.floor(
      state.dailyMessageIndex /
      DAILY_TRANSMISSION_CATEGORIES.length
    );

  const messageIndex =
    messageCycle % messages.length;

  return {
    category,
    message: messages[messageIndex]
  };
}