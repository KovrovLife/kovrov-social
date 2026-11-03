import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserId } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const userId = getUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const photoId = Number(searchParams.get('id'));
  if (!photoId) return NextResponse.json({ error: 'No ID' }, { status: 400 });

  // Получаем фото и автора
  const photo = db.prepare(`
    SELECT gallery_photos.*, users.name AS author_name, users.avatar_url AS author_avatar
    FROM gallery_photos 
    JOIN users ON users.id = gallery_photos.user_id 
    WHERE gallery_photos.id = ?
  `).get(photoId) as any;

  if (!photo) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Лайки
  const likesCount = (db.prepare('SELECT COUNT(*) as c FROM photo_likes WHERE photo_id = ? AND type = ?').get(photoId, 'like') as any).c;
  const myVote = db.prepare('SELECT type FROM photo_likes WHERE photo_id = ? AND user_id = ?').get(photoId, userId) as any;

  // Комментарии
  const comments = db.prepare(`
    SELECT photo_comments.*, users.name AS author_name, users.avatar_url AS author_avatar 
    FROM photo_comments 
    JOIN users ON users.id = photo_comments.user_id 
    WHERE photo_comments.photo_id = ? 
    ORDER BY photo_comments.created_at ASC
  `).all(photoId) as any[];

  return NextResponse.json({
    photo,
    likesCount,
    myVote: myVote?.type || null,
    comments
  });
}