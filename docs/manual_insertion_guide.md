# Manual PDF Insertion Guide (Supabase Dashboard)

If you want to add PDFs directly through the Supabase Dashboard without using the NeuroSync Admin Panel, follow these two steps:

## Step 1: Upload to Storage
1.  Go to **Storage** > `study-library` bucket.
2.  Create or navigate to the following path: `[Class]/[Subject]/[Type]/`
    *   *Example:* `Class 10/Mathematics/Notes/`
3.  Upload your PDF file.
4.  Once uploaded, click on the file and click **"Get Public URL"**. Copy this URL.
5.  Also, note the **Storage Path** (e.g., `Class 10/Mathematics/Notes/geometry_guide.pdf`).

---

## Step 2: Register in Database
Go to the **SQL Editor** and run the following script (replace the values in the `VALUES` section):

```sql
DO $$
DECLARE
    sys_user_id UUID;
    sys_email TEXT;
BEGIN
    -- Get your Admin User ID
    SELECT id, email INTO sys_user_id, sys_email FROM auth.users LIMIT 1;

    INSERT INTO public.study_materials (
        title, 
        class_level, 
        subject, 
        material_type, 
        description, 
        file_path, 
        file_url, 
        uploader_id, 
        uploader_email, 
        status
    )
    VALUES (
        'Geometry Mastery Guide',           -- Title of the PDF
        'Class 10',                         -- MUST match "Class 9", "Class 10", etc.
        'Mathematics',                      -- Subject Name
        'Notes',                            -- "Notes", "PYQ", "Syllabus", etc.
        'Comprehensive guide to Geometry', -- Short description
        'Class 10/Math/geo_guide.pdf',      -- The Storage Path from Step 1
        'https://...',                       -- The Public URL from Step 1
        sys_user_id, 
        sys_email, 
        'approved'                          -- MUST be 'approved' to show in Library
    );
END $$;
```

### 💡 Pro Tip:
Make sure your `class_level` exactly matches the standard format (e.g., **Class 10**) otherwise it won't appear on the student's dashboard.
