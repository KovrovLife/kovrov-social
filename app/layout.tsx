import './globals.css';
import Link from 'next/link';
import { db } from '@/lib/db';
import { getUserId } from '@/lib/auth';
import { logoutAction } from './actions';
import { Inter } from 'next/font/google';
import type { Viewport } from 'next';
import NotificationCenter from './components/NotificationCenter';
import PwaRegister from './components/PwaRegister';
import ThemeToggle from './components/ThemeToggle';
import { ThemeProvider } from 'next-themes';

const inter = Inter({ subsets: ['latin', 'cyrillic'] });
export const metadata = { 
  title: 'КовровLife',
  description: 'Городская соцсеть города Ковров',
  manifest: '/manifest.webmanifest'
};
export const viewport: Viewport = { themeColor: '#10b981', width: 'device-width', initialScale: 1, maximumScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const userId = getUserId();
  const user = userId ? (db.prepare('SELECT id, name, avatar_url, is_admin FROM users WHERE id = ?').get(userId) as any) : undefined;

  return (
    <html lang="ru" suppressHydrationWarning>
      <body className={`${inter.className} bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex flex-col min-h-screen transition-colors duration-300 pb-16 md:pb-0`}>
        <ThemeProvider attribute="class" defaultTheme="light">
          <PwaRegister />
          <header className="bg-gradient-to-r from-emerald-500 to-teal-400 dark:from-emerald-800 dark:to-teal-900 text-white shadow-md sticky top-0 z-50 transition-colors duration-300">
            <div className="max-w-3xl mx-auto flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3">
              
              <Link href="/" className="flex items-center gap-2 group shrink-0">
                <div className="bg-white text-emerald-600 rounded-xl p-1 sm:p-1.5 shadow-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" /></svg>
                </div>
                <span className="text-lg sm:text-xl tracking-tight flex items-baseline">
                  <span className="font-light hidden sm:inline">Ковров</span>
                  <span className="font-extrabold">Life</span>
                </span>
              </Link>
              
              <div className="flex-1" />
              
              {user ? (
                <>
                  {user.is_admin === 1 && (
                    <Link href="/admin" className="hidden lg:block text-sm font-medium bg-emerald-700/50 hover:bg-emerald-700 px-3 py-1.5 rounded-full transition whitespace-nowrap">
                      Админка
                    </Link>
                  )}
                  
                  <Link href="/people" className="hidden sm:flex items-center gap-1.5 text-sm font-medium bg-emerald-600/30 hover:bg-emerald-600/60 px-3 py-1.5 rounded-full transition-colors whitespace-nowrap">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 opacity-90"><path d="M7 8a3 3 0 100-6 3 3 0 000 6zM14.5 9a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM1.615 16.428a1.224 1.224 0 01-.569-1.175 6.002 6.002 0 0111.908 0c.058.467-.172.92-.57 1.174A9.953 9.953 0 017 18a9.953 9.953 0 01-5.385-1.572zM14.5 16h-.106c.07-.297.088-.611.048-.933a7.47 7.47 0 00-1.588-3.755 4.502 4.502 0 015.874 2.636.818.818 0 01-.36.98A7.465 7.465 0 0114.5 16z" /></svg>
                    <span className="hidden md:block">Люди</span>
                  </Link>

                  <Link href="/reels" className="hidden sm:flex items-center gap-1.5 text-sm font-medium bg-emerald-600/30 hover:bg-emerald-600/60 px-3 py-1.5 rounded-full transition-colors whitespace-nowrap">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 opacity-90"><path d="M4.5 4.5a3 3 0 00-3 3v9a3 3 0 003 3h15a3 3 0 003-3v-9a3 3 0 00-3-3h-15zm4.125 3.375a.75.75 0 011.06 0l4.5 4.5a.75.75 0 010 1.06l-4.5 4.5a.75.75 0 01-1.06-1.06L12.44 12 8.625 8.185a.75.75 0 010-1.06z" /></svg>
                    <span className="hidden md:block">Рилсы</span>
                  </Link>

                  <Link href="/music" className="hidden sm:flex items-center gap-1.5 text-sm font-medium bg-emerald-600/30 hover:bg-emerald-600/60 px-3 py-1.5 rounded-full transition-colors whitespace-nowrap">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 opacity-90"><path fillRule="evenodd" d="M19.952 1.651a.75.75 0 01.298.599V16.303a3 3 0 01-2.176 2.884l-1.32.377a2.553 2.553 0 11-1.403-4.909l2.311-.66a1.5 1.5 0 001.088-1.442V6.994l-9 2.572v9.737a3 3 0 01-2.176 2.884l-1.32.377a2.553 2.553 0 11-1.402-4.909l2.31-.66a1.5 1.5 0 001.088-1.442V5.25a.75.75 0 01.544-.721l10.5-3a.75.75 0 01.658.122z" clipRule="evenodd" /></svg>
                    <span className="hidden md:block">Музыка</span>
                  </Link>

                  <NotificationCenter />
                  
                  <Link href="/new" className="flex items-center justify-center gap-1.5 text-sm bg-white text-emerald-600 p-2 sm:px-4 sm:py-1.5 rounded-full font-bold hover:bg-emerald-50 hover:shadow-md transition-all shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                      <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                    </svg>
                    <span className="hidden md:block">Объявление</span>
                  </Link>
                  
                  <ThemeToggle />

                  <Link href={`/profile/${user.id}`} className="flex items-center gap-2 hover:bg-emerald-600/50 p-1 rounded-full transition shrink-0">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt="Аватар" className="w-8 h-8 rounded-full object-cover border-2 border-white shadow-sm" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-white text-emerald-600 flex items-center justify-center font-bold text-sm shadow-sm">{user.name[0].toUpperCase()}</div>
                    )}
                    <span className="hidden md:block text-sm font-medium pr-2">{user.name}</span>
                  </Link>

                  <form action={logoutAction} className="hidden sm:block"><button className="text-sm text-emerald-100 hover:text-white ml-1 whitespace-nowrap">Выйти</button></form>
                </>
              ) : (
                <>
                  <Link href="/login" className="text-sm font-medium hover:text-emerald-100 transition whitespace-nowrap">Войти</Link>
                  <Link href="/register" className="text-sm bg-white text-emerald-600 px-3 py-1.5 sm:px-4 sm:py-1.5 rounded-full font-medium hover:bg-emerald-50 transition whitespace-nowrap">Регистрация</Link>
                  <ThemeToggle />
                </>
              )}
            </div>
          </header>
          
          <main className="flex-1 w-full max-w-3xl mx-auto px-3 sm:px-4 py-4 sm:py-6">{children}</main>
          
          <footer className="bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-6 mt-auto transition-colors duration-300">
            <div className="max-w-3xl mx-auto px-4 flex flex-col items-center gap-3">
              <div className="text-sm text-gray-500 dark:text-gray-400 flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
                <span className="font-semibold text-gray-800 dark:text-gray-200">Ковров<span className="text-emerald-600 dark:text-emerald-400">Life</span></span>
                <span className="hidden sm:block text-gray-400 dark:text-gray-600">•</span>
                <span>© 2026. Все права защищены.</span>
              </div>
              <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs text-gray-500 dark:text-gray-400 font-medium">
                <Link href="/legal/rules" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition">Правила</Link>
                <Link href="/legal/privacy" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition">Конфиденциальность</Link>
                <Link href="/legal/terms" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition">Соглашение</Link>
              </div>
            </div>
          </footer>

          {/* Мобильная навигация */}
          {user && (
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t dark:border-gray-700 z-50 flex justify-around items-center py-2 pb-safe">
              <Link href="/" className="flex flex-col items-center text-gray-500 dark:text-gray-400 hover:text-emerald-500 transition">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.06l-8.689-8.69a2.25 2.25 0 00-3.182 0l-8.69 8.69a.75.75 0 001.061 1.06l8.69-8.69z" /><path d="M12 5.432l8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75V21a.75.75 0 01-.75.75H5.625a1.875 1.875 0 01-1.875-1.875v-6.198a2.29 2.29 0 00.091-.086L12 5.43z" /></svg>
                <span className="text-[10px] mt-1 font-medium">Главная</span>
              </Link>

              <Link href="/reels" className="flex flex-col items-center text-gray-500 dark:text-gray-400 hover:text-emerald-500 transition">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M4.5 4.5a3 3 0 00-3 3v9a3 3 0 003 3h15a3 3 0 003-3v-9a3 3 0 00-3-3h-15zm4.125 3.375a.75.75 0 011.06 0l4.5 4.5a.75.75 0 010 1.06l-4.5 4.5a.75.75 0 01-1.06-1.06L12.44 12 8.625 8.185a.75.75 0 010-1.06z" /></svg>
                <span className="text-[10px] mt-1 font-medium">Рилсы</span>
              </Link>

              <Link href="/new" className="flex flex-col items-center text-emerald-600 dark:text-emerald-400 -mt-4 bg-white dark:bg-gray-800 p-1 rounded-full shadow-md border dark:border-gray-700">
                <div className="bg-emerald-600 text-white rounded-full p-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                </div>
              </Link>

              <Link href="/music" className="flex flex-col items-center text-gray-500 dark:text-gray-400 hover:text-emerald-500 transition">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path fillRule="evenodd" d="M19.952 1.651a.75.75 0 01.298.599V16.303a3 3 0 01-2.176 2.884l-1.32.377a2.553 2.553 0 11-1.403-4.909l2.311-.66a1.5 1.5 0 001.088-1.442V6.994l-9 2.572v9.737a3 3 0 01-2.176 2.884l-1.32.377a2.553 2.553 0 11-1.402-4.909l2.31-.66a1.5 1.5 0 001.088-1.442V5.25a.75.75 0 01.544-.721l10.5-3a.75.75 0 01.658.122z" clipRule="evenodd" /></svg>
                <span className="text-[10px] mt-1 font-medium">Музыка</span>
              </Link>

              <Link href={`/profile/${user.id}`} className="flex flex-col items-center text-gray-500 dark:text-gray-400 hover:text-emerald-500 transition">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt="Аватар" className="w-6 h-6 rounded-full object-cover" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-bold">{user.name[0].toUpperCase()}</div>
                )}
                <span className="text-[10px] mt-1 font-medium">Профиль</span>
              </Link>
            </div>
          )}
        </ThemeProvider>
      </body>
    </html>
  );
}