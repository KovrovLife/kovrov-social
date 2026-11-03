'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { togglePhotoLikeAction, togglePhotoDislikeAction, addPhotoCommentAction } from '../../actions';

export default function PhotoModal({ photoId, onClose }: { photoId: number, onClose: () => void }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const commentsEndRef = useRef<HTMLDivElement>(null);

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/photo?id=${photoId}`);
      const json = await res.json();
      if (!json.error) {
        setData(json);
        setTimeout(() => commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [photoId]);

  const handleLike = async (type: 'like' | 'dislike') => {
    const formData = new FormData();
    formData.append('photo_id', photoId.toString());
    
    if (type === 'like') {
      await togglePhotoLikeAction(formData);
    } else {
      await togglePhotoDislikeAction(formData);
    }
    fetchData(); // Обновляем данные после лайка
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    const formData = new FormData();
    formData.append('photo_id', photoId.toString());
    formData.append('body', commentText);
    
    await addPhotoCommentAction(formData);
    setCommentText('');
    fetchData(); // Обновляем комментарии
  };

  if (loading) return null;
  if (!data) return null;

  return (
    <div className="fixed inset-0 bg-black/90 z-[200] flex items-center justify-center p-4 sm:p-10 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="bg-white dark:bg-[#1a1a1a] w-full max-w-5xl h-[80vh] rounded-lg overflow-hidden shadow-2xl flex flex-col md:flex-row"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Левая часть: Фото */}
        <div className="flex-1 bg-black flex items-center justify-center relative min-h-[50vh] md:min-h-0">
          <img src={data.photo.photo_url} alt="Фото" className="max-w-full max-h-full object-contain" />
        </div>

        {/* Правая часть: Инфо и Комментарии */}
        <div className="w-full md:w-[350px] flex flex-col bg-white dark:bg-gray-800 border-l dark:border-gray-700">
          
          {/* Шапка */}
          <div className="p-4 border-b dark:border-gray-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {data.photo.author_avatar ? (
                <img src={data.photo.author_avatar} alt="ava" className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">{data.photo.author_name[0]}</div>
              )}
              <div>
                <Link href={`/profile/${data.photo.user_id}`} className="font-semibold text-sm text-gray-900 dark:text-white hover:text-emerald-600">
                  {data.photo.author_name}
                </Link>
                <p className="text-xs text-gray-500">{data.photo.created_at}</p>
              </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-800 dark:hover:text-white p-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          {/* Кнопки лайков */}
          <div className="p-3 border-b dark:border-gray-700 flex gap-4">
            <button onClick={() => handleLike('like')} className={`flex items-center gap-1 text-sm transition ${data.myVote === 'like' ? 'text-emerald-600 font-bold' : 'text-gray-600 dark:text-gray-400 hover:text-emerald-600'}`}>
              👍 {data.likesCount}
            </button>
            <button onClick={() => handleLike('dislike')} className={`flex items-center gap-1 text-sm transition ${data.myVote === 'dislike' ? 'text-red-600 font-bold' : 'text-gray-600 dark:text-gray-400 hover:text-red-600'}`}>
              👎
            </button>
          </div>

          {/* Комментарии */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {data.comments.length === 0 && <p className="text-center text-gray-500 text-sm mt-4">Оставьте первый комментарий к этой фотографии</p>}
            {data.comments.map((c: any) => (
              <div key={c.id} className="flex gap-2 text-sm">
                {c.author_avatar ? (
                  <img src={c.author_avatar} alt="ava" className="w-8 h-8 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shrink-0">{c.author_name[0]}</div>
                )}
                <div className="flex-1">
                  <Link href={`/profile/${c.user_id}`} className="font-semibold text-gray-900 dark:text-white hover:text-emerald-600">{c.author_name}</Link>
                  <p className="text-gray-800 dark:text-gray-200 mt-0.5">{c.body}</p>
                  <span className="text-[10px] text-gray-400 mt-1 block">{c.created_at}</span>
                </div>
              </div>
            ))}
            <div ref={commentsEndRef} />
          </div>

          {/* Форма ввода */}
          <form onSubmit={handleCommentSubmit} className="p-3 border-t dark:border-gray-700 flex gap-2">
            <input 
              type="text" 
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Написать комментарий..." 
              className="flex-1 border dark:border-gray-600 rounded-full px-4 py-2 text-sm bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button type="submit" className="bg-emerald-600 text-white text-sm font-medium px-4 py-2 rounded-full hover:bg-emerald-700 transition">Отправить</button>
          </form>

        </div>
      </div>
    </div>
  );
}