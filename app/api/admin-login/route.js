import { NextResponse } from 'next/server';

// 后台管理员口令校验
export async function POST(req) {
  try {
    const { password } = await req.json();
    const correct = process.env.ADMIN_PASS || 'reelverse@1388';

    if (password === correct) {
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ ok: false, error: '口令错误' }, { status: 401 });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
