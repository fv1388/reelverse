import { NextResponse } from 'next/server';
import { createPayPalOrder } from '../../../lib/paypal';

// 创建 PayPal 订单（一次付款解锁全剧）
export async function POST(req) {
  try {
    const { amount, currency = 'USD', description } = await req.json();

    if (!amount || !description) {
      return NextResponse.json({ error: '缺少金额或描述' }, { status: 400 });
    }

    const order = await createPayPalOrder({ amount, currency, description });
    const approval = order.links?.find((l) => l.rel === 'approve');

    return NextResponse.json({
      orderId: order.id,
      approvalUrl: approval?.href || null,
    });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
