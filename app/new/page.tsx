import { db } from '@/lib/db';
import { getUserId } from '@/lib/auth';
import { redirect } from 'next/navigation';
import NewPostForm from './NewPostForm';

export default function NewPost({ searchParams }: { searchParams: { error?: string } }) {
  const userId = getUserId();
  if (!userId) redirect('/login');
  
  const me = db.prepare('SELECT district_id FROM users WHERE id = ?').get(userId) as { district_id: number };
  const cats = db.prepare('SELECT * FROM categories').all() as { id: number; name: string }[];
  const dists = db.prepare('SELECT * FROM districts').all() as { id: number; name: string }[];

  return (
    <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-6 space-y-4 shadow-sm">
      <h1 className="text-xl font-bold text-gray-900 dark:text-white">Новое объявление</h1>
      {searchParams.error && <p className="text-red-600 text-sm">{searchParams.error}</p>}
      
      <NewPostForm cats={cats} dists={dists} defaultDistrictId={me.district_id} />
    </div>
  );
}