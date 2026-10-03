import { handleUpload } from '@vercel/blob/client';

// Vercel Blob 上传（视频/封面）——服务端生成上传权限
export async function POST(req) {
  try {
    const body = await req.json();

    const blob = await handleUpload({
      body,
      request: req,
      addRandomSuffix: true,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: ['video/*', 'image/*'],
        maximumSizeInBytes: 300 * 1024 * 1024, // 300MB
      }),
    });

    return Response.json(blob);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 400 });
  }
}
