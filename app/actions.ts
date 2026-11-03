'use server';
import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { setSession, clearSession, getUserId } from '@/lib/auth';
import fs from 'fs';
import path from 'path';
import { revalidatePath } from 'next/cache';

export async function registerAction(formData: FormData) {
  const name = String(formData.get('name') || '').trim();
  const password = String(formData.get('password') || '');
  const districtId = Number(formData.get('district_id') || 0);
  if (name.length < 2 || password.length < 6 || !districtId) redirect('/register?error=' + encodeURIComponent('Проверьте поля'));
  const exists = db.prepare('SELECT id FROM users WHERE name = ?').get(name);
  if (exists) redirect('/register?error=' + encodeURIComponent('Имя занято'));
  const hash = bcrypt.hashSync(password, 10);
  const isAdmin = name === 'KovrovLife' ? 1 : 0;
  const info = db.prepare('INSERT INTO users (name, password_hash, district_id, is_admin) VALUES (?, ?, ?, ?)').run(name, hash, districtId, isAdmin);
  setSession(Number(info.lastInsertRowid));
  redirect('/');
}

export async function loginAction(formData: FormData) {
  const name = String(formData.get('name') || '').trim();
  const password = String(formData.get('password') || '');
  const user = db.prepare('SELECT * FROM users WHERE name = ?').get(name) as any;
  if (!user || !bcrypt.compareSync(password, user.password_hash)) redirect('/login?error=' + encodeURIComponent('Неверные данные'));
  setSession(user.id);
  redirect('/');
}

export async function logoutAction() { clearSession(); redirect('/'); }

export async function updateProfileAction(formData: FormData) {
  const userId = getUserId();
  if (!userId) redirect('/login');
  const birthday = String(formData.get('birthday') || '').trim();
  const work = String(formData.get('work') || '').trim();
  const statusText = String(formData.get('status_text') || '').trim();
  const districtId = Number(formData.get('district_id') || 0);
  if (districtId) db.prepare('UPDATE users SET birthday = ?, work = ?, status_text = ?, district_id = ? WHERE id = ?').run(birthday, work, statusText, districtId, userId);
  redirect('/profile/' + userId);
}

export async function updateCoverAction(formData: FormData) {
  const userId = getUserId();
  if (!userId) redirect('/login');
  const color = formData.get('color') as string;
  const photo = formData.get('cover_image') as File | null;
  let coverUrl = color;

  if (photo && photo.size > 0) {
    const buffer = Buffer.from(await photo.arrayBuffer());
    const filename = `cover-${userId}-${Date.now()}-${photo.name.replace(/\s+/g, '_')}`;
    const uploadDir = path.join(process.cwd(), 'public/uploads');
    await fs.promises.mkdir(uploadDir, { recursive: true });
    await fs.promises.writeFile(path.join(uploadDir, filename), buffer);
    coverUrl = `/uploads/${filename}`;
  }

  db.prepare('UPDATE users SET cover_url = ? WHERE id = ?').run(coverUrl, userId);
  redirect('/profile/' + userId);
}

export async function updateAvatarAction(formData: FormData) {
  const userId = getUserId();
  if (!userId) redirect('/login');
  const photo = formData.get('avatar') as File | null;
  if (photo && photo.size > 0) {
    const buffer = Buffer.from(await photo.arrayBuffer());
    const filename = `avatar-${userId}-${Date.now()}-${photo.name.replace(/\s+/g, '_')}`;
    const uploadDir = path.join(process.cwd(), 'public/uploads');
    await fs.promises.mkdir(uploadDir, { recursive: true });
    await fs.promises.writeFile(path.join(uploadDir, filename), buffer);
    db.prepare('UPDATE users SET avatar_url = ? WHERE id = ?').run(`/uploads/${filename}`, userId);
  }
  redirect('/profile/' + userId);
}

export async function uploadGalleryPhotoAction(formData: FormData) {
  const userId = getUserId();
  if (!userId) redirect('/login');
  const photo = formData.get('photo') as File | null;
  if (photo && photo.size > 0) {
    const buffer = Buffer.from(await photo.arrayBuffer());
    const filename = `gallery-${userId}-${Date.now()}-${photo.name.replace(/\s+/g, '_')}`;
    const uploadDir = path.join(process.cwd(), 'public/uploads');
    await fs.promises.mkdir(uploadDir, { recursive: true });
    await fs.promises.writeFile(path.join(uploadDir, filename), buffer);
    db.prepare('INSERT INTO gallery_photos (user_id, photo_url) VALUES (?, ?)').run(userId, `/uploads/${filename}`);
  }
  redirect('/profile/' + userId + '?tab=photos');
}

