import { auth } from '@/auth';
import { NextResponse } from 'next/server';

export async function GET() {
  const session = await auth();
  
  return NextResponse.json({
    session,
    timestamp: new Date().toISOString(),
    note: '⚠️ ELIMINAR ESTE ENDPOINT EN PRODUCCIÓN'
  }, {
    headers: {
      'Content-Type': 'application/json'
    }
  });
}
