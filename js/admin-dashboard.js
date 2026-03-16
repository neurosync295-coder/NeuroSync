import { supabase } from './supabase.js';

// --- Global State ---
let pendingMaterials = [];
let allFeedbacks = [];
let activeTab = 'materials';
let currentProcessingId = null;

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    loadMaterials();
    loadFeedbacks();
    setupFilters();
    setupRealtime();
});

// --- Real-time Updates ---
function setupRealtime() {
    supabase
        .channel('admin-ops')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'study_materials' }, (payload) => {
            console.log('New Material Received:', payload.new);
            alert('NEW_SUBMISSION_DETECTED: ' + payload.new.title);
            loadMaterials();
        })
        .subscribe();
}

// --- Navigation ---
window.switchTab = (tab) => {
    activeTab = tab;
    document.querySelectorAll('.tab-btn').forEach(b => {
        b.classList.remove('text-orange-500', 'border-orange-500', 'bg-orange-500/5');
        b.classList.add('text-zinc-500', 'border-transparent');
    });
    const activeBtn = document.getElementById(`tab-${tab}`);
    activeBtn.classList.remove('text-zinc-500', 'border-transparent');
    activeBtn.classList.add('text-orange-500', 'border-orange-500', 'bg-orange-500/5');
    
    document.getElementById('section-materials').classList.add('hidden');
    document.getElementById('section-feedback').classList.add('hidden');
    document.getElementById(`section-${tab}`).classList.remove('hidden');
};

// --- Data Fetching ---
async function loadMaterials() {
    const tbody = document.getElementById('materials-tbody');
    tbody.innerHTML = '<tr><td colspan="6" class="text-center font-mono opacity-50 py-10">RETRIEVING_DATA...</td></tr>';

    const { data, error } = await supabase
        .from('study_materials')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Supabase Error:', error);
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-red-500 py-10">ERROR: DATA_FETCH_FAILED</td></tr>';
        return;
    }

    pendingMaterials = data || [];
    renderMaterials();
}

async function loadFeedbacks() {
    const { data, error } = await supabase
        .from('feedback')
        .select('*')
        .order('created_at', { ascending: false });

    if (!error) {
        allFeedbacks = data || [];
        renderFeedbacks();
    }
}

