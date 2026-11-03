import { db } from '@/lib/db';
import { getUserId } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import ReelPlayer from './ReelPlayer';

export const dynamic = 'force-dynamic';

export default function ReelViewPage({ params }: { params: { id: string } }) {
  const userId = getUserId();
  if (!userId) redirect('/login');

  const startId = Number(params.id);
  if (isNaN(startId)) notFound();

  // Получаем ВСЕ рилсы, чтобы можно было листать дальше
  const reels = db.prepare(`
    SELECT reels.*, users.name AS author_name, users.avatar_url AS author_avatar,
    (SELECT COUNT(*) FROM reel_likes WHERE reel_id = reels.id AND type = 'like') as likes_count,
    (SELECT COUNT(*) FROM reel_comments WHERE reel_id = reels.id) as comments_count,
    (SELECT type FROM reel_likes WHERE reel_id = reels.id AND user_id = ?) as my_vote
    FROM reels 
    JOIN users ON users.id = reels.user_id 
    ORDER BY reels.created_at DESC
  `).all(userId) as any[];

  if (reels.length === 0) return <div className="text-center py-20">Видео пока нет</div>;

  // Находим индекс видео, на которое кликнули
  const startIndex = reels.findIndex(r => r.id === startId);
  if (startIndex === -1) notFound();

  // Сортируем так, чтобы кликнутое видео было первым, а остальные шли после него (для прокрутки)
  const sortedReels = [...reels.slice(startIndex), ...reels.slice(0, startIndex)];

  // Для каждого рилса подгружаем комментарии
  const reelsWithComments = sortedReels.map(reel => {
    const comments = db.prepare(`
      SELECT reel_comments.*, users.name AS author_name, users.avatar_url AS author_avatar 
      FROM reel_comments 
      JOIN users ON users.id = reel_comments.user_id 
      WHERE reel_comments.reel_id = ? 
      ORDER BY reel_comments.created_at ASC
    `).all(reel.id) as any[];
    
    return { ...reel, comments };
  });

  return <ReelPlayer reels={reelsWithComments} userId={userId} />;
}