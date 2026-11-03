'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AddStoryButton from './AddStoryButton';

export default function StoriesBar({ currentUserId }: { currentUserId: number }) {
  const [stories, setStories] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/stories')
      .then(res => res.json())
      .then(data => setStories(data))
      .catch(console.error);
  }, []);

  return (
    <div className="flex items-center gap-4 overflow-x-auto pb-4 mb-6 scrollbar-hide">
      <AddStoryButton />

      {stories.map((userStory) => (
        <Link key={userStory.user_id} href={`/stories/${userStory.stories[0].id}`} className="flex flex-col items-center gap-1 shrink-0 group">
          <div className="w-16 h-16 rounded-full border-2 border-emerald-500 p-0.5 group-hover:scale-105 transition-transform">
            {userStory.author_avatar ? (
              <img src={userStory.author_avatar} alt={userStory.author_name} className="w-full h-full rounded-full object-cover" />
            ) : (
              <div className="w-full h-full rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xl">{userStory.author_name[0]}</div>
            )}
          </div>
          <span className="text-xs text-gray-600 dark:text-gray-400 font-medium truncate w-16 text-center">{userStory.author_name}</span>
        </Link>
      ))}
    </div>
  );
}