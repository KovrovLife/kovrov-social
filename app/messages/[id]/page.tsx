import { db } from '@/lib/db';
import { getUserId } from '@/lib/auth';
import { redirect } from 'next/navigation';
import ChatView from './ChatView';

export const dynamic = 'force-dynamic';

export default function ChatPage({ params }: { params: { id: string } }) {
  const userId = getUserId();
  if (!userId) redirect('/login');

  const otherUserId = Number(params.id);
  if (isNaN(otherUserId) || otherUserId === userId) redirect('/messages');

  const otherUser = db.prepare('SELECT id, name, avatar_url FROM users WHERE id = ?').get(otherUserId) as any;
  if (!otherUser) redirect('/messages');

  const messages = db.prepare(`
    SELECT m.*, u.name AS sender_name 
    FROM messages m 
    JOIN users u ON m.sender_id = u.id
    WHERE (m.sender_id = ? AND m.receiver_id = ?) OR (m.sender_id = ? AND m.receiver_id = ?)
    ORDER BY m.created_at ASC
  `).all(userId, otherUserId, otherUserId, userId) as any[];

  return <ChatView messages={messages} otherUser={otherUser} userId={userId} />;
}