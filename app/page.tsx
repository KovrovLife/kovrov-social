import Link from 'next/link';
import { db } from '@/lib/db';
import { getUserId } from '@/lib/auth';
import { toggleLikeAction, toggleDislikeAction } from './actions';
import StoriesBar from './components/StoriesBar';

export const dynamic = 'force-dynamic';

type SP = { cat?: string; dist?: string; search?: string };

export default function Home({ searchParams }: { searchParams: SP }) {
  const userId = getUserId();
  const cats = db.prepare('SELECT * FROM categories').all() as any[];
  const dists = db.prepare('SELECT * FROM districts').all() as any[];

  let sql = `
    SELECT p.*, c.slug AS cat_slug, c.name AS cat_name, d.name AS dist_name, u.name AS author,
    (SELECT COUNT(*) FROM likes WHERE post_id = p.id AND type = 'like') as likes_count,
    (SELECT COUNT(*) FROM likes WHERE post_id = p.id AND type = 'dislike') as dislikes_count,
    (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments_count
  `;
  if (userId) {
    sql += `, (SELECT type FROM likes WHERE post_id = p.id AND user_id = ${userId}) as my_vote `;
  }
  sql += `FROM posts p JOIN categories c ON c.id = p.category_id JOIN districts d ON d.id = p.district_id JOIN users u ON u.id = p.user_id WHERE p.status = 'active'`;

  const params: (string | number)[] = [];
  if (searchParams.search) {
    sql += ' AND (p.title LIKE ? OR p.body LIKE ?)';
    params.push(`%${searchParams.search}%`, `%${searchParams.search}%`);
  }
  if (searchParams.cat) {
    sql += ' AND c.slug = ?';
    params.push(searchParams.cat);
  }
  if (searchParams.dist) {
    sql += ' AND d.id = ?';
    params.push(Number(searchParams.dist));
  }
  sql += ' ORDER BY p.created_at DESC LIMIT 100';
  const posts = db.prepare(sql).all(...params) as any[];

  return (
    <div>
      {userId && <StoriesBar currentUserId={userId} />}

      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border dark:border-gray-700 shadow-sm mb-6">
        <form className="flex flex-col sm:flex-row gap-3">
          <input type="text" name="search" defaultValue={searchParams.search || ''} placeholder="Что ищем?..." className="flex-1 border dark:border-gray-600 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none bg-white dark:bg-gray-900 text-gray-900 dark:text-white" />
          <select name="dist" defaultValue={searchParams.dist || ''} className="border dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none">
            <option value="">Все районы</option>
            {dists.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <input type="hidden" name="cat" value={searchParams.cat || ''} />
          <button className="text-sm px-6 py-2 bg-emerald-600 text-white font-medium rounded-md hover:bg-emerald-700 transition">Найти</button>
        </form>
        {(searchParams.search || searchParams.cat || searchParams.dist) && (
          <div className="mt-3 text-right"><Link href="/" className="text-xs text-gray-500 hover:text-red-500">Сбросить фильтры</Link></div>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <Link href={{ pathname: '/', query: { ...searchParams, cat: undefined } }} className={`text-sm px-4 py-1.5 rounded-full border transition ${!searchParams.cat ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>Все</Link>
        {cats.map((c) => (
          <Link key={c.id} href={{ pathname: '/', query: { ...searchParams, cat: c.slug } }} className={`text-sm px-4 py-1.5 rounded-full border transition ${searchParams.cat === c.slug ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>{c.name}</Link>
        ))}
      </div>

      {posts.length === 0 && <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 text-gray-500">Ничего не найдено.</div>}

      <ul className="space-y-4">
        {posts.map((p) => (
          <li key={p.id} className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-5 shadow-sm hover:shadow-md transition flex flex-col">
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-2">
              <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full font-medium">{p.cat_name}</span>
              <span>{p.dist_name}</span><span>•</span>
              <span>{p.author}</span><span>•</span><span>{p.created_at}</span>
            </div>
            <Link href={`/post/${p.id}`} className="font-bold text-lg hover:text-emerald-600 transition text-gray-900 dark:text-white break-words">{p.title}</Link>
            {p.photo_url && <img src={p.photo_url} alt={p.title} className="w-full max-h-60 object-cover rounded-md my-3 border dark:border-gray-700" />}
            <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 line-clamp-3 mb-4 break-words">{p.body}</p>
            
            <div className="mt-auto pt-3 border-t dark:border-gray-700 flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              <form action={toggleLikeAction} className="flex items-center">
                <input type="hidden" name="post_id" value={p.id} />
                <button className={`flex items-center gap-1 hover:text-emerald-600 transition ${p.my_vote === 'like' ? 'text-emerald-600 font-bold' : ''}`}>👍 {p.likes_count}</button>
              </form>
              <form action={toggleDislikeAction} className="flex items-center">
                <input type="hidden" name="post_id" value={p.id} />
                <button className={`flex items-center gap-1 hover:text-red-600 transition ${p.my_vote === 'dislike' ? 'text-red-600 font-bold' : ''}`}>👎 {p.dislikes_count}</button>
              </form>
              <Link href={`/post/${p.id}`} className="flex items-center gap-1 hover:text-gray-900 dark:hover:text-white transition ml-auto">💬 {p.comments_count}</Link>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}