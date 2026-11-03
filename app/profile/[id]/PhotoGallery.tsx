'use client';

import { useState } from 'react';
import PhotoModal from './PhotoModal';

export default function PhotoGallery({ photos, isMe }: { photos: any[], isMe: boolean }) {
  const [selectedPhotoId, setSelectedPhotoId] = useState<number | null>(null);

  return (
    <>
      <div className="grid grid-cols-3 gap-1">
        {photos.map((photo) => (
          <button 
            key={photo.id} 
            onClick={() => setSelectedPhotoId(photo.id)}
            className="group relative block aspect-square overflow-hidden rounded-md bg-gray-100 dark:bg-gray-900 cursor-pointer"
          >
            <img src={photo.photo_url} alt="Фото" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8 text-white opacity-80">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </div>
          </button>
        ))}
      </div>

      {selectedPhotoId && (
        <PhotoModal 
          photoId={selectedPhotoId} 
          onClose={() => setSelectedPhotoId(null)} 
        />
      )}
    </>
  );
}