// A reminder only goes out after this long with nothing logged, and only once per quiet stretch
export const REMINDER_GAP_MS = 48 * 60 * 60 * 1000;

// Reminders land between these local hours, never early in the morning or late at night
export const REMINDER_EARLIEST_HOUR = 10;
export const REMINDER_LATEST_HOUR = 20;

// Kind on purpose: no streaks, no "you missed". Taking a break is fine.
export const REMINDER_MESSAGES = [
  { title: 'I hope you\'re finding the harmony in studying 💕', body: 'Remember to log your sessions, I heard there are some cool items in the shop.' },
  { title: 'Rest is just as important as studying 🫶', body: 'I hope you\'ve been able to get some rest. I\'ll be here when you\'re ready for some studying.' },
  { title: 'Hello from Harmony 🩺', body: 'Remember to log your sessions. Keep that streak going!' },
  { title: 'Just checking in 💓', body: 'Whenver you get back to it, log your session! I heard there are some cool items in the shop' },
];
