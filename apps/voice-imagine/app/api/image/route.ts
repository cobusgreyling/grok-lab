import { NextRequest, NextResponse } from 'next/server';

// Server proxy for xAI Imagine image generation.
// Keeps the key off the client for public demos.

export async function POST(req: NextRequest) {
  const serverKey = process.env.XAI_API_KEY;
  const body = await req.json();

  if (!serverKey) {
    return NextResponse.json({ useClientKey: true }, { status: 200 });
  }

  try {
    const res = await fetch('https://api.x.ai/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serverKey}`,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'image proxy error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