export async function createPostAction(
  title: string, 
  body: string, 
  categoryId: number, 
  districtId: number, 
  photoUrls: string[]
) {
  const userId = getUserId();
  if (!userId) redirect('/login');

  if (!title || !body || !categoryId || !districtId) {
    throw new Error('Заполните обязательные поля');
  }

  const info = db.prepare('INSERT INTO posts (user_id, category_id, district_id, title, body) VALUES (?, ?, ?, ?, ?)').run(userId, categoryId, districtId, title, body);
  const postId = Number(info.lastInsertRowid);

  if (photoUrls && photoUrls.length > 0) {
    let isFirst = true;
    for (const url of photoUrls) {
      db.prepare('INSERT INTO post_photos (post_id, photo_url) VALUES (?, ?)').run(postId, url);
      if (isFirst) {
        db.prepare('UPDATE posts SET photo_url = ? WHERE id = ?').run(url, postId);
        isFirst = false;
      }
    }
  }

  redirect('/post/' + postId);
}

export async function updatePostAction(formData: FormData) {
  const userId = getUserId();
  if (!userId) redirect('/login');
  const postId = Number(formData.get('post_id'));
  const title = String(formData.get('title') || '').trim();
  const body = String(formData.get('body') || '').trim();
  const photo = formData.get('photo') as File | null;

  const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(postId) as any;
  if (!post || post.user_id !== userId) redirect('/');

  let photoUrl = post.photo_url;

  if (photo && photo.size > 0) {
    const buffer = Buffer.from(await photo.arrayBuffer());
    const filename = `${Date.now()}-${photo.name.replace(/\s+/g, '_')}`;
    const uploadDir = path.join(process.cwd(), 'public/uploads');
    await fs.promises.mkdir(uploadDir, { recursive: true });
    await fs.promises.writeFile(path.join(uploadDir, filename), buffer);
    photoUrl = `/uploads/${filename}`;
    
    db.prepare('DELETE FROM post_photos WHERE post_id = ?').run(postId);
    db.prepare('INSERT INTO post_photos (post_id, photo_url) VALUES (?, ?)').run(postId, photoUrl);
  }

  db.prepare("UPDATE posts SET title = ?, body = ?, photo_url = ?, updated_at = datetime('now') WHERE id = ?").run(title, body, photoUrl, postId);
  redirect('/post/' + postId);
}

export async function toggleLikeAction(formData: FormData) {
  const userId = getUserId();
  if (!userId) redirect('/login');
  const postId = Number(formData.get('post_id'));
  const existing = db.prepare('SELECT * FROM likes WHERE user_id = ? AND post_id = ?').get(userId, postId) as any;
  
  if (existing) {
    if (existing.type === 'like') db.prepare('DELETE FROM likes WHERE id = ?').run(existing.id);
    else db.prepare("UPDATE likes SET type = 'like' WHERE id = ?").run(existing.id);
  } else {
    db.prepare("INSERT INTO likes (user_id, post_id, type) VALUES (?, ?, 'like')").run(userId, postId);
    const post = db.prepare('SELECT user_id FROM posts WHERE id = ?').get(postId) as any;
    if (post && post.user_id !== userId) {
      db.prepare("INSERT INTO notifications (user_id, sender_id, type, target_id) VALUES (?, ?, 'like_post', ?)").run(post.user_id, userId, postId);
    }
  }
  revalidatePath('/');
}

export async function toggleDislikeAction(formData: FormData) {
  const userId = getUserId();
  if (!userId) redirect('/login');
  const postId = Number(formData.get('post_id'));
  const existing = db.prepare('SELECT * FROM likes WHERE user_id = ? AND post_id = ?').get(userId, postId) as any;
  if (existing) {
    if (existing.type === 'dislike') db.prepare('DELETE FROM likes WHERE id = ?').run(existing.id);
    else db.prepare("UPDATE likes SET type = 'dislike' WHERE id = ?").run(existing.id);
  } else {
    db.prepare("INSERT INTO likes (user_id, post_id, type) VALUES (?, ?, 'dislike')").run(userId, postId);
  }
  revalidatePath('/');
}

