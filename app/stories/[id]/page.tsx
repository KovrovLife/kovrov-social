import { db } from '@/lib/db';
import { getUserId } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';

export default function StoryViewPage({ params }: { params: { id: string } }) {
  const userId = getUserId();
  if (!userId) redirect('/login');

  const storyId = Number(params.id);
  if (isNaN(storyId)) notFound();

  const story = db.prepare(`
    SELECT stories.*, users.name AS author_name, users.avatar_url AS author_avatar 
    FROM stories 
    JOIN users ON users.id = stories.user_id 
    WHERE stories.id = ?
  `).get(storyId) as any;

  if (!story) notFound();

  return (
    // Затемненный фон на весь экран
    <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
      
      // Окно истории по центру
      <div className="relative w-full max-w-sm h-[80vh] bg-black rounded-2xl overflow-hidden shadow-2xl flex flex-col">
        
        {/* Верхняя панель с информацией об авторе */}
        <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 to-transparent z-10 flex items-center gap-3">
          {story.author_avatar ? (
            <img src={story.author_avatar} alt="ava" className="w-8 h-8 rounded-full object-cover border-2 border-white" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold">{story.author_name[0]}</div>
          )}
          <div>
            <p className="text-white font-semibold text-sm shadow-sm">{story.author_name}</p>
            <p className="text-white/70 text-xs">{story.created_at}</p>
          </div>
          
          {/* Кнопка закрытия (крестик) */}
          <Link href="/" className="ml-auto text-white/80 hover:text-white p-2 transition">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </Link>
        </div>

        {/* Само медиа (фото или видео) */}
        <div className="flex-1 flex items-center justify-center bg-black">
          {story.media_type === 'video' ? (
            <video src={story.media_url} autoPlay controls className="w-full h-full object-contain" />
          ) : (
            <img src={story.media_url} alt="story" className="w-full h-full object-contain" />
          )}
        </div>
        
      </div>
    </div>
  );
}