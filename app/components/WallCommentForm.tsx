'use client';

import { useState } from 'react';
import { addWallCommentAction } from '../actions';

export default function WallCommentForm({ wallPostId, ownerId }: { wallPostId: number, ownerId: number }) {
  const [text, setText] = useState('');
  const emojis = ['😊', '😂', '😍', '👍', '🔥', '❤️'];

  const handleEmojiClick = (emoji: string) => {
    setText((prev) => prev + emoji);
  };

  return (
    <form action={addWallCommentAction} className="mt-3 flex flex-col gap-2 pl-8">
      <input type="hidden" name="wall_post_id" value={wallPostId} />
      <input type="hidden" name="owner_id" value={ownerId} />
      
      <div className="flex flex-wrap gap-1">
        {emojis.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => handleEmojiClick(emoji)}
            className="text-lg hover:scale-125 transition-transform p-0.5 cursor-pointer"
          >
            {emoji}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          name="body"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Написать комментарий..."
          required
          className="flex-1 border rounded-md px-2 py-1 text-sm focus:ring-1 focus:ring-emerald-500 outline-none bg-gray-50"
        />
        <button className="text-xs bg-gray-200 text-gray-700 font-medium px-3 py-1 rounded-md hover:bg-gray-300 transition">Ответить</button>
      </div>
    </form>
  );
}