export async function togglePhotoLikeAction(formData: FormData) {
  const userId = getUserId();
  if (!userId) redirect('/login');
  const photoId = Number(formData.get('photo_id'));
  const existing = db.prepare('SELECT * FROM photo_likes WHERE user_id = ? AND photo_id = ?').get(userId, photoId) as any;
  if (existing) {
    if (existing.type === 'like') db.prepare('DELETE FROM photo_likes WHERE id = ?').run(existing.id);
    else db.prepare("UPDATE photo_likes SET type = 'like' WHERE id = ?").run(existing.id);
  } else {
    db.prepare("INSERT INTO photo_likes (user_id, photo_id, type) VALUES (?, ?, 'like')").run(userId, photoId);
  }
  revalidatePath('/photo/' + photoId);
}

export async function togglePhotoDislikeAction(formData: FormData) {
  const userId = getUserId();
  if (!userId) redirect('/login');
  const photoId = Number(formData.get('photo_id'));
  const existing = db.prepare('SELECT * FROM photo_likes WHERE user_id = ? AND photo_id = ?').get(userId, photoId) as any;
  if (existing) {
    if (existing.type === 'dislike') db.prepare('DELETE FROM photo_likes WHERE id = ?').run(existing.id);
    else db.prepare("UPDATE photo_likes SET type = 'dislike' WHERE id = ?").run(existing.id);
  } else {
    db.prepare("INSERT INTO photo_likes (user_id, photo_id, type) VALUES (?, ?, 'dislike')").run(userId, photoId);
  }
  revalidatePath('/photo/' + photoId);
}

export async function closePostAction(formData: FormData) {
  const userId = getUserId();
  if (!userId) redirect('/login');
  const postId = Number(formData.get('post_id') || 0);
  db.prepare("UPDATE posts SET status = 'closed' WHERE id = ? AND user_id = ?").run(postId, userId);
  redirect('/post/' + postId);
}

export async function reportAction(formData: FormData) {
  const userId = getUserId();
  if (!userId) redirect('/login');
  const postId = Number(formData.get('post_id') || 0);
  const reason = String(formData.get('reason') || '').trim();
  db.prepare('INSERT INTO reports (post_id, user_id, reason) VALUES (?, ?, ?)').run(postId, userId, reason);
  redirect('/post/' + postId + '?reported=1');
}

export async function addCommentAction(formData: FormData) {
  const userId = getUserId();
  if (!userId) redirect('/login');
  const postId = Number(formData.get('post_id'));
  const body = String(formData.get('body') || '').trim();
  if (body) {
    db.prepare('INSERT INTO comments (post_id, user_id, body) VALUES (?, ?, ?)').run(postId, userId, body);
    const post = db.prepare('SELECT user_id FROM posts WHERE id = ?').get(postId) as any;
    if (post && post.user_id !== userId) {
      db.prepare("INSERT INTO notifications (user_id, sender_id, type, target_id) VALUES (?, ?, 'comment_post', ?)").run(post.user_id, userId, postId);
    }
  }
  redirect('/post/' + postId);
}

export async function addReplyCommentAction(formData: FormData) {
  const userId = getUserId();
  if (!userId) redirect('/login');
  const postId = Number(formData.get('post_id'));
  const parentId = Number(formData.get('parent_id'));
  const body = String(formData.get('body') || '').trim();
  
  if (body) {
    db.prepare('INSERT INTO comments (post_id, user_id, parent_id, body) VALUES (?, ?, ?, ?)').run(postId, userId, parentId, body);
    const post = db.prepare('SELECT user_id FROM posts WHERE id = ?').get(postId) as any;
    if (post && post.user_id !== userId) {
      db.prepare("INSERT INTO notifications (user_id, sender_id, type, target_id) VALUES (?, ?, 'comment_post', ?)").run(post.user_id, userId, postId);
    }
    const parentComment = db.prepare('SELECT user_id FROM comments WHERE id = ?').get(parentId) as any;
    if (parentComment && parentComment.user_id !== userId) {
      db.prepare("INSERT INTO notifications (user_id, sender_id, type, target_id) VALUES (?, ?, 'reply_comment', ?)").run(parentComment.user_id, userId, postId);
    }
  }
  redirect('/post/' + postId);
}

