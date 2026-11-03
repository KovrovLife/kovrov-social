'use client';

import { useState } from 'react';
import { sendMessageAction } from '../../actions';

export default function MessageForm({ otherUserId }: { otherUserId: number }) {
  const [message, setMessage] = useState('');

  return (
    <form 
      action={sendMessageAction} 
      className="p-3 border-t bg-white flex gap-2" 
      onSubmit={() => setMessage('')}
    >
      <input type="hidden" name="receiver_id" value={otherUserId} />
      <input 
        name="body" 
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Написать сообщение..." 
        required 
        autoComplete="off"
        className="flex-1 border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" 
      />
      <button className="bg-emerald-600 text-white text-sm font-medium px-5 py-2 rounded-md hover:bg-emerald-700 transition">
        Отправить
      </button>
    </form>
  );
}