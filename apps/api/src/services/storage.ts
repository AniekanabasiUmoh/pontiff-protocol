import { supabase } from '../utils/database';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Upload image to Supabase Storage
 * 
 * @param imageData - Base64 encoded image data URL
 * @param confessionId - Unique ID for the confession
 * @param extension - File extension (svg, png, jpg)
 * @returns Public URL of uploaded image
 */
export async function uploadWritImage(
    imageData: string,
    confessionId: string,
    extension: string = 'svg'
): Promise<string> {
    try {
        // Extract base64 data from data URL
        const base64Data = imageData.split(',')[1];
        const buffer = Buffer.from(base64Data, 'base64');

        // Generate unique filename
        const filename = `writ-${confessionId}.${extension}`;
        const filepath = `writs/${filename}`;

        console.log(`📤 Uploading writ image: ${filepath}`);

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
            .from('confession-images')
            .upload(filepath, buffer, {
                contentType: getContentType(extension),
                cacheControl: '3600',
                upsert: true // Overwrite if exists
            });

        if (error) {
            console.error('Supabase upload error:', error);
            throw new Error(`Upload failed: ${error.message}`);
        }

        // Get public URL
        const { data: urlData } = supabase.storage
            .from('confession-images')
            .getPublicUrl(filepath);

        const publicUrl = urlData.publicUrl;
        console.log(`✅ Image uploaded: ${publicUrl}`);

        return publicUrl;
    } catch (error) {
        console.error('Failed to upload image:', error);
        throw error;
    }
}

/**
 * Delete image from Supabase Storage
 */
export async function deleteWritImage(confessionId: string, extension: string = 'svg'): Promise<void> {
    try {
        const filename = `writ-${confessionId}.${extension}`;
        const filepath = `writs/${filename}`;

        const { error } = await supabase.storage
            .from('confession-images')
            .remove([filepath]);

        if (error) {
            console.error('Failed to delete image:', error);
        }
    } catch (error) {
        console.error('Delete image error:', error);
    }
}

/**
 * Check if storage bucket exists and is accessible
 */
export async function checkStorageBucket(): Promise<boolean> {
    try {
        const { data, error } = await supabase.storage
            .from('confession-images')
            .list('', { limit: 1 });

        if (error) {
            console.error('Storage bucket check failed:', error);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Storage bucket error:', error);
        return false;
    }
}

/**
 * Create storage bucket if it doesn't exist
 * Note: This requires admin privileges, do this manually in Supabase dashboard
 */
export async function createStorageBucket(): Promise<void> {
    try {
        const { data, error } = await supabase.storage.createBucket('confession-images', {
            public: true,
            fileSizeLimit: 5242880, // 5MB
            allowedMimeTypes: ['image/svg+xml', 'image/png', 'image/jpeg']
        });

        if (error) {
            console.error('Failed to create bucket:', error);
            throw error;
        }

        console.log('✅ Storage bucket created');
    } catch (error) {
        console.error('Create bucket error:', error);
        throw error;
    }
}

/**
 * Get content type from file extension
 */
function getContentType(extension: string): string {
    const contentTypes: Record<string, string> = {
        'svg': 'image/svg+xml',
        'png': 'image/png',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg'
    };

    return contentTypes[extension.toLowerCase()] || 'image/png';
}

/**
 * Get storage info and stats
 */
export async function getStorageInfo(): Promise<any> {
    try {
        const { data, error } = await supabase.storage
            .from('confession-images')
            .list('writs/', { limit: 100 });

        if (error) {
            throw error;
        }

        const totalSize = data.reduce((sum: number, file: any) => sum + (file.metadata?.size || 0), 0);
        const totalFiles = data.length;

        return {
            totalFiles,
            totalSize,
            totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2)
        };
    } catch (error) {
        console.error('Get storage info error:', error);
        return null;
    }
}