export async function addPhotoCommentAction(formData: FormData) {
  const userId = getUserId();
  if (!userId) redirect('/login');
  const photoId = Number(formData.get('photo_id'));
  const body = String(formData.get('body') || '').trim();
  if (body) {
    db.prepare('INSERT INTO photo_comments (photo_id, user_id, body) VALUES (?, ?, ?)').run(photoId, userId, body);
    const photo = db.prepare('SELECT user_id FROM gallery_photos WHERE id = ?').get(photoId) as any;
    if (photo && photo.user_id !== userId) {
      db.prepare("INSERT INTO notifications (user_id, sender_id, type, target_id) VALUES (?, ?, 'comment_photo', ?)").run(photo.user_id, userId, photoId);
    }
  }
  redirect('/photo/' + photoId);
}

export async function sendMessageAction(formData: FormData) {
  const userId = getUserId();
  if (!userId) redirect('/login');
  const receiverId = Number(formData.get('receiver_id'));
  const body = String(formData.get('body') || '').trim();
  if (body && userId !== receiverId) db.prepare('INSERT INTO messages (sender_id, receiver_id, body) VALUES (?, ?, ?)').run(userId, receiverId, body);
  redirect('/messages/' + receiverId);
}

export async function markMessagesAsRead(receiverId: number, senderId: number) {
  db.prepare('UPDATE messages SET is_read = 1 WHERE receiver_id = ? AND sender_id = ?').run(receiverId, senderId);
}

export async function deletePostAction(formData: FormData) {
  const userId = getUserId();
  if (!userId) redirect('/login');
  const me = db.prepare('SELECT name FROM users WHERE id = ?').get(userId) as any;
  if (me.name !== 'KovrovLife') redirect('/');
  const postId = Number(formData.get('post_id') || 0);
  db.prepare('DELETE FROM reports WHERE post_id = ?').run(postId);
  db.prepare('DELETE FROM posts WHERE id = ?').run(postId);
  redirect('/admin');
}

export async function dismissReportAction(formData: FormData) {
  const userId = getUserId();
  if (!userId) redirect('/login');
  const me = db.prepare('SELECT name FROM users WHERE id = ?').get(userId) as any;
  if (me.name !== 'KovrovLife') redirect('/');
  const reportId = Number(formData.get('report_id') || 0);
  db.prepare('DELETE FROM reports WHERE id = ?').run(reportId);
  redirect('/admin');
}

export async function sendFriendRequest(formData: FormData) {
  const userId = getUserId();
  if (!userId) redirect('/login');
  const targetId = Number(formData.get('target_id'));
  
  if (userId !== targetId) {
    const existing = db.prepare('SELECT * FROM friends WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)').get(userId, targetId, targetId, userId);
    
    if (!existing) {
      db.prepare('INSERT INTO friends (user_id, friend_id) VALUES (?, ?)').run(userId, targetId);
      db.prepare("INSERT INTO notifications (user_id, sender_id, type, target_id) VALUES (?, ?, 'friend_request', ?)").run(targetId, userId, userId);
    }
  }
  redirect('/profile/' + targetId);
}

export async function acceptFriendRequest(formData: FormData) {
  const userId = getUserId();
  if (!userId) redirect('/login');
  const requestId = Number(formData.get('request_id'));
  const request = db.prepare('SELECT * FROM friends WHERE id = ?').get(requestId) as any;
  
  if (request && request.friend_id === userId) {
    db.prepare("UPDATE friends SET status = 'accepted' WHERE id = ?").run(requestId);
    db.prepare("INSERT INTO notifications (user_id, sender_id, type, target_id) VALUES (?, ?, 'friend_accept', ?)").run(request.user_id, userId, userId);
    
    redirect('/profile/' + request.user_id);
  }
  
  redirect('/');
}

export async function reportUserAction(formData: FormData) {
  const userId = getUserId();
  if (!userId) redirect('/login');
  const targetId = Number(formData.get('target_id'));
  const reason = String(formData.get('reason') || '').trim();
  if (userId !== targetId && reason) db.prepare('INSERT INTO user_reports (user_id, reason) VALUES (?, ?)').run(targetId, reason);
  redirect('/profile/' + targetId + '?reported=1');
}

