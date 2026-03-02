
import { supabase } from './supabaseClient';

export const BUCKETS = {
    INDENTS: 'indents',
    PURCHASE_ORDERS: 'purchase-orders',
    BILLS: 'bills',
    PRODUCTS: 'products',
    REPORTS: 'reports',
    MISC: 'misc'
};

export async function uploadFileToSupabase({
    file,
    bucket,
    folderPath = ''
}: {
    file: File;
    bucket: string;
    folderPath?: string;
}): Promise<string> {
    const timestamp = new Date().getTime();
    // Sanitize filename
    const fileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const path = folderPath ? `${folderPath}/${timestamp}_${fileName}` : `${timestamp}_${fileName}`;

    const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
            cacheControl: '3600',
            upsert: false
        });

    if (error) {
        console.error('Error uploading file to Supabase:', error);
        throw error;
    }

    // Get public URL
    const { data: publicData } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

    return publicData.publicUrl;
}

// Function to map current Google Drive folder IDs to buckets (heuristic)
export function getBucketForFolderId(folderId: string): string {
    // This mapping depends on how the user was using folders. 
    // Since we don't know the exact IDs, we can default to 'misc' or try to guess from context if passed elsewhere.
    // However, for the `uploadFile` function in fetchers, the user usually passes a folderId from env.

    // We can just ignore the folderId and rely on a semantic bucket name passed from the caller,
    // OR we can map existing known ENV vars if we knew them.
    // For now, we will assume the caller should switch to passing a bucket name, 
    // BUT to maintain compatibility, we might default to 'misc' if not specified.

    return BUCKETS.MISC;
}
