// TypeScript conversion in progress
import { callableClient } from './callableClient';

const UPLOAD_TIMEOUT_MS = 45000;

const fetchWithTimeout = async (url, options = {}, timeoutMs = UPLOAD_TIMEOUT_MS) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        return await fetch(url, {
            ...options,
            signal: controller.signal
        });
    } finally {
        clearTimeout(timer);
    }
};

export const mediaService = {
    /**
     * Uploads an image/video to Cloudinary
     * @param {string} localUri - Local file URI from ImagePicker
     * @param {string} folder - Optional folder name (default)
     * @returns {Promise<string>} - The secure URL of the uploaded asset
     */
    uploadAsset: async (localUri, folder = 'avatars') => {
        try {
            // 1. Get Signature from Backend
            const signData = await callableClient.invokeWithAuth('generateUploadSignature', { folder });

            const { signature, timestamp, cloud_name, api_key } = signData;

            // 2. Prepare Upload Form Data
            const formData = new FormData();
            formData.append('file', {
                uri: localUri,
                type: 'image/jpeg', // Modify based on actual type if needed, or generic multipart
                name: localUri.split('/').pop() || 'upload.jpg'
            });
            formData.append('api_key', api_key);
            formData.append('timestamp', timestamp);
            formData.append('signature', signature);
            formData.append('folder', folder);

            // 3. Upload to Cloudinary
            const response = await fetchWithTimeout(`https://api.cloudinary.com/v1_1/${cloud_name}/auto/upload`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`Upload request failed (${response.status})`);
            }

            const result = await response.json();

            if (result.secure_url) {
                return result.secure_url;
            } else {
                throw new Error(result.error?.message || 'Upload failed');
            }
        } catch (error) {
            console.error('Media Upload Error:', error);
            if (String(error?.name || '').toLowerCase() === 'aborterror') {
                throw new Error('Upload timed out. Please try a smaller image or retry.');
            }
            throw error;
        }
    }
};