export async function dismissUserReportAction(formData: FormData) {
  const userId = getUserId();
  if (!userId) redirect('/login');
  const me = db.prepare('SELECT name FROM users WHERE id = ?').get(userId) as any;
  if (me.name !== 'KovrovLife') redirect('/');
  const reportId = Number(formData.get('report_id') || 0);
  db.prepare('DELETE FROM user_reports WHERE id = ?').run(reportId);
  redirect('/admin');
}

export async function toggleAdminAction(formData: FormData) {
  const userId = getUserId();
  if (!userId) redirect('/login');
  const me = db.prepare('SELECT name FROM users WHERE id = ?').get(userId) as any;
  if (me.name !== 'KovrovLife') redirect('/');
  const targetId = Number(formData.get('target_id'));
  const targetUser = db.prepare('SELECT is_admin, name FROM users WHERE id = ?').get(targetId) as any;
  if (targetUser && targetUser.name !== 'KovrovLife') {
    const newStatus = targetUser.is_admin === 1 ? 0 : 1;
    db.prepare('UPDATE users SET is_admin = ? WHERE id = ?').run(newStatus, targetId);
  }
  redirect('/profile/' + targetId);
}

export async function createWallPostAction(formData: FormData) {
  const userId = getUserId();
  if (!userId) redirect('/login');
  const ownerId = Number(formData.get('owner_id'));
  const body = String(formData.get('body') || '').trim();
  if (body && ownerId) db.prepare('INSERT INTO wall_posts (owner_id, author_id, body) VALUES (?, ?, ?)').run(ownerId, userId, body);
  redirect('/profile/' + ownerId);
}

export async function toggleWallLikeAction(formData: FormData) {
  const userId = getUserId();
  if (!userId) redirect('/login');
  const wallPostId = Number(formData.get('wall_post_id'));
  const existing = db.prepare('SELECT * FROM wall_likes WHERE user_id = ? AND wall_post_id = ?').get(userId, wallPostId) as any;
  if (existing) {
    if (existing.type === 'like') db.prepare('DELETE FROM wall_likes WHERE id = ?').run(existing.id);
    else db.prepare("UPDATE wall_likes SET type = 'like' WHERE id = ?").run(existing.id);
  } else {
    db.prepare("INSERT INTO wall_likes (user_id, wall_post_id, type) VALUES (?, ?, 'like')").run(userId, wallPostId);
  }
  revalidatePath('/profile');
}

export async function toggleWallDislikeAction(formData: FormData) {
  const userId = getUserId();
  if (!userId) redirect('/login');
  const wallPostId = Number(formData.get('wall_post_id'));
  const existing = db.prepare('SELECT * FROM wall_likes WHERE user_id = ? AND wall_post_id = ?').get(userId, wallPostId) as any;
  if (existing) {
    if (existing.type === 'dislike') db.prepare('DELETE FROM wall_likes WHERE id = ?').run(existing.id);
    else db.prepare("UPDATE wall_likes SET type = 'dislike' WHERE id = ?").run(existing.id);
  } else {
    db.prepare("INSERT INTO wall_likes (user_id, wall_post_id, type) VALUES (?, ?, 'dislike')").run(userId, wallPostId);
  }
  revalidatePath('/profile');
}

export async function addWallCommentAction(formData: FormData) {
  const userId = getUserId();
  if (!userId) redirect('/login');
  const wallPostId = Number(formData.get('wall_post_id'));
  const ownerId = Number(formData.get('owner_id'));
  const body = String(formData.get('body') || '').trim();
  if (body) {
    db.prepare('INSERT INTO wall_comments (wall_post_id, user_id, body) VALUES (?, ?, ?)').run(wallPostId, userId, body);
    const post = db.prepare('SELECT owner_id, author_id FROM wall_posts WHERE id = ?').get(wallPostId) as any;
    if (post) {
      if (post.owner_id !== userId) {
        db.prepare("INSERT INTO notifications (user_id, sender_id, type, target_id) VALUES (?, ?, 'comment_wall', ?)").run(post.owner_id, userId, wallPostId);
      } else if (post.author_id !== userId && post.author_id !== post.owner_id) {
        db.prepare("INSERT INTO notifications (user_id, sender_id, type, target_id) VALUES (?, ?, 'comment_wall', ?)").run(post.author_id, userId, wallPostId);
      }
    }
  }
  redirect('/profile/' + ownerId);
}

