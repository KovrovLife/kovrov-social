'use client';

import { useState, useRef } from 'react';
import { createStoryAction } from '../actions';

export default function AddStoryButton() {
  const [isUploading, setIsUploading] = useState(false);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<string>('photo');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload-story', { method: 'POST', body: formData });
      const data = await res.json();
      
      if (data.error) throw new Error(data.error);

      setMediaUrl(data.url);
      setMediaType(data.type);
      
      // Автоматически отправляем форму после загрузки файла
      setTimeout(() => {
        formRef.current?.requestSubmit();
      }, 100);
      
    } catch (err) {
      alert('Ошибка загрузки истории');
      setIsUploading(false);
    }
  };

  return (
    <>
      <label className="flex flex-col items-center gap-1 shrink-0 cursor-pointer group">
        <div className={`w-16 h-16 rounded-full border-2 border-emerald-500 p-0.5 relative group-hover:scale-105 transition-transform ${isUploading ? 'opacity-50' : ''}`}>
          <div className="w-full h-full rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-emerald-500">
            {isUploading ? (
              <svg className="animate-spin h-5 w-5 text-emerald-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
            )}
          </div>
        </div>
        <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">Добавить</span>
        <input 
          type="file" 
          accept="image/*,video/*" 
          onChange={handleFileChange} 
          className="hidden" 
          disabled={isUploading} 
          ref={fileInputRef}
        />
      </label>

      {/* Скрытая форма, которая отправляет данные на сервер */}
      <form action={createStoryAction} ref={formRef} className="hidden">
        <input type="hidden" name="mediaUrl" value={mediaUrl || ''} />
        <input type="hidden" name="mediaType" value={mediaType} />
      </form>
    </>
  );
}