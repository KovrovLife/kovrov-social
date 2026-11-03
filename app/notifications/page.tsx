import { db } from '@/lib/db';
import { getUserId } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { markNotificationsReadAction } from '../actions';

export const dynamic = 'force-dynamic';

export default function NotificationsPage() {
  const userId = getUserId();
  if (!userId) redirect('/login');

  const notifications = db.prepare(`
    SELECT n.*, u.name AS sender_name, u.avatar_url AS sender_avatar 
    FROM notifications n
    JOIN users u ON u.id = n.sender_id
    WHERE n.user_id = ?
    ORDER BY n.created_at DESC LIMIT 50
  `).all(userId) as any[];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Уведомления</h1>
        <form action={markNotificationsReadAction}>
          <button className="text-sm text-emerald-600 hover:underline">Прочитать все</button>
        </form>
      </div>

      <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-sm overflow-hidden">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500">У вас пока нет уведомлений.</div>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-700">
            {notifications.map((n) => {
              let text = '';
              let link = '#';
              
              if (n.type === 'like_post') { text = 'лайкнул ваше объявление'; link = `/post/${n.target_id}`; }
              if (n.type === 'comment_post') { text = 'оставил комментарий к вашему объявлению'; link = `/post/${n.target_id}`; }
              if (n.type === 'comment_photo') { text = 'оставил комментарий к вашей фотографии'; link = `/photo/${n.target_id}`; }
              if (n.type === 'comment_wall') { text = 'оставил запись на вашей стене'; link = `/profile/${n.user_id}`; }
              if (n.type === 'friend_request') { text = 'хочет добавить вас в друзья'; link = `/profile/${n.sender_id}`; }
              if (n.type === 'friend_accept') { text = 'принял вашу заявку в друзья'; link = `/profile/${n.sender_id}`; }

              return (
                <li key={n.id} className={`p-4 flex items-start gap-3 transition ${n.is_read === 0 ? 'bg-emerald-50/50 dark:bg-emerald-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}>
                  <Link href={`/profile/${n.sender_id}`}>
                    {n.sender_avatar ? <img src={n.sender_avatar} alt="ava" className="w-10 h-10 rounded-full object-cover" /> : <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">{n.sender_name[0]}</div>}
                  </Link>
                  <div className="flex-1">
                    <p className="text-sm text-gray-800 dark:text-gray-200">
                      <Link href={`/profile/${n.sender_id}`} className="font-semibold hover:text-emerald-600">{n.sender_name}</Link> {text}
                    </p>
                    <span className="text-xs text-gray-400 mt-1 block">{n.created_at}</span>
                  </div>
                  <Link href={link} className="text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 px-3 py-1.5 rounded-md transition">Перейти</Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}