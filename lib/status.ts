export function formatOnlineStatus(lastSeen: string | null): { text: string, isOnline: boolean } {
  if (!lastSeen) return { text: 'не в сети', isOnline: false };

  const lastSeenDate = new Date(lastSeen.replace(' ', 'T') + 'Z'); 
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - lastSeenDate.getTime()) / 1000);

  if (diffInSeconds < 120) {
    return { text: 'online', isOnline: true };
  }

  if (diffInSeconds < 3600) {
    const mins = Math.floor(diffInSeconds / 60);
    return { text: `был(а) ${mins} мин. назад`, isOnline: false };
  }

  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return { text: `был(а) ${hours} ч. назад`, isOnline: false };
  }

  const days = Math.floor(diffInSeconds / 86400);
  return { text: `был(а) ${days} дн. назад`, isOnline: false };
}