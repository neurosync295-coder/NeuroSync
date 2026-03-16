-- Enable RLS on study_materials if not already enabled
ALTER TABLE public.study_materials ENABLE ROW LEVEL SECURITY;

-- Drop existing select policies to avoid conflicts
DROP POLICY IF EXISTS "Anyone can view approved materials" ON public.study_materials;
DROP POLICY IF EXISTS "Allow public select on approved" ON public.study_materials;

-- Create policy for public viewing of approved materials
-- This allows both 'anon' and 'authenticated' roles to see APPROVED content
CREATE POLICY "Allow public select on approved" ON public.study_materials
    FOR SELECT USING (status = 'approved');

-- Ensure permissions are granted
GRANT SELECT ON public.study_materials TO anon;
GRANT SELECT ON public.study_materials TO authenticated;

-- Data Standardisation migration
UPDATE public.study_materials SET class_level = 'Class 9' WHERE class_level = '9th';
UPDATE public.study_materials SET class_level = 'Class 10' WHERE class_level = '10th' OR class_level = '10';
UPDATE public.study_materials SET class_level = 'Class 11' WHERE class_level = '11th' OR class_level = '11';
UPDATE public.study_materials SET class_level = 'Class 12' WHERE class_level = '12th' OR class_level = '12';

-- Optional: Performance Indexes
CREATE INDEX IF NOT EXISTS idx_materials_class_subject_status ON public.study_materials(class_level, subject, status);