export async function deleteWallPostAction(formData: FormData) {
  const userId = getUserId();
  if (!userId) redirect('/login');
  const postId = Number(formData.get('wall_post_id'));
  const ownerId = Number(formData.get('owner_id'));
  const post = db.prepare('SELECT * FROM wall_posts WHERE id = ?').get(postId) as any;
  if (post && (post.author_id === userId || post.owner_id === userId)) {
    db.prepare('DELETE FROM wall_posts WHERE id = ?').run(postId);
  }
  redirect('/profile/' + ownerId);
}

export async function markNotificationsReadAction() {
  const userId = getUserId();
  if (!userId) redirect('/login');
  db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(userId);
  redirect('/notifications');
}

export async function createReelAction(description: string, videoUrl: string) {
  const userId = getUserId();
  if (!userId) redirect('/login');
  if (!videoUrl) throw new Error('Видео не загружено');

  db.prepare('INSERT INTO reels (user_id, video_url, description) VALUES (?, ?, ?)').run(userId, videoUrl, description);
  redirect('/reels');
}

export async function toggleReelLikeAction(formData: FormData) {
  const userId = getUserId();
  if (!userId) redirect('/login');
  const reelId = Number(formData.get('reel_id'));
  const existing = db.prepare('SELECT * FROM reel_likes WHERE user_id = ? AND reel_id = ?').get(userId, reelId) as any;
  
  if (existing) {
    if (existing.type === 'like') db.prepare('DELETE FROM reel_likes WHERE id = ?').run(existing.id);
    else db.prepare("UPDATE reel_likes SET type = 'like' WHERE id = ?").run(existing.id);
  } else {
    db.prepare("INSERT INTO reel_likes (user_id, reel_id, type) VALUES (?, ?, 'like')").run(userId, reelId);
  }
  revalidatePath('/reels');
}

export async function createStoryAction(formData: FormData) {
  const userId = getUserId();
  if (!userId) redirect('/login');
  
  const mediaUrl = String(formData.get('mediaUrl') || '');
  const mediaType = String(formData.get('mediaType') || 'photo');

  if (!mediaUrl) throw new Error('Файл не загружен');

  db.prepare('INSERT INTO stories (user_id, media_url, media_type) VALUES (?, ?, ?)').run(userId, mediaUrl, mediaType);
  redirect('/');
}

export async function addReelCommentAction(formData: FormData) {
  const userId = getUserId();
  if (!userId) redirect('/login');
  const reelId = Number(formData.get('reel_id'));
  const body = String(formData.get('body') || '').trim();
  if (body) {
    db.prepare('INSERT INTO reel_comments (reel_id, user_id, body) VALUES (?, ?, ?)').run(reelId, userId, body);
  }
  redirect('/reels');
}

export async function uploadTrackAction(formData: FormData) {
  const userId = getUserId();
  if (!userId) redirect('/login');
  const title = String(formData.get('title') || '').trim();
  const artist = String(formData.get('artist') || '').trim();
  const file = formData.get('file') as File | null;

  if (!title || !artist || !file || file.size === 0) {
    throw new Error('Заполните название, исполнителя и выберите файл');
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const filename = `track-${userId}-${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
  const uploadDir = path.join(process.cwd(), 'public/uploads');
  await fs.promises.mkdir(uploadDir, { recursive: true });
  await fs.promises.writeFile(path.join(uploadDir, filename), buffer);

  db.prepare('INSERT INTO tracks (user_id, title, artist, file_url) VALUES (?, ?, ?, ?)').run(userId, title, artist, `/uploads/${filename}`);
  redirect('/music');
}

export async function addTrackToMyMusicAction(formData: FormData) {
  const userId = getUserId();
  if (!userId) redirect('/login');
  const trackId = Number(formData.get('track_id'));
  
  const existing = db.prepare('SELECT * FROM user_tracks WHERE user_id = ? AND track_id = ?').get(userId, trackId);
  if (!existing) {
    db.prepare('INSERT INTO user_tracks (user_id, track_id) VALUES (?, ?)').run(userId, trackId);
  }
  redirect('/music');
}

export async function removeTrackFromMyMusicAction(formData: FormData) {
  const userId = getUserId();
  if (!userId) redirect('/login');
  const trackId = Number(formData.get('track_id'));
  
  db.prepare('DELETE FROM user_tracks WHERE user_id = ? AND track_id = ?').run(userId, trackId);
  redirect('/music');
}