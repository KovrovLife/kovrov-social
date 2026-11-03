'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { sendMessageAction } from '../actions';
import { formatOnlineStatus } from '@/lib/status';

export default function MessengerLayout({ chats, currentUserId }: { chats: any[], currentUserId: number }) {
  const [activeChatId, setActiveChatId] = useState<number | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [messageText, setMessageText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // При выборе чата загружаем сообщения
  useEffect(() => {
    if (activeChatId) {
      fetch(`/api/messages?chatId=${activeChatId}`)
        .then(res => res.json())
        .then(data => {
          setMessages(data);
          setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        })
        .catch(console.error);
    }
  }, [activeChatId]);

  const activeChat = chats.find(c => c.id === activeChatId);

  return (
    <div className="max-w-5xl mx-auto h-[80vh] flex bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-sm overflow-hidden">
      
      {/* ЛЕВАЯ ПАНЕЛЬ: СПИСОК ЧАТОВ */}
      <div className={`w-full md:w-1/3 border-r dark:border-gray-700 flex flex-col ${activeChatId ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <h2 className="font-bold text-lg text-gray-900 dark:text-white">Мессенджер</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {chats.length === 0 && <p className="p-4 text-center text-gray-500 text-sm">Нет диалогов</p>}
          {chats.map(chat => {
            const status = formatOnlineStatus(chat.last_seen);
            return (
              <button 
                key={chat.id} 
                onClick={() => setActiveChatId(chat.id)}
                className={`w-full text-left flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition ${activeChatId === chat.id ? 'bg-emerald-50 dark:bg-emerald-900/20' : ''}`}
              >
                <div className="relative">
                  {chat.avatar_url ? (
                    <img src={chat.avatar_url} alt="ava" className="w-10 h-10 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shrink-0">{chat.name[0]}</div>
                  )}
                  {status.isOnline && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="font-semibold text-gray-900 dark:text-white truncate">{chat.name}</span>
                    {chat.last_time && <span className="text-[10px] text-gray-400">{chat.last_time.split(' ')[1].slice(0,5)}</span>}
                  </div>
                  <p className={`text-xs truncate ${status.isOnline ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500 dark:text-gray-400'}`}>
                    {chat.last_message || status.text}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ПРАВАЯ ПАНЕЛЬ: САМ ЧАТ */}
      <div className={`flex-1 flex flex-col ${!activeChatId ? 'hidden md:flex' : 'flex'}`}>
        {activeChat ? (
          <>
            {/* Шапка чата */}
            <div className="p-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex items-center gap-3">
              <button onClick={() => setActiveChatId(null)} className="md:hidden text-gray-500 hover:text-emerald-600">←</button>
              <div className="relative">
                {activeChat.avatar_url ? (
                  <img src={activeChat.avatar_url} alt="ava" className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">{activeChat.name[0]}</div>
                )}
                {formatOnlineStatus(activeChat.last_seen).isOnline && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full"></div>
                )}
              </div>
              <div>
                <span className="font-bold text-gray-900 dark:text-white">{activeChat.name}</span>
                <p className={`text-xs ${formatOnlineStatus(activeChat.last_seen).isOnline ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500'}`}>
                  {formatOnlineStatus(activeChat.last_seen).text}
                </p>
              </div>
            </div>

            {/* Сообщения */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900/50">
              {messages.length === 0 && <p className="text-center text-gray-400 text-sm mt-10">Начните диалог первым!</p>}
              {messages.map((m) => {
                const isMe = m.sender_id === currentUserId;
                return (
                  <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${isMe ? 'bg-emerald-600 text-white rounded-br-sm' : 'bg-white dark:bg-gray-800 border dark:border-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-sm'}`}>
                      <p className="whitespace-pre-wrap break-words">{m.body}</p>
                      <span className={`text-[10px] block mt-1 ${isMe ? 'text-emerald-200 text-right' : 'text-gray-400'}`}>
                        {m.created_at.split(' ')[1].slice(0,5)}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Поле ввода */}
            <form 
              onSubmit={async (e) => {
                e.preventDefault();
                if (!messageText.trim()) return;
                
                const formData = new FormData();
                formData.append('receiver_id', activeChat.id.toString());
                formData.append('body', messageText);
                
                await sendMessageAction(formData);
                setMessageText('');
                
                fetch(`/api/messages?chatId=${activeChatId}`)
                  .then(res => res.json())
                  .then(data => {
                    setMessages(data);
                    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
                  });
              }} 
              className="p-3 border-t dark:border-gray-700 bg-white dark:bg-gray-800 flex gap-2"
            >
              <input type="hidden" name="receiver_id" value={activeChat.id} />
              <input 
                name="body" 
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Написать сообщение..." 
                required 
                autoComplete="off"
                className="flex-1 border dark:border-gray-600 rounded-full px-4 py-2 text-sm bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none" 
              />
              <button type="submit" className="bg-emerald-600 text-white text-sm font-medium px-5 py-2 rounded-full hover:bg-emerald-700 transition">
                Отправить
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400 flex-col gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 opacity-20"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" /></svg>
            <p>Выберите чат, чтобы начать общение</p>
          </div>
        )}
      </div>
    </div>
  );
}