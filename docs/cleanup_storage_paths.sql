-- NeuroSync Storage Standardisation: Data Cleanup
-- Run this script to ensure all existing records point to the correct paths
-- and use the standardized 'study-library' bucket format.

-- 1. Remove redundant 'study-library/' prefix from file_path if it exists
-- (This was being added by a previous version of the admin dashboard)
UPDATE public.study_materials 
SET file_path = REPLACE(file_path, 'study-library/', '')
WHERE file_path LIKE 'study-library/%';

-- 2. Verify all approved materials have expected class/subject structure
-- (Optional check)
SELECT id, title, file_path, class_level FROM public.study_materials WHERE status = 'approved' LIMIT 10;
