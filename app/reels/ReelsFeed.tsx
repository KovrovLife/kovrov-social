'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toggleReelLikeAction } from '../actions';
import ReelCommentsModal from '@/app/components/ReelCommentsModal';

export default function ReelsFeed({ reels, userId }: { reels: any[], userId: number }) {
  const router = useRouter();
  const [activeComments, setActiveComments] = useState<{ reelId: number, comments: any[] } | null>(null);

  return (
    <>
      <div className="h-[80vh] overflow-y-auto snap-y snap-mandatory rounded-lg bg-black scrollbar-hide shadow-xl">
        {reels.length === 0 && <p className="text-center text-gray-400 py-10">Пока нет видео. Загрузите первое!</p>}
        
        {reels.map((reel) => {
          const myLike = reel.my_vote === 'like';
          
          return (
            <div key={reel.id} className="snap-start h-full w-full flex items-center justify-center relative bg-black">
              
              {/* Кликабельная область для перехода на полноэкранный просмотр */}
              <div 
                className="absolute inset-0 z-0 cursor-pointer" 
                onClick={() => router.push(`/reels/${reel.id}`)}
              />

              <video src={reel.video_url} controls loop className="w-full h-full object-contain pointer-events-none" />
              
              <div className="absolute top-4 left-4 right-4 flex items-center gap-3 z-10 pointer-events-none">
                {reel.author_avatar ? <img src={reel.author_avatar} alt="ava" className="w-10 h-10 rounded-full object-cover border-2 border-white" /> : <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold">{reel.author_name[0]}</div>}
                <Link href={`/profile/${reel.user_id}`} className="font-semibold text-white drop-shadow-md hover:underline pointer-events-auto">{reel.author_name}</Link>
              </div>

              <div className="absolute bottom-4 left-4 right-16 z-10">
                <p className="text-white text-sm drop-shadow-md mb-2 line-clamp-3">{reel.description}</p>
              </div>

              <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-4 items-center">
                <form action={toggleReelLikeAction}>
                  <input type="hidden" name="reel_id" value={reel.id} />
                  <button className="flex flex-col items-center gap-1 text-white drop-shadow-md">
                    <div className={`p-3 rounded-full ${myLike ? 'bg-red-500/20 text-red-500' : 'bg-black/40 text-white hover:text-red-500 transition'}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.32 4.625 3 7.5 3c1.53 0 3.03.748 4.004 1.978C12.48 3.748 13.98 3 15.51 3c2.875 0 5.25 2.32 5.25 5.25 0 3.924-2.438 7.11-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" /></svg>
                    </div>
                    <span className="text-xs font-bold">{reel.likes_count}</span>
                  </button>
                </form>

                <button 
                  onClick={() => setActiveComments({ reelId: reel.id, comments: reel.comments })}
                  className="flex flex-col items-center gap-1 text-white drop-shadow-md z-20"
                >
                  <div className="p-3 rounded-full bg-black/40 hover:bg-black/60 transition">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z" /></svg>
                  </div>
                  <span className="text-xs font-bold">{reel.comments_count}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {activeComments && (
        <ReelCommentsModal 
          reelId={activeComments.reelId} 
          comments={activeComments.comments} 
          onClose={() => setActiveComments(null)} 
        />
      )}
    </>
  );
}