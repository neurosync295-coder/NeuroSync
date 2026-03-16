/**
 * NeuroSync Storage Initialization Script
 * ---------------------------------------
 * This script creates the actual folder hierarchy in your Supabase Storage bucket
 * by uploading a small ".keep" file to every class/subject/type path.
 * 
 * This allows you to navigate through the "folders" directly in the Supabase Dashboard.
 */

const { createClient } = require('@supabase/supabase-js');

// --- CONFIGURATION ---
const SUPABASE_URL = 'https://wpluzesjitwmklpwvqlv.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'YOUR_SERVICE_ROLE_KEY'; // Get from Project Settings > API
const BUCKET_NAME = 'study-library';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const CLASSES = ['Class 9', 'Class 10', 'Class 11', 'Class 12'];

const SUBJECTS_9_10 = ['Mathematics', 'Science', 'Social Science', 'English', 'Hindi', 'Computer Science'];
const SUBJECTS_11_12 = [
    'Physics', 'Chemistry', 'Mathematics', 'Biology', 'English', 
    'Accountancy', 'Business Studies', 'Economics', 
    'History', 'Geography', 'Political Science'
];

const TYPES = ['Notes', 'PYQ', 'Syllabus', 'Sample Paper'];

async function initFolders() {
    console.log("NeuroSync Storage Initialization: STARTING...");

    for (const classLevel of CLASSES) {
        const subjects = (classLevel === 'Class 9' || classLevel === 'Class 10') ? SUBJECTS_9_10 : SUBJECTS_11_12;
        
        for (const subject of subjects) {
            for (const type of TYPES) {
                const folderPath = `${classLevel}/${subject}/${type}/.keep`;
                
                console.log(`[SYNC] Creating: ${classLevel} > ${subject} > ${type}`);
                
                const { error } = await supabase.storage
                    .from(BUCKET_NAME)
                    .upload(folderPath, 'Initialized by NeuroSync Admin', {
                        contentType: 'text/plain',
                        upsert: true
                    });

                if (error) {
                    console.error(`[ERROR] Failed at ${folderPath}:`, error.message);
                }
            }
        }
    }

    console.log("NeuroSync Storage Initialization: COMPLETED.");
}

initFolders();
