import { NextRequest, NextResponse } from 'next/server';

// Server-side proxy for chat completions.
// Hides your XAI_API_KEY from the browser for any public deployment.
// Falls back gracefully if no server key (client will use its own key).

export async function POST(req: NextRequest) {
  const serverKey = process.env.XAI_API_KEY;
  const body = await req.json();

  if (!serverKey) {
    // No server key configured — tell client to use its pasted key directly (demo mode)
    return NextResponse.json({ useClientKey: true }, { status: 200 });
  }

  try {
    const res = await fetch('https://api.x.ai/v1/chat/completions', {
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
    const message = e instanceof Error ? e.message : 'proxy error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
