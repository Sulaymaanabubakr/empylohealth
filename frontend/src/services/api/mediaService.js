// TypeScript conversion in progress
import { functions } from '../firebaseConfig';
import { httpsCallable } from 'firebase/functions';

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
            const getSignature = httpsCallable(functions, 'generateUploadSignature');
            const { data: signData } = await getSignature({ folder });

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
            const response = await fetch(`https://api.cloudinary.com/v1_1/${cloud_name}/auto/upload`, {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.secure_url) {
                return result.secure_url;
            } else {
                throw new Error(result.error?.message || 'Upload failed');
            }
        } catch (error) {
            console.error('Media Upload Error:', error);
            throw error;
        }
    }
};
