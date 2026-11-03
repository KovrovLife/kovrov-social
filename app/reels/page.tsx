import { db } from '@/lib/db';
import { getUserId } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import ReelUploadForm from './ReelUploadForm';
import ReelsFeed from './ReelsFeed';

export const dynamic = 'force-dynamic';

export default function ReelsPage() {
  const userId = getUserId();
  if (!userId) redirect('/login');

  const reels = db.prepare(`
    SELECT reels.*, users.name AS author_name, users.avatar_url AS author_avatar,
    (SELECT COUNT(*) FROM reel_likes WHERE reel_id = reels.id AND type = 'like') as likes_count,
    (SELECT COUNT(*) FROM reel_comments WHERE reel_id = reels.id) as comments_count,
    (SELECT type FROM reel_likes WHERE reel_id = reels.id AND user_id = ?) as my_vote
    FROM reels 
    JOIN users ON users.id = reels.user_id 
    ORDER BY reels.created_at DESC
  `).all(userId) as any[];

  const reelsWithComments = reels.map(reel => {
    const comments = db.prepare(`
      SELECT reel_comments.*, users.name AS author_name, users.avatar_url AS author_avatar 
      FROM reel_comments 
      JOIN users ON users.id = reel_comments.user_id 
      WHERE reel_comments.reel_id = ? 
      ORDER BY reel_comments.created_at ASC
    `).all(reel.id) as any[];
    
    return { ...reel, comments };
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Рилсы</h1>
        <Link href="/" className="text-emerald-600 hover:underline text-sm font-medium">← На главную</Link>
      </div>

      <ReelUploadForm />

      <ReelsFeed reels={reelsWithComments} userId={userId} />
    </div>
  );
}