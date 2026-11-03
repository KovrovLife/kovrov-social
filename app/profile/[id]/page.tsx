import { db } from '@/lib/db';
import { getUserId } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { sendFriendRequest, acceptFriendRequest, reportUserAction, updateAvatarAction, toggleAdminAction, logoutAction, updateProfileAction, updateCoverAction, createWallPostAction, toggleWallLikeAction, toggleWallDislikeAction, deleteWallPostAction } from '../../actions';
import Link from 'next/link';
import WallCommentForm from '@/app/components/WallCommentForm';
import { formatOnlineStatus } from '@/lib/status';
import UploadPhotoButton from './UploadPhotoButton';
import PhotoGallery from './PhotoGallery';

export const dynamic = 'force-dynamic';

export default function ProfilePage({ params, searchParams }: { params: { id: string }; searchParams: { reported?: string, tab?: string, edit?: string } }) {
  const myId = getUserId();
  if (!myId) redirect('/login');
  const targetId = Number(params.id);
  if (isNaN(targetId)) notFound();
  
  const profileUser = db.prepare('SELECT u.*, d.name AS district_name FROM users u JOIN districts d ON u.district_id = d.id WHERE u.id = ?').get(targetId) as any;
  if (!profileUser) notFound();
  
  const status = formatOnlineStatus(profileUser.last_seen);

  const districts = db.prepare('SELECT * FROM districts').all() as any[];
  const me = db.prepare('SELECT name, is_admin FROM users WHERE id = ?').get(myId) as any;
  const isSuperAdmin = me.name === 'KovrovLife';
  const isMe = myId === targetId;

  const postCount = db.prepare('SELECT COUNT(*) as c FROM posts WHERE user_id = ?').get(targetId) as any;
  const friendsCount = db.prepare(`SELECT COUNT(*) as c FROM friends WHERE (user_id = ? OR friend_id = ?) AND status = 'accepted'`).get(targetId, targetId) as any;
  
  const recentPosts = db.prepare("SELECT id, title, body, photo_url, created_at FROM posts WHERE user_id = ? AND status = 'active' ORDER BY created_at DESC LIMIT 4").all(targetId) as any[];
  
  const wallPosts = db.prepare(`
    SELECT wall_posts.*, users.name AS author_name, users.avatar_url AS author_avatar,
    (SELECT COUNT(*) FROM wall_likes WHERE wall_post_id = wall_posts.id AND type = 'like') as likes_count,
    (SELECT COUNT(*) FROM wall_likes WHERE wall_post_id = wall_posts.id AND type = 'dislike') as dislikes_count
    FROM wall_posts 
    JOIN users ON users.id = wall_posts.author_id 
    WHERE wall_posts.owner_id = ? 
    ORDER BY wall_posts.created_at DESC
  `).all(targetId) as any[];

  const allWallComments = db.prepare(`
    SELECT wall_comments.*, users.name AS author_name, users.avatar_url AS author_avatar
    FROM wall_comments 
    JOIN users ON users.id = wall_comments.user_id 
    WHERE wall_comments.wall_post_id IN (SELECT id FROM wall_posts WHERE owner_id = ?)
    ORDER BY wall_comments.created_at ASC
  `).all(targetId) as any[];

  const friendship = db.prepare('SELECT * FROM friends WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)').get(myId, targetId, targetId, myId) as any;
  const isFriend = friendship?.status === 'accepted';
  const isPendingSent = friendship?.status === 'pending' && friendship.user_id === myId;
  const isPendingReceived = friendship?.status === 'pending' && friendship.friend_id === myId;
  
  const friends = db.prepare(`SELECT u.id, u.name, u.avatar_url FROM friends f JOIN users u ON u.id = CASE WHEN f.user_id = ? THEN f.friend_id ELSE f.user_id END WHERE (f.user_id = ? OR f.friend_id = ?) AND f.status = 'accepted' LIMIT 6`).all(targetId, targetId, targetId) as any[];
  const galleryPhotos = db.prepare("SELECT * FROM gallery_photos WHERE user_id = ? ORDER BY created_at DESC").all(targetId) as any[];

  const isEditing = isMe && searchParams.edit === 'true';

  const formatBirthday = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) return `${parts[2]}.${parts[1]}.${parts[0]}`;
    return dateStr;
  };

  const coverStyle = profileUser.cover_url 
    ? (profileUser.cover_url.startsWith('/uploads') ? { backgroundImage: `url(${profileUser.cover_url})`, backgroundSize: 'cover', backgroundPosition: 'center' } : { backgroundColor: profileUser.cover_url })
    : { backgroundImage: 'linear-gradient(to right, #34d399, #14b8a6)' };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      {/* Шапка профиля */}
      <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-sm overflow-hidden">
        
        <div className="h-32 sm:h-48 relative" style={coverStyle}>
           {isMe && (
             <Link href={`/profile/${targetId}?edit=true`} className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white text-xs px-3 py-1.5 rounded-md backdrop-blur-sm transition flex items-center gap-1">
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>
               Изменить обложку
             </Link>
           )}
        </div>
        
        <div className="px-6 pb-6 relative">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 -mt-12 sm:-mt-16 mb-4">
            <div className="relative">
              {profileUser.avatar_url ? (
                <img src={profileUser.avatar_url} alt="Аватар" className="w-28 h-28 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-white dark:border-gray-800 shadow-md bg-white" />
              ) : (
                <div className="w-28 h-28 sm:w-32 sm:h-32 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-bold text-5xl shadow-md border-4 border-white dark:border-gray-800">{profileUser.name[0].toUpperCase()}</div>
              )}
              {status.isOnline && (
                <div className="absolute bottom-1 right-1 w-6 h-6 bg-green-500 border-4 border-white dark:border-gray-800 rounded-full"></div>
              )}
            </div>

            <div className="flex-1 text-center sm:text-left sm:pb-2">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{profileUser.name}</h1>
                {profileUser.is_admin === 1 && <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-0.5 rounded-full">Админ</span>}
              </div>
              
              <p className={`text-sm mt-1 font-medium ${status.isOnline ? 'text-emerald-600' : 'text-gray-500'}`}>
                {status.text}
              </p>
              
              {profileUser.status_text && (
                <p className="text-sm text-emerald-600 mt-1 italic font-medium">"{profileUser.status_text}"</p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto mt-2 sm:mt-0 sm:pb-2">
              {isMe ? (
                <>
                  <Link href={`/profile/${targetId}?edit=true`} className="w-full sm:w-auto text-center text-sm border border-emerald-200 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-4 py-2 rounded-md transition font-medium">Редактировать</Link>
                  <form action={logoutAction}>
                    <button className="w-full text-sm border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-md transition font-medium">Выйти</button>
                  </form>
                </>
              ) : (
                <>
                  <Link href={`/messages/${targetId}`} className="w-full sm:w-auto bg-emerald-600 text-white text-sm font-medium px-6 py-2 rounded-md hover:bg-emerald-700 text-center transition">Написать в ЛС</Link>
                  {isFriend ? <button disabled className="w-full sm:w-auto bg-gray-100 text-gray-500 text-sm px-6 py-2 rounded-md border">В друзьях</button>
                  : isPendingSent ? <button disabled className="w-full sm:w-auto bg-gray-100 text-gray-500 text-sm px-6 py-2 rounded-md border">Заявка отправлена</button>
                  : isPendingReceived ? (
                    <form action={acceptFriendRequest}><input type="hidden" name="request_id" value={friendship.id} /><button className="w-full bg-blue-600 text-white text-sm px-6 py-2 rounded-md hover:bg-blue-700 transition">Принять заявку</button></form>
                  ) : (
                    <form action={sendFriendRequest}><input type="hidden" name="target_id" value={targetId} /><button className="w-full bg-gray-900 text-white text-sm px-6 py-2 rounded-md hover:bg-gray-800 transition">Добавить в друзья</button></form>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-4">
            <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-900 border dark:border-gray-700 px-3 py-1 rounded-full text-sm text-gray-700 dark:text-gray-300">
              <span className="text-emerald-500">📍</span> {profileUser.district_name}
            </div>
            {profileUser.birthday && (
              <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-900 border dark:border-gray-700 px-3 py-1 rounded-full text-sm text-gray-700 dark:text-gray-300">
                <span className="text-emerald-500">🎂</span> {formatBirthday(profileUser.birthday)}
              </div>
            )}
            {profileUser.work && (
              <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-900 border dark:border-gray-700 px-3 py-1 rounded-full text-sm text-gray-700 dark:text-gray-300">
                <span className="text-emerald-500">💼</span> {profileUser.work}
              </div>
            )}
          </div>

          {isEditing && (
            <div className="mb-6 mt-6 p-4 bg-gray-50 dark:bg-gray-900/50 border dark:border-gray-700 rounded-lg space-y-6">
              <div>
                <h3 className="text-sm font-bold mb-3 text-gray-800 dark:text-white">Настройка обложки</h3>
                <form action={updateCoverAction} className="flex flex-col sm:flex-row items-center gap-3">
                  <select name="color" defaultValue={profileUser.cover_url?.startsWith('#') ? profileUser.cover_url : '#34d399'} className="w-full sm:w-auto border dark:border-gray-600 rounded-md px-3 py-1.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                    <option value="#34d399">Мятный (по умолчанию)</option>
                    <option value="#3b82f6">Синий</option>
                    <option value="#ef4444">Красный</option>
                    <option value="#8b5cf6">Фиолетовый</option>
                    <option value="#f59e0b">Оранжевый</option>
                    <option value="#1f2937">Темный</option>
                  </select>
                  <span className="text-xs text-gray-500 hidden sm:block">или</span>
                  <input type="file" name="cover_image" accept="image/*" className="text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-white file:text-emerald-700 hover:file:bg-gray-50 flex-1" />
                  <button className="text-sm bg-gray-900 text-white px-4 py-1.5 rounded-md hover:bg-gray-800 w-full sm:w-auto">Применить</button>
                </form>
              </div>
              <hr className="border-gray-200 dark:border-gray-700" />
              <div>
                <h3 className="text-sm font-bold mb-3 text-gray-800 dark:text-white">Основная информация</h3>
                <form action={updateProfileAction} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div><label className="block text-xs text-gray-500 mb-1">Статус (О себе)</label><input name="status_text" defaultValue={profileUser.status_text || ''} placeholder="Чем занимаетесь?" className="w-full border dark:border-gray-600 rounded-md px-3 py-1.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white" /></div>
                    <div><label className="block text-xs text-gray-500 mb-1">День рождения</label><input type="date" name="birthday" defaultValue={profileUser.birthday || ''} className="w-full border dark:border-gray-600 rounded-md px-3 py-1.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white" /></div>
                    <div><label className="block text-xs text-gray-500 mb-1">Место работы / учебы</label><input name="work" defaultValue={profileUser.work || ''} placeholder="Где работаете?" className="w-full border dark:border-gray-600 rounded-md px-3 py-1.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white" /></div>
                    <div><label className="block text-xs text-gray-500 mb-1">Район города</label><select name="district_id" defaultValue={profileUser.district_id} className="w-full border dark:border-gray-600 rounded-md px-3 py-1.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white">{districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
                  </div>
                  <div className="flex gap-2 justify-end pt-2">
                    <Link href={`/profile/${targetId}`} className="text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-1.5 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition">Отмена</Link>
                    <button className="text-sm bg-emerald-600 text-white px-4 py-1.5 rounded-md hover:bg-emerald-700 transition">Сохранить</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <div className="flex justify-center sm:justify-start gap-6 pt-4 mt-4 border-t border-gray-100 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400">
            <div className="text-center sm:text-left"><span className="block font-bold text-gray-900 dark:text-white text-lg">{postCount.c}</span><span className="text-xs">Публикаций</span></div>
            <div className="text-center sm:text-left"><span className="block font-bold text-gray-900 dark:text-white text-lg">{friendsCount.c}</span><span className="text-xs">Друзей</span></div>
            <div className="text-center sm:text-left"><span className="block font-bold text-gray-900 dark:text-white text-lg">{galleryPhotos.length}</span><span className="text-xs">Фотографий</span></div>
          </div>
          
          {isMe && (
            <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-900/50 border dark:border-gray-700 rounded-lg flex flex-col sm:flex-row items-center gap-3">
              <span className="text-sm text-gray-600 dark:text-gray-400 font-medium flex-1 text-center sm:text-left">Обновить аватарку:</span>
              <form action={updateAvatarAction} className="flex items-center gap-2 w-full sm:w-auto">
                <input type="file" name="avatar" accept="image/*" required className="text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-white file:text-emerald-700 hover:file:bg-gray-50 flex-1" />
                <button className="text-xs bg-gray-900 text-white px-3 py-1.5 rounded-md hover:bg-gray-800">Загрузить</button>
              </form>
            </div>
          )}

          {isSuperAdmin && !isMe && profileUser.name !== 'KovrovLife' && (
            <div className="mt-4">
              <form action={toggleAdminAction}>
                <input type="hidden" name="target_id" value={targetId} />
                <button className={`w-full text-sm font-medium px-6 py-2 rounded-md border transition ${profileUser.is_admin === 1 ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100' : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'}`}>
                  {profileUser.is_admin === 1 ? 'Снять права администратора' : 'Выдать права администратора'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* БЛОКИ СВЕРХУ: Друзья и Галерея */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Друзья */}
        <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-4 shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-sm text-gray-900 dark:text-white">Друзья <span className="text-gray-400 font-normal">{friendsCount.c}</span></h3>
            <Link href="/people" className="text-xs text-emerald-600 hover:underline">Все</Link>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {friends.map((f) => (
              <Link key={f.id} href={`/profile/${f.id}`} className="flex flex-col items-center gap-1 group">
                {f.avatar_url ? <img src={f.avatar_url} alt="ava" className="w-12 h-12 rounded-full object-cover" /> : <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center font-bold text-emerald-700">{f.name[0]}</div>}
                <span className="text-[10px] text-gray-600 dark:text-gray-400 text-center truncate w-full group-hover:text-emerald-600">{f.name}</span>
              </Link>
            ))}
            {friends.length === 0 && <p className="text-xs text-gray-500 col-span-4">Нет друзей</p>}
          </div>
        </div>

        {/* Галерея фотографий */}
        <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
            <h3 className="font-bold text-sm text-gray-900 dark:text-white">
              Фотографии <span className="text-gray-400 font-normal">{galleryPhotos.length}</span>
            </h3>
            {isMe && <UploadPhotoButton />}
          </div>

          <div className="p-2 flex-1">
            {galleryPhotos.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-gray-500 text-sm">Здесь пока нет фотографий.</p>
              </div>
            ) : (
              <PhotoGallery photos={galleryPhotos} isMe={isMe} />
            )}
          </div>
        </div>
      </div>

      {/* ОСНОВНАЯ ЛЕНТА (Стена и Объявления) */}
      <div className="space-y-6">
        
        {/* Стена */}
        <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Стена</h2>
          <form action={createWallPostAction} className="mb-6 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border dark:border-gray-700" key={Date.now()}>
            <input type="hidden" name="owner_id" value={targetId} />
            <textarea name="body" placeholder={isMe ? "Что у вас нового?" : `Написать что-нибудь для ${profileUser.name}...`} required rows={2} className="w-full border dark:border-gray-600 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white mb-2"></textarea>
            <div className="flex justify-end"><button className="bg-emerald-600 text-white text-sm font-medium px-6 py-1.5 rounded-md hover:bg-emerald-700 transition">Отправить</button></div>
          </form>
          <div className="space-y-6">
            {wallPosts.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">Здесь пока пусто.</p>}
            
            {wallPosts.map((wp) => {
              const myVote = db.prepare('SELECT type FROM wall_likes WHERE wall_post_id = ? AND user_id = ?').get(wp.id, myId) as any;
              const postComments = allWallComments.filter((c: any) => c.wall_post_id === wp.id);
              
              return (
                <div key={wp.id} className="border-b border-gray-100 dark:border-gray-700 pb-4 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {wp.author_avatar ? <img src={wp.author_avatar} alt="ava" className="w-6 h-6 rounded-full object-cover" /> : <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">{wp.author_name[0]}</div>}
                      <Link href={`/profile/${wp.author_id}`} className="font-semibold text-sm text-gray-800 dark:text-gray-200 hover:text-emerald-600">{wp.author_name}</Link>
                      <span className="text-xs text-gray-400">• {wp.created_at}</span>
                    </div>
                    
                    {(wp.author_id === myId || isMe) && (
                      <form action={deleteWallPostAction}>
                        <input type="hidden" name="wall_post_id" value={wp.id} />
                        <input type="hidden" name="owner_id" value={targetId} />
                        <button className="text-gray-400 hover:text-red-500 transition" title="Удалить запись">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                        </button>
                      </form>
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap pl-8 mb-3">{wp.body}</p>
                  
                  <div className="flex gap-4 pl-8 mb-3">
                    <form action={toggleWallLikeAction}>
                      <input type="hidden" name="wall_post_id" value={wp.id} />
                      <button className={`flex items-center gap-1 text-xs transition ${myVote?.type === 'like' ? 'text-emerald-600 font-bold' : 'text-gray-500 hover:text-emerald-600'}`}>
                        👍 {wp.likes_count}
                      </button>
                    </form>
                    <form action={toggleWallDislikeAction}>
                      <input type="hidden" name="wall_post_id" value={wp.id} />
                      <button className={`flex items-center gap-1 text-xs transition ${myVote?.type === 'dislike' ? 'text-red-600 font-bold' : 'text-gray-500 hover:text-red-600'}`}>
                        👎 {wp.dislikes_count}
                      </button>
                    </form>
                  </div>

                  <div className="pl-8 space-y-2 mb-2">
                    {postComments.length > 0 && (
                      <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 space-y-3 border dark:border-gray-700">
                        {postComments.map((c: any) => (
                          <div key={c.id} className="text-sm">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              {c.author_avatar ? <img src={c.author_avatar} alt="ava" className="w-4 h-4 rounded-full object-cover" /> : <div className="w-4 h-4 rounded-full bg-emerald-200 text-emerald-800 flex items-center justify-center text-[10px] font-bold">{c.author_name[0]}</div>}
                              <Link href={`/profile/${c.user_id}`} className="font-semibold text-gray-800 dark:text-gray-200 hover:text-emerald-600">{c.author_name}</Link>
                              <span className="text-[10px] text-gray-400">• {c.created_at}</span>
                            </div>
                            <p className="text-gray-700 dark:text-gray-300 pl-5">{c.body}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {myId && <WallCommentForm wallPostId={wp.id} ownerId={targetId} />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Объявления */}
        <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Объявления</h2>
          {recentPosts.length === 0 ? (
            <p className="text-sm text-gray-500">Пользователь пока не публиковал объявлений.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {recentPosts.map((p) => (
                <Link href={`/post/${p.id}`} key={p.id} className="border dark:border-gray-700 rounded-lg p-3 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-sm transition flex gap-3 bg-gray-50 dark:bg-gray-900/50">
                  {p.photo_url ? (
                     <img src={p.photo_url} alt="" className="w-16 h-16 rounded object-cover shrink-0" />
                  ) : (
                     <div className="w-16 h-16 rounded bg-emerald-100 flex items-center justify-center shrink-0"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-emerald-600"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12l-3-3m0 0l-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg></div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm text-gray-900 dark:text-white line-clamp-2">{p.title}</h3>
                    <p className="text-xs text-gray-500 mt-1">{p.created_at.split(' ')[0]}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}