import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserId } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const userId = getUserId();
  if (!userId) return NextResponse.json([]);

  // Получаем список ID друзей (кому мы отправили заявку или кто нам, и она принята)
  const friends = db.prepare(`
    SELECT CASE 
      WHEN user_id = ? THEN friend_id 
      ELSE user_id 
    END AS friend_id
    FROM friends 
    WHERE (user_id = ? OR friend_id = ?) AND status = 'accepted'
  `).all(userId, userId, userId) as { friend_id: number }[];

  const friendIds = friends.map(f => f.friend_id);
  
  // Формируем список ID, чьи истории мы хотим видеть (свои + друзья)
  const allowedUserIds = [userId, ...friendIds];

  if (allowedUserIds.length === 0) return NextResponse.json([]);

  // Создаем строку с плейсхолдерами для SQL (?, ?, ?...)
  const placeholders = allowedUserIds.map(() => '?').join(',');

  const stories = db.prepare(`
    SELECT stories.*, users.name AS author_name, users.avatar_url AS author_avatar
    FROM stories 
    JOIN users ON users.id = stories.user_id 
    WHERE stories.created_at >= datetime('now', '-1 day')
    AND stories.user_id IN (${placeholders})
    ORDER BY stories.created_at DESC
  `).all(...allowedUserIds) as any[];

  // Группируем истории по пользователям
  const grouped = stories.reduce((acc: any, story: any) => {
    if (!acc[story.user_id]) {
      acc[story.user_id] = { user_id: story.user_id, author_name: story.author_name, author_avatar: story.author_avatar, stories: [] };
    }
    acc[story.user_id].stories.push(story);
    return acc;
  }, {});

  return NextResponse.json(Object.values(grouped));
}