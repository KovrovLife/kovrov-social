'use client';

import { useState, useRef } from 'react';
import { createPostAction } from '../actions';

export default function NewPostForm({ cats, dists, defaultDistrictId }: { cats: any[], dists: any[], defaultDistrictId: number }) {
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previews, setPreviews] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      const newFiles = Array.from(selectedFiles);
      setFiles(prev => [...prev, ...newFiles]);
      const newPreviews = newFiles.map(file => URL.createObjectURL(file));
      setPreviews(prev => [...prev, ...newPreviews]);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removePhoto = (index: number) => {
    setPreviews(prev => prev.filter((_, i) => i !== index));
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    const form = e.currentTarget;
    const title = (form.elements.namedItem('title') as HTMLInputElement).value;
    const body = (form.elements.namedItem('body') as HTMLTextAreaElement).value;
    const categoryId = (form.elements.namedItem('category_id') as HTMLSelectElement).value;
    const districtId = (form.elements.namedItem('district_id') as HTMLSelectElement).value;

    try {
      // 1. Сначала загружаем файлы на сервер
      const formData = new FormData();
      files.forEach(file => formData.append('photos', file));

      const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
      const uploadData = await uploadRes.json();
      const photoUrls = uploadData.urls || [];

      // 2. Затем создаем пост с полученными ссылками
      await createPostAction(title, body, Number(categoryId), Number(districtId), photoUrls);
    } catch (err: any) {
      setError(err.message || 'Ошибка при создании объявления');
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-red-600 text-sm bg-red-50 p-2 rounded">{error}</p>}
      
      <input name="title" placeholder="Заголовок" required className="w-full border dark:border-gray-600 rounded-md px-3 py-2 focus:ring-2 focus:ring-emerald-500 outline-none bg-white dark:bg-gray-900 text-gray-900 dark:text-white" />
      
      <textarea name="body" placeholder="Описание" required rows={5} className="w-full border dark:border-gray-600 rounded-md px-3 py-2 focus:ring-2 focus:ring-emerald-500 outline-none bg-white dark:bg-gray-900 text-gray-900 dark:text-white" />
      
      <div className="flex flex-col gap-2">
        <label className="text-sm text-gray-600 dark:text-gray-400 font-medium">Фотографии</label>
        
        <input type="file" accept="image/*" multiple ref={fileInputRef} onChange={handleFileChange} className="hidden" />

        {previews.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-2">
            {previews.map((src, idx) => (
              <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border dark:border-gray-600 group">
                <img src={src} alt="preview" className="w-full h-full object-cover" />
                <button type="button" onClick={() => removePhoto(idx)} className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" /></svg>
                </button>
              </div>
            ))}
          </div>
        )}

        <button type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition font-medium">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          {previews.length === 0 ? 'Добавить фото' : 'Добавить еще фото'}
        </button>
      </div>

      <select name="category_id" required className="w-full border dark:border-gray-600 rounded-md px-3 py-2 focus:ring-2 focus:ring-emerald-500 outline-none bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
        <option value="">Выберите категорию</option>
        {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
      
      <select name="district_id" required defaultValue={defaultDistrictId} className="w-full border dark:border-gray-600 rounded-md px-3 py-2 focus:ring-2 focus:ring-emerald-500 outline-none bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
        {dists.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
      </select>
      
      <button disabled={isSubmitting} className="w-full bg-emerald-600 text-white rounded-md px-3 py-2 font-medium hover:bg-emerald-700 transition disabled:opacity-50 flex justify-center items-center gap-2">
        {isSubmitting ? 'Публикуем...' : 'Опубликовать'}
      </button>
    </form>
  );
}