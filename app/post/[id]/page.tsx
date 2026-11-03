import { db } from '@/lib/db';
import { getUserId } from '@/lib/auth';
import { notFound } from 'next/navigation';
import { closePostAction, reportAction, toggleLikeAction, toggleDislikeAction, addReplyCommentAction } from '../../actions';
import Link from 'next/link';
import UserBadge from '@/app/components/UserBadge';
import CommentForm from './CommentForm';
import EditPostForm from './EditPostForm';

export default function PostPage({ params, searchParams }: { params: { id: string }; searchParams: { reported?: string; edit?: string } }) {
  const userId = getUserId();
  const postId = Number(params.id);
  if (isNaN(postId)) notFound();

  const post = db.prepare(`
    SELECT posts.*, categories.name AS cat_name, districts.name AS dist_name, users.id AS author_id, users.name AS author, users.avatar_url AS author_avatar,
    (SELECT COUNT(*) FROM likes WHERE post_id = posts.id AND type = 'like') as likes_count,
    (SELECT COUNT(*) FROM likes WHERE post_id = posts.id AND type = 'dislike') as dislikes_count
    FROM posts 
    JOIN categories ON categories.id = posts.category_id 
    JOIN districts ON districts.id = posts.district_id 
    JOIN users ON users.id = posts.user_id 
    WHERE posts.id = ?
  `).get(postId) as any;

  if (!post) return <div className="text-center py-20 text-gray-500">Объявление не найдено</div>;

  const postPhotos = db.prepare('SELECT photo_url FROM post_photos WHERE post_id = ?').all(postId) as { photo_url: string }[];
  const myVote = userId ? (db.prepare('SELECT type FROM likes WHERE post_id = ? AND user_id = ?').get(postId, userId) as any)?.type : null;
  
  const allComments = db.prepare(`
    SELECT comments.*, users.name AS author, users.avatar_url AS author_avatar 
    FROM comments 
    JOIN users ON users.id = comments.user_id 
    WHERE comments.post_id = ? 
    ORDER BY comments.created_at ASC
  `).all(postId) as any[];

  const rootComments = allComments.filter(c => !c.parent_id);
  const getReplies = (parentId: number) => allComments.filter(c => c.parent_id === parentId);

  const isAuthor = userId === post.user_id;
  const closed = post.status === 'closed';
  const isEditing = isAuthor && searchParams.edit === 'true';

  return (
    <div className="space-y-6 w-full max-w-full overflow-hidden">
      <article className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-4 sm:p-6 space-y-4 shadow-sm">
        {closed && <p className="text-sm bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-3 py-1.5 rounded-md inline-block font-medium">Объявление закрыто</p>}
        
        {isEditing ? (
          <EditPostForm post={post} />
        ) : (
          <>
            <div className="text-xs text-gray-500 dark:text-gray-400 flex flex-wrap gap-2 items-center">
              <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full font-medium">{post.cat_name}</span>
              <span>{post.dist_name}</span><span>•</span>
              <div className="flex items-center gap-1.5">
                {post.author_avatar ? <img src={post.author_avatar} alt="ava" className="w-5 h-5 rounded-full object-cover" /> : <div className="w-5 h-5 rounded-full bg-emerald-200 text-emerald-800 flex items-center justify-center text-[10px] font-bold">{post.author[0]}</div>}
                {userId && userId !== post.author_id ? <UserBadge userId={post.author_id} name={post.author} /> : <span className="font-medium text-gray-700 dark:text-gray-300">{post.author}</span>}
              </div>
              <span>•</span>
              <span>{post.created_at}</span>
              {post.updated_at && <span className="text-gray-400">(ред.)</span>}
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white break-words">{post.title}</h1>
            
            {postPhotos.length > 0 ? (
              <div className="space-y-2">
                <img src={postPhotos[0].photo_url} alt={post.title} className="w-full max-h-[500px] object-contain rounded-md border dark:border-gray-600 bg-gray-50 dark:bg-gray-900" />
                {postPhotos.length > 1 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {postPhotos.slice(1).map((photo, idx) => (
                      <a href={photo.photo_url} target="_blank" rel="noopener noreferrer" key={idx} className="block aspect-square rounded-md overflow-hidden border dark:border-gray-600 hover:opacity-80 transition">
                        <img src={photo.photo_url} alt="" className="w-full h-full object-cover" />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ) : post.photo_url ? (
              <img src={post.photo_url} alt={post.title} className="w-full max-h-[500px] object-contain rounded-md border dark:border-gray-600 bg-gray-50 dark:bg-gray-900" />
            ) : null}

            <p className="whitespace-pre-wrap text-gray-800 dark:text-gray-200 leading-relaxed break-words">{post.body}</p>
            
            <div className="pt-4 border-t dark:border-gray-700 flex flex-wrap items-center gap-6">
              <div className="flex gap-4">
                <form action={toggleLikeAction}>
                  <input type="hidden" name="post_id" value={post.id} />
                  <button className={`flex items-center gap-1 text-sm transition ${myVote === 'like' ? 'text-emerald-600 font-bold' : 'text-gray-600 dark:text-gray-400 hover:text-emerald-600'}`}>👍 {post.likes_count}</button>
                </form>
                <form action={toggleDislikeAction}>
                  <input type="hidden" name="post_id" value={post.id} />
                  <button className={`flex items-center gap-1 text-sm transition ${myVote === 'dislike' ? 'text-red-600 font-bold' : 'text-gray-600 dark:text-gray-400 hover:text-red-600'}`}>👎 {post.dislikes_count}</button>
                </form>
              </div>

              {isAuthor && !closed && (
                <div className="ml-auto flex gap-2">
                  <Link href={`/post/${post.id}?edit=true`} className="text-sm border border-emerald-200 text-emerald-600 rounded-md px-4 py-2 hover:bg-emerald-50 transition font-medium">Редактировать</Link>
                  <form action={closePostAction}>
                    <input type="hidden" name="post_id" value={post.id} />
                    <button className="text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition font-medium">Закрыть</button>
                  </form>
                </div>
              )}
            </div>

            {!isAuthor && userId && (
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-lg p-5">
                  <h3 className="text-sm font-semibold text-red-800 dark:text-red-400 mb-3">Нарушение правил?</h3>
                  <form action={reportAction} className="flex flex-col sm:flex-row gap-3">
                    <input type="hidden" name="post_id" value={post.id} />
                    <input name="reason" placeholder="Причина..." required className="flex-1 border border-red-300 dark:border-red-800 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-red-500" />
                    <button className="bg-red-600 text-white text-sm font-medium px-6 py-2 rounded-md hover:bg-red-700 transition shadow-sm">Пожаловаться</button>
                  </form>
                  {searchParams.reported && <p className="text-sm text-green-700 dark:text-green-400 font-medium mt-3 bg-green-50 dark:bg-green-900/20 p-2 rounded border border-green-200 dark:border-green-800">✅ Жалоба отправлена!</p>}
                </div>
              </div>
            )}
          </>
        )}
      </article>

      <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-4 sm:p-6 shadow-sm">
        <h2 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Комментарии ({allComments.length})</h2>
        
        <div className="space-y-4 mb-6">
          {rootComments.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400">Нет комментариев.</p>}
          {rootComments.map((c) => (
            <div key={c.id} className="space-y-3">
              <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-md border dark:border-gray-700 text-sm flex gap-3">
                {c.author_avatar ? <img src={c.author_avatar} alt="ava" className="w-8 h-8 rounded-full object-cover shadow-sm mt-0.5" /> : <div className="w-8 h-8 rounded-full bg-emerald-200 text-emerald-800 flex items-center justify-center font-bold mt-0.5">{c.author[0]}</div>}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                    <span className="font-bold text-gray-800 dark:text-gray-200">{c.author}</span>
                    <span>{c.created_at}</span>
                  </div>
                  <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words">{c.body}</p>
                  
                  {userId && (
                    <form action={addReplyCommentAction} className="mt-2 flex gap-2" key={Date.now()}>
                      <input type="hidden" name="post_id" value={post.id} />
                      <input type="hidden" name="parent_id" value={c.id} />
                      <input name="body" placeholder="Ответить..." required className="flex-1 border dark:border-gray-600 rounded-md px-2 py-1 text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-1 focus:ring-emerald-500" />
                      <button className="text-xs text-emerald-600 font-medium hover:underline">Ответить</button>
                    </form>
                  )}
                </div>
              </div>
              
              {getReplies(c.id).map((reply) => (
                <div key={reply.id} className="ml-8 bg-gray-50 dark:bg-gray-900/30 p-3 rounded-md border dark:border-gray-700 text-sm flex gap-3">
                  {reply.author_avatar ? <img src={reply.author_avatar} alt="ava" className="w-6 h-6 rounded-full object-cover shadow-sm mt-0.5" /> : <div className="w-6 h-6 rounded-full bg-emerald-200 text-emerald-800 flex items-center justify-center font-bold mt-0.5 text-xs">{reply.author[0]}</div>}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                      <span className="font-bold text-gray-800 dark:text-gray-200">{reply.author}</span>
                      <span>{reply.created_at}</span>
                    </div>
                    <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words">{reply.body}</p>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
        
        {userId ? <CommentForm postId={post.id} /> : <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-2 bg-gray-50 dark:bg-gray-900/50 rounded-md border dark:border-gray-700"><Link href="/login" className="text-emerald-600 dark:text-emerald-400 font-medium hover:underline">Войдите</Link>, чтобы оставить комментарий.</p>}
      </div>
    </div>
  );
}