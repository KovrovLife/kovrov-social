'use client';

import { useState, useRef } from 'react';
import { updatePostAction } from '../../actions';

export default function EditPostForm({ post }: { post: any }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [preview, setPreview] = useState<string | null>(post.photo_url);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPreview(URL.createObjectURL(file));
    }
  };

  return (
    <form 
      action={updatePostAction} 
      className="space-y-4"
      onSubmit={() => setIsSubmitting(true)}
    >
      <h2 className="text-lg font-bold text-gray-900 dark:text-white">Редактирование объявления</h2>
      
      <input type="hidden" name="post_id" value={post.id} />
      
      <input 
        name="title" 
        defaultValue={post.title} 
        placeholder="Заголовок" 
        required 
        className="w-full border dark:border-gray-600 rounded-md px-3 py-2 focus:ring-2 focus:ring-emerald-500 outline-none bg-white dark:bg-gray-900 text-gray-900 dark:text-white" 
      />
      
      <textarea 
        name="body" 
        defaultValue={post.body} 
        placeholder="Описание" 
        required 
        rows={5} 
        className="w-full border dark:border-gray-600 rounded-md px-3 py-2 focus:ring-2 focus:ring-emerald-500 outline-none bg-white dark:bg-gray-900 text-gray-900 dark:text-white" 
      />
      
      <div className="flex flex-col gap-2">
        <label className="text-sm text-gray-600 dark:text-gray-400 font-medium">Обложка объявления</label>
        {preview && (
          <img src={preview} alt="Preview" className="w-full max-h-40 object-contain rounded-md border dark:border-gray-600 bg-gray-50 dark:bg-gray-900" />
        )}
        <input 
          type="file" 
          name="photo" 
          accept="image/*" 
          ref={fileInputRef}
          onChange={handleFileChange}
          className="text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-white file:text-emerald-700 hover:file:bg-gray-50" 
        />
      </div>

      <div className="flex gap-2 justify-end pt-2">
        <a href={`/post/${post.id}`} className="text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-1.5 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition">Отмена</a>
        <button disabled={isSubmitting} className="text-sm bg-emerald-600 text-white px-4 py-1.5 rounded-md hover:bg-emerald-700 transition disabled:opacity-50">
          {isSubmitting ? 'Сохранение...' : 'Сохранить'}
        </button>
      </div>
    </form>
  );
}