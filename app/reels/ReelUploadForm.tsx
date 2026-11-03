'use client';

import { useState, useRef } from 'react';
import { createReelAction } from '../actions';

export default function ReelUploadForm() {
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    const form = e.currentTarget;
    const description = (form.elements.namedItem('description') as HTMLTextAreaElement).value;
    const fileInput = form.querySelector('input[type="file"]') as HTMLInputElement;
    const file = fileInput?.files?.[0];

    if (!file) {
      setError('Выберите видео');
      setIsSubmitting(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('video', file);

      const res = await fetch('/api/upload-video', { method: 'POST', body: formData });
      const data = await res.json();

      if (data.error) throw new Error(data.error);

      await createReelAction(description, data.url);
    } catch (err: any) {
      setError(err.message || 'Ошибка загрузки');
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-4 shadow-sm space-y-4">
      <h2 className="text-lg font-bold text-gray-900 dark:text-white">Загрузить рилс</h2>
      {error && <p className="text-red-600 text-sm bg-red-50 p-2 rounded">{error}</p>}
      
      <input 
        type="file" 
        accept="video/mp4,video/x-m4v,video/*" 
        ref={fileInputRef} 
        onChange={handleFileChange}
        className="hidden" 
      />

      {preview && (
        <video src={preview} controls className="w-full max-h-60 object-contain bg-black rounded-md" />
      )}

      <button 
        type="button" 
        onClick={() => fileInputRef.current?.click()}
        className="w-full py-2 border-2 border-dashed border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400 rounded-md hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition font-medium text-sm"
      >
        {preview ? 'Выбрать другое видео' : 'Выбрать видео'}
      </button>

      <textarea 
        name="description" 
        placeholder="Описание к видео (необязательно)" 
        rows={2} 
        className="w-full border dark:border-gray-600 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none bg-white dark:bg-gray-900 text-gray-900 dark:text-white" 
      />

      <button disabled={isSubmitting} className="w-full bg-emerald-600 text-white rounded-md px-3 py-2 font-medium hover:bg-emerald-700 transition disabled:opacity-50">
        {isSubmitting ? 'Загрузка...' : 'Опубликовать'}
      </button>
    </form>
  );
}