// --- Rendering ---
function renderMaterials() {
    const tbody = document.getElementById('materials-tbody');
    const searchTerm = document.getElementById('search-materials').value.toLowerCase();
    const statusFilter = document.getElementById('filter-status').value;

    const filtered = pendingMaterials.filter(m => {
        const matchesSearch = m.title.toLowerCase().includes(searchTerm) || m.uploader_name?.toLowerCase().includes(searchTerm);
        const matchesStatus = statusFilter === 'all' || m.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center font-mono opacity-30 py-10">NO_MATCHING_RECORDS</td></tr>';
        return;
    }

    tbody.innerHTML = filtered.map(m => `
        <tr class="hover:bg-white/[0.02]">
            <td class="px-4 py-4 text-sm border-b border-zinc-800/50">
                <div class="font-bold text-white">${m.subject || 'UNTITLED_SUB'}</div>
                <div class="text-[11px] text-zinc-500 font-mono">${m.title}</div>
            </td>
            <td class="px-4 py-4 text-sm border-b border-zinc-800/50">
                <div class="text-[11px] text-zinc-300 font-bold">${m.uploader_name || 'GUEST_USER'}</div>
                <div class="text-[9px] text-zinc-600 font-mono">${m.uploader_email || 'SECURE_CHANNEL'}</div>
            </td>
            <td class="px-4 py-4 border-b border-zinc-800/50 text-zinc-500 font-mono text-[10px]">${new Date(m.created_at).toLocaleDateString()}</td>
            <td class="px-4 py-4 border-b border-zinc-800/50">
                <div class="flex flex-wrap gap-1">
                    <span class="px-2 py-0.5 rounded-none text-[9px] font-black uppercase tracking-tighter bg-zinc-800 text-zinc-400">${m.class_level || 'N/A'}</span>
                    <span class="px-2 py-0.5 rounded-none text-[9px] font-black uppercase tracking-tighter bg-zinc-800 text-zinc-400">${m.file_type?.split('/')[1]?.toUpperCase() || 'RAW'}</span>
                </div>
            </td>
            <td class="px-4 py-4 border-b border-zinc-800/50">
                <span class="px-2 py-0.5 rounded-none text-[9px] font-black uppercase tracking-tighter ${
                    m.status === 'approved' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 
                    m.status === 'rejected' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 
                    'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
                }">${m.status || 'pending'}</span>
            </td>
            <td class="px-4 py-4 border-b border-zinc-800/50 text-right">
                <div class="flex justify-end gap-2">
                    <button onclick="window.previewMaterial('${m.file_url}')" class="p-2 border border-zinc-800 hover:border-blue-500 text-zinc-500 hover:text-blue-500 transition-colors" title="Preview PDF">
                        <span class="material-symbols-outlined text-sm">visibility</span>
                    </button>
                    <button onclick="window.downloadMaterial('${m.file_url}', '${m.title}')" class="p-2 border border-zinc-800 hover:border-zinc-400 text-zinc-500 hover:text-white transition-colors" title="Download PDF">
                        <span class="material-symbols-outlined text-sm">download</span>
                    </button>
                    <button onclick="window.showEditModal('${m.id}')" class="p-2 border border-zinc-800 hover:border-zinc-400 text-zinc-500 hover:text-white transition-colors" title="Edit Metadata">
                        <span class="material-symbols-outlined text-sm">edit_note</span>
                    </button>
                    ${(!m.status || m.status === 'pending') ? `
                        <button onclick="window.showApprovalModal('${m.id}')" class="p-2 border border-zinc-800 hover:border-green-500 text-zinc-500 hover:text-green-500 transition-colors" title="Approve & Categorize">
                            <span class="material-symbols-outlined text-sm">check</span>
                        </button>
                        <button onclick="window.showRejectionModal('${m.id}')" class="p-2 border border-zinc-800 hover:border-red-500 text-zinc-500 hover:text-red-500 transition-colors" title="Reject">
                            <span class="material-symbols-outlined text-sm">close</span>
                        </button>
                    ` : `
                        <button onclick="window.showApprovalModal('${m.id}')" class="p-2 border border-zinc-800 hover:border-orange-500 text-zinc-500 hover:text-orange-500 transition-colors" title="Edit Category">
                            <span class="material-symbols-outlined text-sm">edit</span>
                        </button>
                    `}
                </div>
            </td>
        </tr>
    `).join('');
}

function renderFeedbacks() {
    const tbody = document.getElementById('feedback-tbody');
    tbody.innerHTML = allFeedbacks.map(f => `
        <tr class="hover:bg-white/[0.02]">
            <td class="px-4 py-4 text-sm border-b border-zinc-800/50 font-bold text-white">${f.user_name || 'Anonymous'}</td>
            <td class="px-4 py-4 border-b border-zinc-800/50 text-[11px] text-zinc-500 font-mono">${f.user_email || 'N/A'}</td>
            <td class="px-4 py-4 border-b border-zinc-800/50 text-zinc-300 text-xs">${f.message}</td>
            <td class="px-4 py-4 border-b border-zinc-800/50 text-zinc-600 font-mono text-[10px]">${new Date(f.created_at).toLocaleDateString()}</td>
            <td class="px-4 py-4 border-b border-zinc-800/50">
                <span class="px-2 py-0.5 rounded-none text-[9px] font-black uppercase tracking-tighter ${
                    f.status === 'resolved' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
                }">${f.status || 'pending'}</span>
            </td>
            <td class="px-4 py-4 border-b border-zinc-800/50 text-right">
                ${f.status !== 'resolved' ? `
                    <button onclick="window.resolveFeedback('${f.id}')" class="p-2 border border-zinc-800 hover:border-green-500 text-zinc-500 hover:text-green-500 transition-colors" title="Mark as Resolved">
                        <span class="material-symbols-outlined text-sm">check_circle</span>
                    </button>
                ` : '<span class="text-[9px] text-zinc-600 font-mono uppercase tracking-tighter">RESOLVED</span>'}
            </td>
        </tr>
    `).join('');
}

window.resolveFeedback = async (id) => {
    const feedback = allFeedbacks.find(f => f.id === id);
    if (!feedback) return;

    try {
        // 1. Update Status
        const { error: updateError } = await supabase
            .from('feedbacks')
            .update({ status: 'resolved' })
            .eq('id', id);

        if (updateError) throw updateError;

        // 2. Notify User (if user_id exists)
        if (feedback.user_id) {
            await supabase.from('notifications').insert([{
                user_id: feedback.user_id,
                message: `Your feedback regarding "${feedback.message.substring(0, 20)}..." has been resolved by the admin.`,
                type: 'feedback_resolved',
                data: { feedback_id: id }
            }]);
        }

        alert('Feedback marked as RESOLVED. User notified.');
        loadFeedbacks(); // Refresh list
    } catch (err) {
        console.error(err);
        alert('Action Failed: ' + err.message);
    }
};

// --- Material Actions ---
window.previewMaterial = (url) => {
    if (url) window.open(url, '_blank');
};

window.downloadMaterial = (url, filename) => {
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'document.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
};

window.showEditModal = (id) => {
    currentProcessingId = id;
    const m = pendingMaterials.find(m => m.id === id);
    if (!m) return;

    document.getElementById('edit-material-id').textContent = `ID: ${m.id}`;
    document.getElementById('edit-title').value = m.title || '';
    document.getElementById('edit-description').value = m.description || '';
    document.getElementById('edit-class').value = m.class_level || '';
    document.getElementById('edit-subject').value = m.subject || '';
    document.getElementById('edit-type').value = m.material_type || 'Notes';

    document.getElementById('edit-modal').classList.add('active');
};

window.closeEditModal = () => {
    document.getElementById('edit-modal').classList.remove('active');
};

document.getElementById('edit-metadata-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentProcessingId) return;

    const updates = {
        title: document.getElementById('edit-title').value,
        description: document.getElementById('edit-description').value,
        class_level: document.getElementById('edit-class').value,
        subject: document.getElementById('edit-subject').value,
        material_type: document.getElementById('edit-type').value
    };

    try {
        const { error } = await supabase
            .from('study_materials')
            .update(updates)
            .eq('id', currentProcessingId);

        if (error) throw error;

        closeEditModal();
        loadMaterials();
        alert('Registry Updated Successfully.');
    } catch (err) {
        console.error(err);
        alert('Update Failed: ' + err.message);
    }
});

