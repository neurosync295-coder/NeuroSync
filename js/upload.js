import { supabase } from './supabase.js';

export function initUploadPage() {
    const form = document.getElementById('upload-form');
    const fileInput = document.getElementById('file-upload');
    const dropzoneUi = document.getElementById('dropzone-ui');
    const dropzoneText = document.getElementById('dropzone-text');
    const fileSelectedUi = document.getElementById('file-selected-ui');
    const fileNameDisplay = document.getElementById('fileNameDisplay') || document.getElementById('file-name-display');
    const fileSizeDisplay = document.getElementById('fileSizeDisplay') || document.getElementById('file-size-display');
    const removeFileBtn = document.getElementById('remove-file-btn');

    const submitBtn = document.getElementById('submit-btn');
    const progressContainer = document.getElementById('progress-container');
    const progressBar = document.getElementById('progress-bar');
    const progressPercent = document.getElementById('progress-percent');
    const statusText = document.getElementById('status-text');

    const successScreen = document.getElementById('success-screen');
    const uploadAnotherBtn = document.getElementById('upload-another-btn');
    const mainFormContainer = form.parentElement;

    let selectedFile = null;

    function updateProgress(percent, status) {
        if (progressContainer) progressContainer.classList.remove('hidden');
        if (progressBar) progressBar.style.width = `${percent}%`;
        if (progressPercent) progressPercent.textContent = `${percent}%`;
        if (statusText) statusText.textContent = status;
    }

    // --- Drag and Drop Handlers ---
    // (Existing handlers remain the same...)
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropzoneUi.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) { e.preventDefault(); e.stopPropagation(); }

    ['dragenter', 'dragover'].forEach(eventName => { dropzoneUi.addEventListener(eventName, () => dropzoneUi.classList.add('border-accent', 'bg-accent/5'), false); });
    ['dragleave', 'drop'].forEach(eventName => { dropzoneUi.addEventListener(eventName, () => dropzoneUi.classList.remove('border-accent', 'bg-accent/5'), false); });

    dropzoneUi.addEventListener('drop', (e) => handleFiles(e.dataTransfer.files), false);
    fileInput.addEventListener('change', function () { handleFiles(this.files); });

    function handleFiles(files) {
        if (files.length === 0) return;
        const file = files[0];
        if (file.type !== 'application/pdf') { alert("Error: PDF ONLY."); return; }
        if (file.size > 10 * 1024 * 1024) { alert("Error: 10MB LIMIT."); return; }

        selectedFile = file;
        dropzoneUi.classList.add('hidden');
        fileSelectedUi.classList.remove('hidden');
        fileNameDisplay.textContent = file.name;
        fileSizeDisplay.textContent = (file.size / 1024).toFixed(1) + " KB";
    }

    removeFileBtn.addEventListener('click', () => {
        selectedFile = null;
        fileInput.value = '';
        fileSelectedUi.classList.add('hidden');
        dropzoneUi.classList.remove('hidden');
    });

    // --- Form Submission ---

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!selectedFile) return;

        const formData = {
            title: document.getElementById('title').value,
            chapter: document.getElementById('chapter').value,
            classLevel: document.getElementById('class_level').value,
            subject: document.getElementById('subject').value,
            description: document.getElementById('description').value,
            credit: document.getElementById('credit').value
        };

        submitBtn.disabled = true;
        submitBtn.querySelector('span').textContent = "Executing...";
        updateProgress(5, "Initializing Handshake...");

        try {
            // 1. Session Check
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error("Connection Lost. Please re-authenticate.");

            const user = session.user;
            updateProgress(20, "Authenticating Profile...");

            const { data: profile } = await supabase.from('profiles').select('first_name, last_name').eq('id', user.id).single();
            const uploaderName = profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : user.email.split('@')[0];

            // 2. Storage Upload
            updateProgress(40, "Transmitting PDF to Secure Hive...");
            const fileExt = selectedFile.name.split('.').pop();
            const fileName = `${user.id}/${Date.now()}_${selectedFile.name.replace(/[^a-z0-9]/gi, '_')}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('study-library')
                .upload(fileName, selectedFile);

            if (uploadError) throw new Error(`Storage Breach: ${uploadError.message}`);

            // 3. Metadata Sync
            updateProgress(75, "Synchronizing Metadata...");

            // Get Public URL for the file_url column
            const { data: { publicUrl } } = supabase.storage.from('study-library').getPublicUrl(fileName);

            const { error: dbError } = await supabase
                .from('study_materials')
                .insert([{
                    title: formData.title,
                    chapter_name: formData.chapter,
                    class_level: formData.classLevel,
                    subject: formData.subject,
                    description: formData.description,
                    credit_author: formData.credit,
                    file_path: fileName,
                    file_url: publicUrl,
                    file_size_bytes: selectedFile.size,
                    file_type: selectedFile.type,
                    uploader_id: user.id,
                    uploader_email: user.email,
                    uploader_name: uploaderName
                }]);

            if (dbError) {
                // Rollback storage
                await supabase.storage.from('study-library').remove([fileName]);
                throw new Error(`Database Rejection: ${dbError.message} (Code: ${dbError.code})`);
            }

            // 4. Rewards
            updateProgress(90, "Registering submission...");
            // XP is now awarded upon admin APPROVAL in admin-dashboard.js
            // This prevents reward spam and incentivizes quality content.
            console.log("[Upload] Material submitted. Reward pending admin validation.");

            updateProgress(100, "Protocol Success.");
            setTimeout(() => {
                form.classList.add('hidden');
                successScreen.classList.remove('hidden');
            }, 500);

        } catch (err) {
            console.error(err);
            alert(err.message);
            submitBtn.disabled = false;
            const btnSpan = submitBtn.querySelector('span');
            btnSpan.innerHTML = '';
            const icon = document.createElement('span');
            icon.className = 'material-symbols-outlined';
            icon.textContent = 'publish';
            btnSpan.appendChild(icon);
            btnSpan.appendChild(document.createTextNode(' Execute Upload'));
            if (progressContainer) progressContainer.classList.add('hidden');
        }
    });

    // Setup "Upload Another" button
    uploadAnotherBtn.addEventListener('click', () => {
        form.reset();

        // Reset File state
        selectedFile = null;
        fileInput.value = '';
        fileSelectedUi.classList.add('hidden');
        dropzoneUi.classList.remove('hidden');

        submitBtn.disabled = false;
        submitBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        const btnSpan = submitBtn.querySelector('span');
        btnSpan.innerHTML = '';
        const icon = document.createElement('span');
        icon.className = 'material-symbols-outlined';
        icon.textContent = 'publish';
        btnSpan.appendChild(icon);
        btnSpan.appendChild(document.createTextNode(' Execute Upload'));
        if (progressContainer) progressContainer.classList.add('hidden');

        // Swap UI
        successScreen.classList.add('hidden');
        form.classList.remove('hidden');
    });
}
