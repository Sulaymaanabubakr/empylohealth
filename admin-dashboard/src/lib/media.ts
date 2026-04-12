import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';

type UploadKind = 'image' | 'video';

type UploadResult = {
    secureUrl: string;
    publicId: string;
    resourceType: string;
    format?: string;
    bytes?: number;
};

const signUpload = httpsCallable(functions, 'generateUploadSignature');

export const uploadCloudinaryAsset = async (
    file: File,
    kind: UploadKind,
    folder = 'resources'
): Promise<UploadResult> => {
    const signResult = await signUpload({ folder });
    const signData = (signResult.data ?? {}) as {
        signature: string;
        timestamp: number;
        cloud_name: string;
        api_key: string;
    };

    if (!signData.signature || !signData.timestamp || !signData.cloud_name || !signData.api_key) {
        throw new Error('Upload signing failed.');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', signData.api_key);
    formData.append('timestamp', String(signData.timestamp));
    formData.append('signature', signData.signature);
    formData.append('folder', folder);
    formData.append('resource_type', kind === 'video' ? 'video' : 'image');

    const response = await fetch(`https://api.cloudinary.com/v1_1/${signData.cloud_name}/auto/upload`, {
        method: 'POST',
        body: formData
    });

    if (!response.ok) {
        throw new Error(`Upload failed (${response.status}).`);
    }

    const result = await response.json();
    if (!result?.secure_url) {
        throw new Error(result?.error?.message || 'Cloudinary upload failed.');
    }

    return {
        secureUrl: result.secure_url,
        publicId: result.public_id,
        resourceType: result.resource_type,
        format: result.format,
        bytes: result.bytes
    };
};
