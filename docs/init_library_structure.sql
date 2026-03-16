-- NeuroSync Study Library: Genesis Structure Initialization (FIXED)
-- This script seeds the 'study_materials' table while respecting NOT NULL constraints.

DO $$
DECLARE
    sys_user_id UUID;
    sys_email TEXT;
BEGIN
    -- 1. Obtain a valid user ID for the genesis nodes
    -- We'll use the first available user (the admin who is running this script)
    SELECT id, email INTO sys_user_id, sys_email FROM auth.users LIMIT 1;

    -- If no user is found, we should at least try to insert with a placeholder 
    -- but usually, the admin exists if they are running this in the SQL editor.
    IF sys_user_id IS NULL THEN
        RAISE EXCEPTION 'No user found in auth.users. Please create an account first.';
    END IF;

    -- 2. Seed Genesis Nodes (Class 9 - 12)
    -- Using ON CONFLICT DO NOTHING to prevent duplicates if re-run.
    
    INSERT INTO public.study_materials (
        title, class_level, subject, description, 
        uploader_id, uploader_email, uploader_name, status
    )
    VALUES 
    -- Class 9
    ('Archive Initialization', 'Class 9', 'Mathematics', 'Neural mapping for Class 9 Mathematics archive.', sys_user_id, sys_email, 'NeuroSync Genesis', 'approved'),
    ('Archive Initialization', 'Class 9', 'Science', 'Neural mapping for Class 9 Science archive.', sys_user_id, sys_email, 'NeuroSync Genesis', 'approved'),
    ('Archive Initialization', 'Class 9', 'Social Science', 'Neural mapping for Class 9 Social Science archive.', sys_user_id, sys_email, 'NeuroSync Genesis', 'approved'),
    ('Archive Initialization', 'Class 9', 'English', 'Neural mapping for Class 9 English archive.', sys_user_id, sys_email, 'NeuroSync Genesis', 'approved'),
    ('Archive Initialization', 'Class 9', 'Hindi', 'Neural mapping for Class 9 Hindi archive.', sys_user_id, sys_email, 'NeuroSync Genesis', 'approved'),
    ('Archive Initialization', 'Class 9', 'Computer Science', 'Neural mapping for Class 9 Computer Science archive.', sys_user_id, sys_email, 'NeuroSync Genesis', 'approved'),

    -- Class 10
    ('Archive Initialization', 'Class 10', 'Mathematics', 'Neural mapping for Class 10 Mathematics archive.', sys_user_id, sys_email, 'NeuroSync Genesis', 'approved'),
    ('Archive Initialization', 'Class 10', 'Science', 'Neural mapping for Class 10 Science archive.', sys_user_id, sys_email, 'NeuroSync Genesis', 'approved'),
    ('Archive Initialization', 'Class 10', 'Social Science', 'Neural mapping for Class 10 Social Science archive.', sys_user_id, sys_email, 'NeuroSync Genesis', 'approved'),
    ('Archive Initialization', 'Class 10', 'English', 'Neural mapping for Class 10 English archive.', sys_user_id, sys_email, 'NeuroSync Genesis', 'approved'),
    ('Archive Initialization', 'Class 10', 'Hindi', 'Neural mapping for Class 10 Hindi archive.', sys_user_id, sys_email, 'NeuroSync Genesis', 'approved'),
    ('Archive Initialization', 'Class 10', 'Computer Science', 'Neural mapping for Class 10 Computer Science archive.', sys_user_id, sys_email, 'NeuroSync Genesis', 'approved'),

    -- Class 11
    ('Archive Initialization', 'Class 11', 'Physics', 'Neural mapping for Class 11 Physics archive.', sys_user_id, sys_email, 'NeuroSync Genesis', 'approved'),
    ('Archive Initialization', 'Class 11', 'Chemistry', 'Neural mapping for Class 11 Chemistry archive.', sys_user_id, sys_email, 'NeuroSync Genesis', 'approved'),
    ('Archive Initialization', 'Class 11', 'Mathematics', 'Neural mapping for Class 11 Mathematics archive.', sys_user_id, sys_email, 'NeuroSync Genesis', 'approved'),
    ('Archive Initialization', 'Class 11', 'Biology', 'Neural mapping for Class 11 Biology archive.', sys_user_id, sys_email, 'NeuroSync Genesis', 'approved'),
    ('Archive Initialization', 'Class 11', 'English', 'Neural mapping for Class 11 English archive.', sys_user_id, sys_email, 'NeuroSync Genesis', 'approved'),
    ('Archive Initialization', 'Class 11', 'Accountancy', 'Neural mapping for Class 11 Accountancy archive.', sys_user_id, sys_email, 'NeuroSync Genesis', 'approved'),
    ('Archive Initialization', 'Class 11', 'Business Studies', 'Neural mapping for Class 11 Business Studies archive.', sys_user_id, sys_email, 'NeuroSync Genesis', 'approved'),
    ('Archive Initialization', 'Class 11', 'Economics', 'Neural mapping for Class 11 Economics archive.', sys_user_id, sys_email, 'NeuroSync Genesis', 'approved'),
    ('Archive Initialization', 'Class 11', 'History', 'Neural mapping for Class 11 History archive.', sys_user_id, sys_email, 'NeuroSync Genesis', 'approved'),
    ('Archive Initialization', 'Class 11', 'Geography', 'Neural mapping for Class 11 Geography archive.', sys_user_id, sys_email, 'NeuroSync Genesis', 'approved'),
    ('Archive Initialization', 'Class 11', 'Political Science', 'Neural mapping for Class 11 Political Science archive.', sys_user_id, sys_email, 'NeuroSync Genesis', 'approved'),

    -- Class 12
    ('Archive Initialization', 'Class 12', 'Physics', 'Neural mapping for Class 12 Physics archive.', sys_user_id, sys_email, 'NeuroSync Genesis', 'approved'),
    ('Archive Initialization', 'Class 12', 'Chemistry', 'Neural mapping for Class 12 Chemistry archive.', sys_user_id, sys_email, 'NeuroSync Genesis', 'approved'),
    ('Archive Initialization', 'Class 12', 'Mathematics', 'Neural mapping for Class 12 Mathematics archive.', sys_user_id, sys_email, 'NeuroSync Genesis', 'approved'),
    ('Archive Initialization', 'Class 12', 'Biology', 'Neural mapping for Class 12 Biology archive.', sys_user_id, sys_email, 'NeuroSync Genesis', 'approved'),
    ('Archive Initialization', 'Class 12', 'English', 'Neural mapping for Class 12 English archive.', sys_user_id, sys_email, 'NeuroSync Genesis', 'approved'),
    ('Archive Initialization', 'Class 12', 'Accountancy', 'Neural mapping for Class 12 Accountancy archive.', sys_user_id, sys_email, 'NeuroSync Genesis', 'approved'),
    ('Archive Initialization', 'Class 12', 'Business Studies', 'Neural mapping for Class 12 Business Studies archive.', sys_user_id, sys_email, 'NeuroSync Genesis', 'approved'),
    ('Archive Initialization', 'Class 12', 'Economics', 'Neural mapping for Class 12 Economics archive.', sys_user_id, sys_email, 'NeuroSync Genesis', 'approved'),
    ('Archive Initialization', 'Class 12', 'History', 'Neural mapping for Class 12 History archive.', sys_user_id, sys_email, 'NeuroSync Genesis', 'approved'),
    ('Archive Initialization', 'Class 12', 'Geography', 'Neural mapping for Class 12 Geography archive.', sys_user_id, sys_email, 'NeuroSync Genesis', 'approved'),
    ('Archive Initialization', 'Class 12', 'Political Science', 'Neural mapping for Class 12 Political Science archive.', sys_user_id, sys_email, 'NeuroSync Genesis', 'approved')
    ON CONFLICT DO NOTHING;

    RAISE NOTICE 'Genesis Nodes inserted successfully using User ID: %', sys_user_id;

END $$;
