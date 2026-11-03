'use client';

import { useState } from 'react';
import { addReelCommentAction } from '../actions';
import Link from 'next/link';

export default function ReelCommentsModal({ reelId, comments, onClose }: { reelId: number, comments: any[], onClose: () => void }) {
  const [text, setText] = useState('');
  const [localComments, setLocalComments] = useState(comments);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!text.trim()) return;

    const formData = new FormData();
    formData.append('reel_id', reelId.toString());
    formData.append('body', text);

    try {
      // Вызываем серверный экшен напрямую
      await addReelCommentAction(formData);
      
      // После успешной отправки очищаем поле и перезагружаем страницу,
      // чтобы увидеть новый комментарий (пока делаем так для простоты)
      setText('');
      window.location.reload(); 
    } catch (err) {
      console.error(err);
      alert('Ошибка при отправке комментария');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-[200] flex items-end sm:items-center justify-center backdrop-blur-sm" onClick={onClose}>
      <div 
        className="bg-white dark:bg-gray-800 w-full max-w-md h-[70vh] rounded-t-2xl sm:rounded-2xl flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
          <h3 className="font-bold text-gray-900 dark:text-white">Комментарии ({localComments.length})</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 dark:hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {localComments.length === 0 && <p className="text-center text-gray-500 text-sm mt-4">Комментариев пока нет.</p>}
          {localComments.map((c) => (
            <div key={c.id} className="flex gap-3 text-sm">
              {c.author_avatar ? (
                <img src={c.author_avatar} alt="ava" className="w-8 h-8 rounded-full object-cover shrink-0" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shrink-0">{c.author_name[0]}</div>
              )}
              <div className="flex-1 bg-gray-50 dark:bg-gray-900/50 p-2.5 rounded-lg border dark:border-gray-700">
                <div className="flex justify-between items-center mb-1">
                  <Link href={`/profile/${c.user_id}`} className="font-bold text-gray-900 dark:text-white hover:text-emerald-600">{c.author_name}</Link>
                  <span className="text-[10px] text-gray-400">{c.created_at.split(' ')[1].slice(0,5)}</span>
                </div>
                <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words">{c.body}</p>
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="p-3 border-t dark:border-gray-700 flex gap-2">
          <input 
            name="body" 
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Написать комментарий..." 
            required 
            className="flex-1 border dark:border-gray-600 rounded-full px-4 py-2 text-sm bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none" 
          />
          <button type="submit" className="bg-emerald-600 text-white text-sm font-medium px-4 py-2 rounded-full hover:bg-emerald-700 transition">Отправить</button>
        </form>
      </div>
    </div>
  );
}