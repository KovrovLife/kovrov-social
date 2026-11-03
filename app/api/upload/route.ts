import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req: Request) {
  const data = await req.formData();
  const files = data.getAll('photos') as File[];
  
  const uploadDir = path.join(process.cwd(), 'public/uploads');
  await fs.promises.mkdir(uploadDir, { recursive: true });

  const urls: string[] = [];

  for (const file of files) {
    if (file.size > 0) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}-${file.name.replace(/\s+/g, '_')}`;
      await fs.promises.writeFile(path.join(uploadDir, filename), buffer);
      urls.push(`/uploads/${filename}`);
    }
  }

  return NextResponse.json({ urls });
}