'use client';
import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';

export default function UserBadge({ userId, name }: { userId: number, name: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setIsOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block" ref={menuRef}>
      <button onClick={() => setIsOpen(!isOpen)} className="font-medium text-gray-700 hover:text-emerald-600 underline decoration-dotted transition cursor-pointer">
        {name}
      </button>
      {isOpen && (
        <div className="absolute top-full mt-2 left-0 w-48 bg-white border border-gray-200 rounded-lg shadow-xl z-[100] overflow-hidden">
          <Link href={`/profile/${userId}`} className="block px-4 py-2 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition" onClick={() => setIsOpen(false)}>Открыть профиль</Link>
          <Link href={`/messages/${userId}`} className="block px-4 py-2 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition border-t border-gray-100" onClick={() => setIsOpen(false)}>Написать в ЛС</Link>
        </div>
      )}
    </div>
  );
}