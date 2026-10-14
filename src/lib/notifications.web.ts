// Reminders are phone-only; the browser never schedules anything

export const notificationsSupported = false;

export async function hasPermission() {
  return false;
}

export async function requestPermission() {
  return false;
}

export async function scheduleReminder(_date: Date, _content: { title: string; body: string }) {}

export async function cancelReminders() {}
