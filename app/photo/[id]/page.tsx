import { db } from '@/lib/db';
import { getUserId } from '@/lib/auth';
import { notFound } from 'next/navigation';
import { togglePhotoLikeAction, togglePhotoDislikeAction, addPhotoCommentAction } from '../../actions';
import Link from 'next/link';
import UserBadge from '@/app/components/UserBadge';
import CommentForm from '../../post/[id]/CommentForm';

export default function PhotoPage({ params }: { params: { id: string } }) {
  const userId = getUserId();
  const photoId = Number(params.id);
  if (isNaN(photoId)) notFound();

  const photo = db.prepare(`
    SELECT gallery_photos.*, users.id AS author_id, users.name AS author, users.avatar_url AS author_avatar,
    (SELECT COUNT(*) FROM photo_likes WHERE photo_id = gallery_photos.id AND type = 'like') as likes_count,
    (SELECT COUNT(*) FROM photo_likes WHERE photo_id = gallery_photos.id AND type = 'dislike') as dislikes_count
    FROM gallery_photos 
    JOIN users ON users.id = gallery_photos.user_id 
    WHERE gallery_photos.id = ?
  `).get(photoId) as any;

  if (!photo) return <div className="text-center py-20 text-gray-500">Фото не найдено</div>;

  const myVote = userId ? (db.prepare('SELECT type FROM photo_likes WHERE photo_id = ? AND user_id = ?').get(photoId, userId) as any)?.type : null;
  const comments = db.prepare(`SELECT photo_comments.*, users.name AS author, users.avatar_url AS author_avatar FROM photo_comments JOIN users ON users.id = photo_comments.user_id WHERE photo_comments.photo_id = ? ORDER BY photo_comments.created_at ASC`).all(photoId) as any[];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white border rounded-lg overflow-hidden shadow-sm">
        <img src={photo.photo_url} alt="Фото" className="w-full max-h-[70vh] object-contain bg-black" />
        
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-3">
            {photo.author_avatar ? <img src={photo.author_avatar} alt="ava" className="w-10 h-10 rounded-full object-cover shadow-sm" /> : <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">{photo.author[0]}</div>}
            <div>
              {userId && userId !== photo.author_id ? <UserBadge userId={photo.author_id} name={photo.author} /> : <span className="font-bold text-gray-800">{photo.author}</span>}
              <p className="text-xs text-gray-500">{photo.created_at}</p>
            </div>
          </div>

          <div className="flex gap-4 pt-2 border-t">
            <form action={togglePhotoLikeAction}>
              <input type="hidden" name="photo_id" value={photo.id} />
              <button className={`flex items-center gap-1 text-sm transition ${myVote === 'like' ? 'text-emerald-600 font-bold' : 'text-gray-600 hover:text-emerald-600'}`}>
                👍 {photo.likes_count}
              </button>
            </form>
            <form action={togglePhotoDislikeAction}>
              <input type="hidden" name="photo_id" value={photo.id} />
              <button className={`flex items-center gap-1 text-sm transition ${myVote === 'dislike' ? 'text-red-600 font-bold' : 'text-gray-600 hover:text-red-600'}`}>
                👎 {photo.dislikes_count}
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="bg-white border rounded-lg p-6 shadow-sm">
        <h2 className="text-lg font-bold mb-4">Комментарии ({comments.length})</h2>
        <div className="space-y-4 mb-6">
          {comments.length === 0 && <p className="text-sm text-gray-500">Нет комментариев.</p>}
          {comments.map((c) => (
            <div key={c.id} className="bg-gray-50 p-3 rounded-md border text-sm flex gap-3">
              {c.author_avatar ? <img src={c.author_avatar} alt="ava" className="w-8 h-8 rounded-full object-cover shadow-sm mt-0.5" /> : <div className="w-8 h-8 rounded-full bg-emerald-200 text-emerald-800 flex items-center justify-center font-bold mt-0.5">{c.author[0]}</div>}
              <div className="flex-1">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span className="font-bold text-gray-800">{c.author}</span>
                  <span>{c.created_at}</span>
                </div>
                <p className="text-gray-800 whitespace-pre-wrap">{c.body}</p>
              </div>
            </div>
          ))}
        </div>
        
        {userId ? (
          <CommentForm postId={photo.id} isPhoto={true} />
        ) : (
          <p className="text-sm text-gray-500 text-center py-2 bg-gray-50 rounded-md border">
            <Link href="/login" className="text-emerald-600 font-medium hover:underline">Войдите</Link>, чтобы оставить комментарий.
          </p>
        )}
      </div>
    </div>
  );
}