window.showApprovalModal = (id) => {
    currentProcessingId = id;
    const m = pendingMaterials.find(m => m.id === id);
    
    // Populate defaults in modal with normalization
    let displayClass = m.class_level || 'Select Class';
    let valClass = m.class_level || '';
    
    // Normalize "10th" -> "Class 10"
    if (valClass && valClass.endsWith('th')) {
        valClass = `Class ${valClass.replace('th', '')}`;
        displayClass = valClass;
    }

    const classSelect = document.getElementById('modal-class');
    classSelect.innerHTML = `<option value="${valClass}">${displayClass}</option>
                             <option value="Class 9">Class 9</option>
                             <option value="Class 10">Class 10</option>
                             <option value="Class 11">Class 11</option>
                             <option value="Class 12">Class 12</option>`;
                             
    const subSelect = document.getElementById('modal-subject');
    subSelect.innerHTML = `<option value="${m.subject}">${m.subject || 'Select Subject'}</option>
                           <option value="Mathematics">Mathematics</option>
                           <option value="Science">Science</option>
                           <option value="English">English</option>
                           <option value="Hindi">Hindi</option>`;
    
    document.getElementById('approval-modal').classList.add('active');
};

window.closeModal = () => {
    document.getElementById('approval-modal').classList.remove('active');
};

async function reorganizeStorage(material, classLevel, subject, type) {
    const oldPath = material.file_path;
    
    if (!oldPath) {
        throw new Error("REGISTRY_ERROR: No file_path found in the database for this record.");
    }

    const fileExt = oldPath.split('.').pop() || 'pdf';
    const safeTitle = material.title.replace(/[^a-z0-9]/gi, '_');
    const uniqueSuffix = Date.now().toString().slice(-6);
    const newPath = `${classLevel}/${subject}/${type}/${safeTitle}_${uniqueSuffix}.${fileExt}`;

    console.log(`[DIAGNOSTICS] Attempting Storage Move:`);
    console.log(`- Bucket: study-library`);
    console.log(`- Source: ${oldPath}`);
    console.log(`- Destination: ${newPath}`);

    // 1. Verify source exists before copying
    const { data: files, error: listError } = await supabase.storage
        .from('study-library')
        .list(oldPath.split('/').slice(0, -1).join('/'), {
            search: oldPath.split('/').pop()
        });

    if (listError || !files || files.length === 0) {
        throw new Error(`SOURCE_OBJECT_MISSING: The file at '${oldPath}' was not found in the 'study-library' bucket. Please verify the file still exists in your Supabase Storage dashboard.`);
    }

    // 2. Move file in Storage (Copy + Remove)
    const { error: moveError } = await supabase.storage
        .from('study-library')
        .copy(oldPath, newPath);

    if (moveError) {
        if (moveError.message.includes('row-level security')) {
            throw new Error(`STORAGE_RLS_VIOLATION: Permission denied. Ensure your policies allow INSERT/DELETE on the 'study-library' bucket.`);
        }
        throw new Error(`Storage Copy Failed: ${moveError.message} (From: ${oldPath} To: ${newPath})`);
    }

    // 3. Remove old file
    const { error: removeError } = await supabase.storage.from('study-library').remove([oldPath]);
    if (removeError) console.warn("CLEANUP_WARNING: Moved file successfully but failed to delete original.", removeError);

    // 4. Get new Public URL
    const { data: { publicUrl } } = supabase.storage.from('study-library').getPublicUrl(newPath);

    return { newPath, publicUrl };
}

