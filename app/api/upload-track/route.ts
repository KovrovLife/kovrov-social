import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req: Request) {
  const data = await req.formData();
  const file = data.get('file') as File | null;
  
  if (!file || file.size === 0) {
    return NextResponse.json({ error: 'Файл не загружен' }, { status: 400 });
  }

  const uploadDir = path.join(process.cwd(), 'public/uploads');
  await fs.promises.mkdir(uploadDir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  const filename = `track-${Date.now()}-${Math.random().toString(36).substring(7)}.mp3`;
  await fs.promises.writeFile(path.join(uploadDir, filename), buffer);

  return NextResponse.json({ url: `/uploads/${filename}` });
}