import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserId } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const userId = getUserId();
  if (!userId) return NextResponse.json([]);

  const { searchParams } = new URL(req.url);
  const chatId = Number(searchParams.get('chatId'));
  if (!chatId) return NextResponse.json([]);

  const messages = db.prepare(`
    SELECT m.*, u.name AS sender_name 
    FROM messages m 
    JOIN users u ON m.sender_id = u.id
    WHERE (m.sender_id = ? AND m.receiver_id = ?) OR (m.sender_id = ? AND m.receiver_id = ?)
    ORDER BY m.created_at ASC
  `).all(userId, chatId, chatId, userId) as any[];

  return NextResponse.json(messages);
}