import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function GET() {
  try {
    const configPath = path.join(process.cwd(), 'public', 'homeConfig.json');
    const data = await fs.promises.readFile(configPath, 'utf8');
    return NextResponse.json(JSON.parse(data));
  } catch (error) {
    console.error('Error reading homeConfig.json', error);
    return NextResponse.json({ error: 'Error reading config' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // In a real app, verify admin role here.

    const body = await req.json();
    const configPath = path.join(process.cwd(), 'public', 'homeConfig.json');
    await fs.promises.writeFile(configPath, JSON.stringify(body, null, 2), 'utf8');

    return NextResponse.json({ success: true, message: 'Config updated' });
  } catch (error) {
    console.error('Error writing homeConfig.json', error);
    return NextResponse.json({ error: 'Error writing config' }, { status: 500 });
  }
}
