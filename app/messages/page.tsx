import { db } from '@/lib/db';
import { getUserId } from '@/lib/auth';
import { redirect } from 'next/navigation';
import MessengerLayout from './MessengerLayout';

export const dynamic = 'force-dynamic';

export default function MessagesPage() {
  const userId = getUserId();
  if (!userId) redirect('/login');

  const chats = db.prepare(`
    SELECT DISTINCT 
      u.id, 
      u.name, 
      u.avatar_url,
      u.last_seen,
      (SELECT body FROM messages WHERE (sender_id = ? AND receiver_id = u.id) OR (sender_id = u.id AND receiver_id = ?) ORDER BY created_at DESC LIMIT 1) as last_message,
      (SELECT created_at FROM messages WHERE (sender_id = ? AND receiver_id = u.id) OR (sender_id = u.id AND receiver_id = ?) ORDER BY created_at DESC LIMIT 1) as last_time
    FROM users u
    JOIN messages m ON (m.sender_id = u.id AND m.receiver_id = ?) OR (m.receiver_id = u.id AND m.sender_id = ?)
    WHERE u.id != ?
    ORDER BY last_time DESC
  `).all(userId, userId, userId, userId, userId, userId, userId) as any[];

  return <MessengerLayout chats={chats} currentUserId={userId} />;
}