// Handle Approval Form
document.getElementById('approval-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentProcessingId) return;

    const classLevel = document.getElementById('modal-class').value;
    const subject = document.getElementById('modal-subject').value;
    const type = document.getElementById('modal-type').value;

    const material = pendingMaterials.find(m => m.id === currentProcessingId);

    try {
        // 1. Reorganize Storage
        const { newPath, publicUrl } = await reorganizeStorage(material, classLevel, subject, type);

        // 2. Update Material Status & Metadata
        const { error: updateError } = await supabase
            .from('study_materials')
            .update({ 
                status: 'approved',
                class_level: classLevel,
                subject: subject,
                material_type: type,
                file_path: newPath,
                file_url: publicUrl
            })
            .eq('id', currentProcessingId);

        if (updateError) throw updateError;

        // 3. Notify User
        const notificationMsg = `Your submitted PDF "${material.title}" has been approved and added to the Study Library.`;
        const { error: notifError } = await supabase.from('notifications').insert([{
            user_id: material.uploader_id,
            message: notificationMsg,
            type: 'approval',
            data: { material_id: material.id }
        }]);

        if (notifError) console.warn('[Notifications] Approval alert failed:', notifError);
        
        // 4. Reward XP (10 points for approved content)
        try {
            const { updateRewards } = await import('./rewards.js');
            await updateRewards(material.uploader_id, 10);
            console.log(`[Rewards] 10 XP awarded to ${material.uploader_id} for approved material.`);
        } catch (rErr) {
            console.warn('[Rewards] XP sync failed:', rErr);
        }

        closeModal();
        loadMaterials();
        alert('Material SYNCED to Hive. User notified.');
    } catch (err) {
        console.error(err);
        alert('Approval Workflow Failure: ' + err.message);
    }
});

// Rejection Logic
window.showRejectionModal = (id) => {
    currentProcessingId = id;
    document.getElementById('rejection-modal').classList.add('active');
};

window.closeRejectionModal = () => {
    document.getElementById('rejection-modal').classList.remove('active');
};

document.getElementById('confirm-reject-btn').addEventListener('click', async () => {
    if (!currentProcessingId) return;

    const material = pendingMaterials.find(m => m.id === currentProcessingId);

    // 1. Update Status
    const { error: updateError } = await supabase
        .from('study_materials')
        .update({ status: 'rejected' })
        .eq('id', currentProcessingId);

    if (updateError) {
        alert('Rejection Failed: ' + updateError.message);
        return;
    }

    // 2. Notify User
    const notificationMsg = `Your submitted PDF "${material.title}" has been rejected by the admin.`;
    const { error: notifError } = await supabase.from('notifications').insert([{
        user_id: material.uploader_id,
        message: notificationMsg,
        type: 'rejection'
    }]);

    if (notifError) console.warn('[Notifications] Rejection alert failed:', notifError);

    closeRejectionModal();
    loadMaterials();
    alert('Material REJECTED. User notified.');
});

// --- Dynamic Helpers ---
window.promptNew = (category) => {
    const newVal = prompt(`Enter new ${category} name:`);
    if (!newVal) return;
    
    const select = document.getElementById(`modal-${category}`);
    const opt = document.createElement('option');
    opt.value = newVal;
    opt.textContent = newVal;
    opt.selected = true;
    select.appendChild(opt);
};

function setupFilters() {
    document.getElementById('search-materials').addEventListener('input', renderMaterials);
    document.getElementById('filter-status').addEventListener('change', renderMaterials);
}
