/**
 * NeuroSync Bulk Study Material Syncer
 * ------------------------------------
 * This script automates the process of uploading local folders to Supabase.
 * 
 * EXPECTED FOLDER STRUCTURE:
 * [Base Path] / [Class Level] / [Subject] / [Material Type] / [PDF Files]
 * Example: C:/MyStudyData / Class 10 / Mathematics / Notes / geometry.pdf
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const mime = require('mime-types');

// --- CONFIGURATION ---
const SUPABASE_URL = 'https://wpluzesjitwmklpwvqlv.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'YOUR_SERVICE_ROLE_KEY'; // MUST USE SERVICE ROLE FOR BULK SYNC
const LOCAL_BASE_PATH = 'C:/Path/To/Your/Study/Folders';
const ADMIN_USER_ID = 'YOUR_ADMIN_USER_ID';
const ADMIN_EMAIL = 'admin@neurosync.com';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function syncDirectory(dirPath) {
    const items = fs.readdirSync(dirPath);

    for (const item of items) {
        const fullPath = path.join(dirPath, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            await syncDirectory(fullPath);
        } else if (item.toLowerCase().endsWith('.pdf')) {
            await processPdf(fullPath);
        }
    }
}

async function processPdf(filePath) {
    // Relative path from base: "Class 10/Mathematics/Notes/file.pdf"
    const relativePath = path.relative(LOCAL_BASE_PATH, filePath).replace(/\\/g, '/');
    const pathParts = relativePath.split('/');

    if (pathParts.length < 4) {
        console.warn(`[SKIP] Path too shallow: ${relativePath}. Expected: Class/Subject/Type/File.pdf`);
        return;
    }

    const [classLevel, subject, materialType, fileName] = pathParts;
    const title = path.parse(fileName).name.replace(/_/g, ' ');

    console.log(`[START] Processing: ${relativePath}`);

    try {
        // 1. Upload to Storage
        const fileBuffer = fs.readFileSync(filePath);
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('study-library')
            .upload(relativePath, fileBuffer, {
                contentType: 'application/pdf',
                upsert: true
            });

        if (uploadError) throw uploadError;

        // 2. Get Public URL
        const { data: { publicUrl } } = supabase.storage
            .from('study-library')
            .getPublicUrl(relativePath);

        // 3. Register in Database
        const { error: dbError } = await supabase
            .from('study_materials')
            .upsert([{
                title: title,
                class_level: classLevel,
                subject: subject,
                material_type: materialType,
                file_path: relativePath,
                file_url: publicUrl,
                uploader_id: ADMIN_USER_ID,
                uploader_email: ADMIN_EMAIL,
                uploader_name: 'Admin Manual Sync',
                status: 'approved',
                file_size_bytes: fileBuffer.length
            }], { onConflict: 'file_path' });

        if (dbError) throw dbError;

        console.log(`[SUCCESS] Synced: ${title} (${classLevel} > ${subject})`);

    } catch (err) {
        console.error(`[ERROR] Failed to sync ${relativePath}:`, err.message);
    }
}

// Start Sync
console.log("NeuroSync Bulk Sync Protocol: INITIALIZING...");
syncDirectory(LOCAL_BASE_PATH).then(() => {
    console.log("NeuroSync Bulk Sync Protocol: COMPLETED.");
});
