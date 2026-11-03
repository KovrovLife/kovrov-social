import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserId } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const userId = getUserId();
  if (!userId) return NextResponse.json({ tracks: [], myTracks: [] });

  const tracks = db.prepare('SELECT * FROM tracks ORDER BY created_at DESC').all() as any[];
  
  const myTracks = db.prepare(`
    SELECT tracks.* 
    FROM user_tracks 
    JOIN tracks ON tracks.id = user_tracks.track_id 
    WHERE user_tracks.user_id = ?
    ORDER BY user_tracks.created_at DESC
  `).all(userId) as any[];

  return NextResponse.json({ tracks, myTracks });
}