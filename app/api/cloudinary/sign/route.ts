import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    
    // Auth check: Only admins should be able to sign upload requests
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { paramsToSign } = body;

    if (!paramsToSign) {
      return NextResponse.json({ error: 'No parameters to sign' }, { status: 400 });
    }

    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    const apiKey = process.env.CLOUDINARY_API_KEY;

    if (!apiSecret || !apiKey) {
      return NextResponse.json(
        { error: 'Cloudinary configuration missing on server' }, 
        { status: 500 }
      );
    }

    // Parameters must be alphabetized for signing
    const sortedParams = Object.keys(paramsToSign)
      .sort()
      .map((key) => `${key}=${paramsToSign[key]}`)
      .join('&');

    const signature = crypto
      .createHash('sha1')
      .update(sortedParams + apiSecret)
      .digest('hex');

    return NextResponse.json({ signature });
  } catch (error) {
    console.error('Error signing Cloudinary request', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
