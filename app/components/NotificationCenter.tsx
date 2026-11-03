'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function NotificationCenter() {
  const [msgCount, setMsgCount] = useState(0);
  const [notifCount, setNotifCount] = useState(0);
  const [toast, setToast] = useState<string | null>(null);

  // Эффект для автоматического скрытия окна через 5 секунд
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    const checkUpdates = async () => {
      try {
        const [msgRes, notifRes] = await Promise.all([
          fetch('/api/unread'),
          fetch('/api/notifications')
        ]);
        const msgData = await msgRes.json();
        const notifData = await notifRes.json();
        
        setMsgCount(msgData.count);
        setNotifCount(notifData.count);

        // Получаем, какое количество мы уже показывали
        const lastShownMsg = Number(localStorage.getItem('lastShownMsg') || '0');
        const lastShownNotif = Number(localStorage.getItem('lastShownNotif') || '0');

        // Показываем, только если количество УВЕЛИЧИЛОСЬ
        if (msgData.count > lastShownMsg) {
          setToast(`У вас ${msgData.count} новых сообщений!`);
          localStorage.setItem('lastShownMsg', msgData.count.toString());
          // Обнуляем счетчик уведомлений, чтобы следующее уведомление сработало
          localStorage.setItem('lastShownNotif', notifData.count.toString());
        } else if (notifData.count > lastShownNotif) {
          setToast(`У вас ${notifData.count} новых уведомлений!`);
          localStorage.setItem('lastShownNotif', notifData.count.toString());
          // Обнуляем счетчик сообщений
          localStorage.setItem('lastShownMsg', msgData.count.toString());
        }
      } catch (e) {
        console.error(e);
      }
    };

    checkUpdates();
    const interval = setInterval(checkUpdates, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <Link href="/notifications" className="relative flex items-center gap-1.5 text-sm font-medium bg-emerald-600/30 hover:bg-emerald-600/60 p-2 sm:px-3 sm:py-1.5 rounded-full transition-colors whitespace-nowrap" onClick={() => {
        // При переходе в уведомления сбрасываем "запомненное", чтобы следующее уведомление снова вызвало всплывашку
        localStorage.setItem('lastShownNotif', '0'); 
      }}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 opacity-90">
          <path fillRule="evenodd" d="M5.25 9a6.75 6.75 0 0113.5 0v.75c0 2.123.8 4.057 2.118 5.52a.75.75 0 01-.297 1.206c-1.544.57-3.16.99-4.831 1.243a3.75 3.75 0 11-7.48 0 24.585 24.585 0 01-4.831-1.244.75.75 0 01-.298-1.205A8.217 8.217 0 005.25 9.75V9zm4.502 8.9a2.25 2.25 0 104.496 0 25.057 25.057 0 01-4.496 0z" clipRule="evenodd" />
        </svg>
        <span className="hidden md:block">Уведомления</span>
        {notifCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-pulse shadow-sm border border-white/20">
            {notifCount}
          </span>
        )}
      </Link>

      <Link href="/messages" className="relative flex items-center gap-1.5 text-sm font-medium bg-emerald-600/30 hover:bg-emerald-600/60 p-2 sm:px-3 sm:py-1.5 rounded-full transition-colors whitespace-nowrap" onClick={() => {
        localStorage.setItem('lastShownMsg', '0');
      }}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 opacity-90">
          <path fillRule="evenodd" d="M4.804 21.644A6.707 6.707 0 006 21.75a6.721 6.721 0 003.583-1.029c.774.182 1.584.279 2.417.279 5.322 0 9.75-3.97 9.75-9 0-5.03-4.428-9-9.75-9s-9.75 3.97-9.75 9c0 2.409 1.025 4.587 2.674 6.192.232.226.277.428.254.543a3.73 3.73 0 01-.814 1.686.75.75 0 00.44 1.223zM8.25 10.875a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25zM10.875 12a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0zm4.875-1.125a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25z" clipRule="evenodd" />
        </svg>
        <span className="hidden md:block">Сообщения</span>
        {msgCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-pulse shadow-sm border border-white/20">
            {msgCount}
          </span>
        )}
      </Link>

      {toast && (
        <div className="fixed bottom-20 right-4 md:bottom-6 md:right-6 bg-white dark:bg-gray-800 border-l-4 border-emerald-500 shadow-2xl p-4 rounded-lg z-[200] animate-bounce-in flex items-center gap-3 min-w-[280px]">
          <div className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 p-2 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M5.25 9a6.75 6.75 0 0113.5 0v.75c0 2.123.8 4.057 2.118 5.52a.75.75 0 01-.297 1.206c-1.544.57-3.16.99-4.831 1.243a3.75 3.75 0 11-7.48 0 24.585 24.585 0 01-4.831-1.244.75.75 0 01-.298-1.205A8.217 8.217 0 005.25 9.75V9zm4.502 8.9a2.25 2.25 0 104.496 0 25.057 25.057 0 01-4.496 0z" clipRule="evenodd" /></svg>
          </div>
          <div className="flex-1">
            <p className="font-bold text-gray-800 dark:text-white text-sm">{toast}</p>
            <Link href={toast.includes('сообщений') ? '/messages' : '/notifications'} className="text-xs text-emerald-600 hover:underline mt-1 block">
              Посмотреть →
            </Link>
          </div>
          <button onClick={() => setToast(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      )}
    </>
  );
}