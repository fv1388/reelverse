import { NextResponse } from 'next/server';
import { capturePayPalOrder } from '../../../lib/paypal';

// 捕获付款（确认钱到账）
export async function POST(req) {
  try {
    const { orderId } = await req.json();
    if (!orderId) {
      return NextResponse.json({ error: '缺少 orderId' }, { status: 400 });
    }

    const cap = await capturePayPalOrder(orderId);

    return NextResponse.json({
      success: cap.status === 'COMPLETED',
      captureId: cap.id || null,
      payerEmail: cap.payer?.email_address || null,
      amount: cap.purchase_units?.[0]?.payments?.captures?.[0]?.amount?.value || null,
    });
  } catch (e) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
