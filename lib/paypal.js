// PayPal 后端助手（服务端专用，绝不暴露给前端）
const PAYPAL_API = process.env.PAYPAL_ENV === 'production'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

export async function getPayPalAccessToken() {
  const auth = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_SECRET}`
  ).toString('base64');

  const res = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!res.ok) {
    throw new Error(`PayPal token 获取失败: ${res.status}`);
  }
  const data = await res.json();
  return data.access_token;
}

// 创建订单：一次付款解锁全剧
export async function createPayPalOrder({ amount, currency = 'USD', description }) {
  const token = await getPayPalAccessToken();

  const res = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [
        {
          description,
          amount: {
            currency_code: currency,
            value: amount,
          },
        },
      ],
    }),
  });

  if (!res.ok) {
    throw new Error(`PayPal 创建订单失败: ${res.status}`);
  }
  return res.json();
}

// 捕获付款（确认收到钱）
export async function capturePayPalOrder(orderId) {
  const token = await getPayPalAccessToken();

  const res = await fetch(`${PAYPAL_API}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: '{}',
  });

  if (!res.ok) {
    throw new Error(`PayPal 捕获失败: ${res.status}`);
  }
  return res.json();
}
