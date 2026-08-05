const cloudinary = require('cloudinary').v2;

const normalizeText = (value) => (value === undefined || value === null ? '' : String(value)).trim();

const getCloudinaryConfig = () => {
  const cloudinaryUrl = normalizeText(process.env.CLOUDINARY_URL);
  const cloudName = normalizeText(process.env.CLOUDINARY_CLOUD_NAME);
  const apiKey = normalizeText(process.env.CLOUDINARY_API_KEY);
  const apiSecret = normalizeText(process.env.CLOUDINARY_API_SECRET);

  if (cloudinaryUrl) {
    cloudinary.config({ secure: true });
    return;
  }

  if (cloudName && apiKey && apiSecret) {
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });
    return;
  }

  const error = new Error('Cloudinary chưa được cấu hình');
  error.statusCode = 500;
  throw error;
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

  getCloudinaryConfig();

  try {
    const safeName = normalizeText(name) || `shoplen-${Date.now()}`;
    const uploadOptions = {
      folder: 'shoplen',
      public_id: `${safeName}-${Date.now()}`,
      resource_type: 'image',
      overwrite: false,
    };

    const result = normalizedSource.startsWith('data:')
      ? await cloudinary.uploader.upload(normalizedSource, uploadOptions)
      : await cloudinary.uploader.upload(normalizedSource, uploadOptions);

    if (!result?.secure_url && !result?.url) {
      const error = new Error('Không thể tải ảnh lên Cloudinary');
      error.statusCode = 400;
      throw error;
    }

    return result.secure_url || result.url;
  } catch (error) {
    const cloudinaryError = error instanceof Error ? error : new Error('Không thể tải ảnh lên Cloudinary');
    cloudinaryError.statusCode = cloudinaryError.statusCode || 400;
    throw cloudinaryError;
  }
};

module.exports = {
  uploadImageToImgBB,
  isImgBBUrl,
  normalizeText,
  sourceToBase64,
};
