'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { sendMessageAction, markMessagesAsRead } from '../../actions';

export default function ChatView({ messages, otherUser, userId }: { messages: any[], otherUser: any, userId: number }) {
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="max-w-2xl mx-auto h-[75vh] flex flex-col bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-sm overflow-hidden">
      {/* Шапка чата */}
      <div className="p-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex items-center gap-3">
        <Link href="/messages" className="text-gray-500 hover:text-emerald-600">←</Link>
        {otherUser.avatar_url ? (
          <img src={otherUser.avatar_url} alt="ava" className="w-10 h-10 rounded-full object-cover" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">{otherUser.name[0]}</div>
        )}
        <div className="flex-1">
          <span className="font-bold text-gray-900 dark:text-white">{otherUser.name}</span>
          <p className="text-xs text-gray-500">online</p>
        </div>
      </div>

      {/* Окно сообщений */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900/50">
        {messages.length === 0 && <p className="text-center text-gray-400 text-sm mt-10">Начните диалог первым!</p>}
        {messages.map((m) => {
          const isMe = m.sender_id === userId;
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
      <form action={sendMessageAction} className="p-3 border-t dark:border-gray-700 bg-white dark:bg-gray-800 flex gap-2" onSubmit={() => setMessage('')}>
        <input type="hidden" name="receiver_id" value={otherUser.id} />
        <input 
          name="body" 
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Написать сообщение..." 
          required 
          autoComplete="off"
          className="flex-1 border dark:border-gray-600 rounded-full px-4 py-2 text-sm bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none" 
        />
        <button className="bg-emerald-600 text-white text-sm font-medium px-5 py-2 rounded-full hover:bg-emerald-700 transition">
          Отправить
        </button>
      </form>
    </div>
  );
}