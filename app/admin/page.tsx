import { db } from '@/lib/db';
import { getUserId } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { deletePostAction, dismissReportAction, dismissUserReportAction } from '../actions';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function AdminPage() {
  const userId = getUserId();
  if (!userId) redirect('/login');

  const me = db.prepare('SELECT name, is_admin FROM users WHERE id = ?').get(userId) as any;
  
  // Если пользователь не админ — выгоняем
  if (me.is_admin !== 1) {
    return <div className="text-center py-20 text-red-600 font-bold">Доступ запрещен. Вы не администратор.</div>;
  }

  const postReports = db.prepare(`
    SELECT r.id as report_id, r.reason, p.id as post_id, p.title, p.status, u.name as reporter
    FROM reports r JOIN posts p ON r.post_id = p.id JOIN users u ON r.user_id = u.id ORDER BY r.created_at DESC
  `).all() as any[];

  const userReports = db.prepare(`
    SELECT r.id as report_id, r.reason, u.id as target_id, u.name as target_name
    FROM user_reports r JOIN users u ON r.user_id = u.id ORDER BY r.created_at DESC
  `).all() as any[];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Админ-панель</h1>
        <Link href="/" className="text-emerald-600 hover:underline text-sm font-medium">← На главную</Link>
      </div>

      <div>
        <h2 className="text-xl font-bold mb-4 text-gray-800">Жалобы на объявления ({postReports.length})</h2>
        {postReports.length === 0 ? (
          <div className="bg-white border rounded-lg p-6 text-center text-gray-500 shadow-sm">Жалоб на объявления нет.</div>
        ) : (
          <ul className="space-y-4">
            {postReports.map((r) => (
              <li key={r.report_id} className="bg-white border border-red-200 rounded-lg p-5 shadow-sm space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs text-red-600 font-bold uppercase">От: {r.reporter}</span>
                    <p className="text-sm font-medium mt-1">Причина: {r.reason}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${r.status === 'closed' ? 'bg-gray-100' : 'bg-emerald-50 text-emerald-700'}`}>{r.status === 'closed' ? 'Закрыто' : 'Активно'}</span>
                </div>
                <div className="bg-gray-50 p-3 rounded-md border text-sm">
                  <span className="text-gray-500">Объявление: </span>
                  <Link href={`/post/${r.post_id}`} className="font-semibold hover:underline" target="_blank">{r.title}</Link>
                </div>
                <div className="flex gap-3 pt-2">
                  <form action={deletePostAction}>
                    <input type="hidden" name="post_id" value={r.post_id} />
                    <button className="text-sm bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition">Удалить объявление</button>
                  </form>
                  <form action={dismissReportAction}>
                    <input type="hidden" name="report_id" value={r.report_id} />
                    <button className="text-sm bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition">Отклонить жалобу</button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h2 className="text-xl font-bold mb-4 text-gray-800">Жалобы на пользователей ({userReports.length})</h2>
        {userReports.length === 0 ? (
          <div className="bg-white border rounded-lg p-6 text-center text-gray-500 shadow-sm">Жалоб на пользователей нет.</div>
        ) : (
          <ul className="space-y-4">
            {userReports.map((r) => (
              <li key={r.report_id} className="bg-white border border-red-200 rounded-lg p-5 shadow-sm space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium">Причина: {r.reason}</p>
                  </div>
                </div>
                <div className="bg-gray-50 p-3 rounded-md border text-sm">
                  <span className="text-gray-500">Пользователь: </span>
                  <Link href={`/profile/${r.target_id}`} className="font-semibold hover:underline">{r.target_name}</Link>
                </div>
                <div className="flex gap-3 pt-2">
                  <form action={dismissUserReportAction}>
                    <input type="hidden" name="report_id" value={r.report_id} />
                    <button className="text-sm bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition">Отклонить жалобу</button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}