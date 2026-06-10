const IMGBB_UPLOAD_ENDPOINT = 'https://api.imgbb.com/1/upload';

const normalizeText = (value) => (value === undefined || value === null ? '' : String(value)).trim();

const getImgbbApiKey = () => {
  const key = normalizeText(process.env.IMGBB_API_KEY);

  if (!key) {
    const error = new Error('IMGBB_API_KEY chưa được cấu hình');
    error.statusCode = 500;
    throw error;
  }

  return key;
};

const isImgBBUrl = (value) => /^https?:\/\/(i\.ibb\.co|ibb\.co|api\.imgbb\.com)\//i.test(value);

const sourceToBase64 = async (source) => {
  const normalizedSource = normalizeText(source);

  if (!normalizedSource) {
    const error = new Error('image_url không được để trống');
    error.statusCode = 400;
    throw error;
  }

  if (normalizedSource.startsWith('data:')) {
    const match = normalizedSource.match(/^data:[^;]+;base64,(.+)$/i);

    if (!match) {
      const error = new Error('image_url dạng data URL không hợp lệ');
      error.statusCode = 400;
      throw error;
    }

    return match[1];
  }

  if (/^https?:\/\//i.test(normalizedSource)) {
    const response = await fetch(normalizedSource);

    if (!response.ok) {
      const error = new Error(`Không thể tải ảnh từ ${normalizedSource}`);
      error.statusCode = 400;
      throw error;
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    return buffer.toString('base64');
  }

  return normalizedSource;
};

const uploadImageToImgBB = async (source, name) => {
  const normalizedSource = normalizeText(source);

  if (!normalizedSource) {
    const error = new Error('image_url không được để trống');
    error.statusCode = 400;
    throw error;
  }

  if (isImgBBUrl(normalizedSource)) {
    return normalizedSource;
  }

  const base64 = await sourceToBase64(normalizedSource);
  const payload = new URLSearchParams({
    key: getImgbbApiKey(),
    image: base64,
  });

  if (name) {
    payload.set('name', name);
  }

  const response = await fetch(IMGBB_UPLOAD_ENDPOINT, {
    method: 'POST',
    body: payload,
  });

  if (!response.ok) {
    const rawError = await response.text().catch(() => '');
    const error = new Error(rawError ? `Không thể tải ảnh lên imgBB: ${rawError}` : 'Không thể tải ảnh lên imgBB');
    error.statusCode = 400;
    throw error;
  }

  const result = await response.json();

  if (!result?.success || !result?.data?.url) {
    const error = new Error(result?.error?.message || 'Không thể tải ảnh lên imgBB');
    error.statusCode = 400;
    throw error;
  }

  return result.data.display_url || result.data.url;
};

module.exports = {
  uploadImageToImgBB,
  isImgBBUrl,
  normalizeText,
};
