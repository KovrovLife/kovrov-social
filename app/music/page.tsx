'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { uploadTrackAction, addTrackToMyMusicAction, removeTrackFromMyMusicAction } from '../actions';

export default function MusicPage({ searchParams }: { searchParams: { tab?: string } }) {
  const [tracks, setTracks] = useState<any[]>([]);
  const [myTracks, setMyTracks] = useState<any[]>([]);
  const [currentTrack, setCurrentTrack] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const fetchTracks = async () => {
    const res = await fetch('/api/tracks');
    const data = await res.json();
    setTracks(data.tracks);
    setMyTracks(data.myTracks);
  };

  useEffect(() => {
    fetchTracks();
  }, []);

  const togglePlay = (track: any) => {
    if (currentTrack?.id === track.id) {
      if (isPlaying) {
        audioRef.current?.pause();
        setIsPlaying(false);
      } else {
        audioRef.current?.play();
        setIsPlaying(true);
      }
    } else {
      setCurrentTrack(track);
      setIsPlaying(true);
      setTimeout(() => {
        audioRef.current?.play();
      }, 100);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-24">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Музыка</h1>
        <Link href="/" className="text-emerald-600 hover:underline text-sm font-medium">← На главную</Link>
      </div>

      {/* Форма загрузки трека */}
      <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-4 shadow-sm">
        <h2 className="text-lg font-bold mb-3">Загрузить трек</h2>
        <form action={uploadTrackAction} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input name="title" placeholder="Название" required className="border dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white" />
          <input name="artist" placeholder="Исполнитель" required className="border dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white" />
          <input type="file" name="file" accept="audio/*" required className="text-sm text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100" />
          <button className="sm:col-span-3 bg-emerald-600 text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-emerald-700 transition">Загрузить</button>
        </form>
      </div>

      {/* Список треков */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Все треки */}
        <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-4 shadow-sm">
          <h2 className="text-lg font-bold mb-3">Все треки</h2>
          <div className="space-y-2">
            {tracks.length === 0 && <p className="text-sm text-gray-500">Пока нет треков.</p>}
            {tracks.map((track) => (
              <div key={track.id} className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg">
                <div className="flex items-center gap-3">
                  <button onClick={() => togglePlay(track)} className="text-emerald-600 hover:text-emerald-700">
                    {currentTrack?.id === track.id && isPlaying ? (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path fillRule="evenodd" d="M6.75 5.25a.75.75 0 01.75-.75H9a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H7.5a.75.75 0 01-.75-.75V5.25zm7.5 0A.75.75 0 0115 4.5h1.5a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H15a.75.75 0 01-.75-.75V5.25z" clipRule="evenodd" /></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" /></svg>
                    )}
                  </button>
                  <div>
                    <p className="font-semibold text-sm">{track.title}</p>
                    <p className="text-xs text-gray-500">{track.artist}</p>
                  </div>
                </div>
                <form action={addTrackToMyMusicAction}>
                  <input type="hidden" name="track_id" value={track.id} />
                  <button className="text-xs text-emerald-600 hover:underline">+ В мои</button>
                </form>
              </div>
            ))}
          </div>
        </div>

        {/* Мои треки */}
        <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-4 shadow-sm">
          <h2 className="text-lg font-bold mb-3">Мои аудиозаписи</h2>
          <div className="space-y-2">
            {myTracks.length === 0 && <p className="text-sm text-gray-500">Вы еще не добавили ни одного трека.</p>}
            {myTracks.map((track) => (
              <div key={track.id} className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg">
                <div className="flex items-center gap-3">
                  <button onClick={() => togglePlay(track)} className="text-emerald-600 hover:text-emerald-700">
                    {currentTrack?.id === track.id && isPlaying ? (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path fillRule="evenodd" d="M6.75 5.25a.75.75 0 01.75-.75H9a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H7.5a.75.75 0 01-.75-.75V5.25zm7.5 0A.75.75 0 0115 4.5h1.5a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H15a.75.75 0 01-.75-.75V5.25z" clipRule="evenodd" /></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" /></svg>
                    )}
                  </button>
                  <div>
                    <p className="font-semibold text-sm">{track.title}</p>
                    <p className="text-xs text-gray-500">{track.artist}</p>
                  </div>
                </div>
                <form action={removeTrackFromMyMusicAction}>
                  <input type="hidden" name="track_id" value={track.id} />
                  <button className="text-xs text-red-500 hover:underline">Удалить</button>
                </form>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Аудиоплеер */}
      {currentTrack && (
        <div className="fixed bottom-16 left-0 right-0 md:bottom-0 bg-white dark:bg-gray-800 border-t dark:border-gray-700 p-4 shadow-lg z-[100]">
          <div className="max-w-4xl mx-auto flex items-center gap-4">
            <audio ref={audioRef} src={currentTrack.file_url} onEnded={() => setIsPlaying(false)} />
            <div className="flex-1">
              <p className="font-bold text-sm">{currentTrack.title}</p>
              <p className="text-xs text-gray-500">{currentTrack.artist}</p>
            </div>
            <button onClick={() => togglePlay(currentTrack)} className="text-emerald-600 p-2">
              {isPlaying ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8"><path fillRule="evenodd" d="M6.75 5.25a.75.75 0 01.75-.75H9a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H7.5a.75.75 0 01-.75-.75V5.25zm7.5 0A.75.75 0 0115 4.5h1.5a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H15a.75.75 0 01-.75-.75V5.25z" clipRule="evenodd" /></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8"><path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" /></svg>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}