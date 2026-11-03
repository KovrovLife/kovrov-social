'use client';

import { uploadGalleryPhotoAction } from '../../actions';

export default function UploadPhotoButton() {
  return (
    <form action={uploadGalleryPhotoAction} className="flex items-center">
      <label className="cursor-pointer flex items-center gap-1.5 text-sm text-emerald-600 hover:text-emerald-700 font-medium transition bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-md">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        Добавить фото
        <input 
          type="file" 
          name="photo" 
          accept="image/*" 
          required 
          className="hidden" 
          onChange={(e) => {
            if (e.target.files?.length) {
              e.target.form?.requestSubmit();
            }
          }} 
        />
      </label>
    </form>
  );
}