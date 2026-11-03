'use client';

import { useState } from 'react';
import { addCommentAction, addPhotoCommentAction } from '../../actions';

export default function CommentForm({ postId, isPhoto = false }: { postId: number, isPhoto?: boolean }) {
  const [text, setText] = useState('');
  const emojis = ['😊', '😂', '😍', '👍', '🔥', '❤️', '🙏', '😮', '😢', '🤔'];

  const handleEmojiClick = (emoji: string) => {
    setText((prev) => prev + emoji);
  };

  const actionToUse = isPhoto ? addPhotoCommentAction : addCommentAction;

  return (
    <div className="flex flex-col gap-2 mt-2 w-full">
      <div className="flex flex-wrap gap-1 mb-1">
        {emojis.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => handleEmojiClick(emoji)}
            className="text-xl hover:scale-125 transition-transform p-1 cursor-pointer"
          >
            {emoji}
          </button>
        ))}
      </div>
      
      <form action={actionToUse} className="flex flex-col gap-2">
        <input type="hidden" name={isPhoto ? "photo_id" : "post_id"} value={postId} />
        <textarea
          name="body"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Написать комментарий..."
          required
          rows={2}
          className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
        />
        <button className="self-end bg-gray-900 text-white text-sm font-medium px-6 py-2 rounded-md hover:bg-gray-800 transition">
          Отправить
        </button>
      </form>
    </div>
  );
}