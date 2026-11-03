import { db } from '@/lib/db';
import { getUserId } from '@/lib/auth';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function PeoplePage({ searchParams }: { searchParams: { q?: string } }) {
  const userId = getUserId();
  if (!userId) redirect('/login');
  const query = searchParams.q || '';
  let users;
  if (query) users = db.prepare('SELECT id, name, avatar_url FROM users WHERE name LIKE ? AND id != ? LIMIT 50').all(`%${query}%`, userId) as any[];
  else users = db.prepare('SELECT id, name, avatar_url FROM users WHERE id != ? LIMIT 50').all(userId) as any[];

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Люди</h1>
      <form className="mb-6 flex gap-2">
        <input type="text" name="q" defaultValue={query} placeholder="Поиск по нику..." className="flex-1 border rounded-md px-3 py-2 text-sm" />
        <button className="bg-emerald-600 text-white px-6 py-2 rounded-md font-medium hover:bg-emerald-700">Найти</button>
      </form>
      <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
        <ul className="divide-y divide-gray-100">
          {users.map((u) => (
            <li key={u.id}>
              <Link href={`/profile/${u.id}`} className="flex items-center gap-4 p-4 hover:bg-gray-50 transition">
                {u.avatar_url ? (
                  <img src={u.avatar_url} alt="ava" className="w-10 h-10 rounded-full object-cover shadow-sm" />
                ) : (
                  <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-bold">{u.name[0].toUpperCase()}</div>
                )}
                <span className="font-medium text-gray-800">{u.name}</span>
              </Link>
            </li>
          ))}
          {users.length === 0 && <p className="p-6 text-center text-gray-500">Никого не нашли.</p>}
        </ul>
      </div>
    </div>
  );
}