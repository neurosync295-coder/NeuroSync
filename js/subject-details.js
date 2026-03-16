import { supabase } from './supabase.js';

// Materials structure will be loaded dynamically from JSON files
let materialsStructure = {};

// Initialize subject details functionality
export async function initSubjectDetails() {
  const urlParams = new URLSearchParams(window.location.search);
  const subject = urlParams.get('subject');
  const userClass = urlParams.get('class') || "Class 10";

  if (!subject) {
    showNotification('No subject specified.', 'error');
    return;
  }

  const titleEl = document.getElementById('subject-title');
  if (titleEl) {
    titleEl.innerHTML = '';
    const subjectText = document.createTextNode(subject + ' ');
    const br = document.createElement('br');
    const archivesSpan = document.createElement('span');
    archivesSpan.className = 'not-italic text-white';
    archivesSpan.textContent = ' Archives.';

    titleEl.appendChild(subjectText);
    titleEl.appendChild(br);
    titleEl.appendChild(archivesSpan);
  }

  // Update vector ID for flavor
  const vectorEl = document.getElementById('vector-id');
  if (vectorEl) {
    vectorEl.textContent = `0x${Math.floor(Math.random() * 0xFFF).toString(16).toUpperCase().padStart(3, '0')}`;
  }

  // Wait for auth session to be ready
  const { data: { session } } = await supabase.auth.getSession();

  loadSubjectDetails(subject, userClass, session?.user);
}

// Load and display subject details
export async function loadSubjectDetails(subject, userClass, user) {
  try {
    showLoadingSpinner('#files-container');

    // Fetch dynamic data from Supabase
    const classVariants = [userClass];
    if (userClass.toString().startsWith('Class ')) {
        classVariants.push(userClass.replace('Class ', '') + 'th');
    }

    const { data: approvedFiles, error } = await supabase
        .from('study_materials')
        .select('*')
        .eq('status', 'approved')
        .in('class_level', classVariants)
        .eq('subject', subject);

    if (error) throw error;

    // Group by material_type to build the legacy materialsStructure-like object
    const types = {};
    (approvedFiles || []).forEach(f => {
        const type = f.material_type || 'General';
        if (!types[type]) types[type] = [];
        types[type].push(f);
    });

    materialsStructure[userClass] = { [subject]: types };
    displaySubjectFiles(subject, userClass, user);

  } catch (error) {
    console.error('Error loading subject details:', error);
    showNotification('Neural Archive Sync Failed.', 'error');
  }
}

// Display subject files
function displaySubjectFiles(subject, userClass, user) {
  const container = document.getElementById('files-container');
  if (!container) return;

  const classData = materialsStructure[userClass];
  if (!classData || !classData[subject]) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'col-span-full border-4 border-white p-20 text-left bg-black';

    const h3 = document.createElement('h3');
    h3.className = 'text-6xl serif-display italic text-white mb-6';
    h3.textContent = 'Archive_Empty.';

    const p = document.createElement('p');
    p.className = 'text-[10px] text-red-500 font-black uppercase tracking-[0.4em]';
    p.textContent = 'ERR_0x404 // SUBJECT_DATA_NOT_FOUND';

    errorDiv.appendChild(h3);
    errorDiv.appendChild(p);
    container.appendChild(errorDiv);
    return;
  }

  const subjectData = classData[subject];
  const subKeys = Object.keys(subjectData);
  let totalFiles = 0;
  let sectionsHTML = '';

  // Count total files and build sections
  container.innerHTML = '';
  subKeys.forEach((sub, subIdx) => {
    const subData = subjectData[sub];
    let subFileCount = 0;
    const sectionFiles = [];

    if (Array.isArray(subData)) {
      subFileCount = subData.length;
      totalFiles += subFileCount;
      subData.forEach((file, fileIdx) => {
        sectionFiles.push({ type: 'file', content: generateFileCard(file, userClass, subject, sub, null, fileIdx, user) });
      });
    } else {
      // Nested folders
      Object.keys(subData).forEach(subSub => {
        const subSubData = subData[subSub];
        if (Array.isArray(subSubData)) {
          subFileCount += subSubData.length;
          totalFiles += subSubData.length;
          sectionFiles.push({ type: 'header', text: `Sub_Vector // ${subSub}`, count: subSubData.length });
          subSubData.forEach((file, fileIdx) => {
            sectionFiles.push({ type: 'file', content: generateFileCard(file, userClass, subject, sub, subSub, fileIdx, user) });
          });
        }
      });
    }

    const sectionDiv = document.createElement('div');
    sectionDiv.className = 'folder-section group/folder';
    sectionDiv.setAttribute('data-folder', sub);

    const btn = document.createElement('button');
    btn.onclick = () => window.toggleFolder(btn);
    btn.className = 'w-full flex flex-col lg:flex-row items-end justify-between mb-12 gap-12 text-left hover:bg-white/5 p-4 -m-4 transition-all duration-300';

    btn.innerHTML = `
        <div class="flex-1">
            <div class="flex items-center gap-4 mb-6">
                <span class="text-[9px] font-black font-mono text-white/20 tracking-[0.4em]">FRAGMENT_0${subIdx + 1}</span>
                <span class="h-px w-12 bg-white/10"></span>
                <span class="text-red-500 font-black tracking-[0.5em] uppercase text-[9px] italic">CHAPTER_ARCHIVE</span>
            </div>
            <div class="flex items-center gap-6">
                <span class="text-4xl serif-display text-red-600 transition-transform duration-300 group-[.is-open]/folder:rotate-45">+</span>
                <h4 class="text-5xl lg:text-6xl serif-display leading-none text-white italic">${sub.replace(/</g, '&lt;')}</h4>
            </div>
        </div>
        <div class="text-right border-r border-white/10 pr-8">
            <div class="text-[9px] font-black uppercase tracking-widest text-white/30 mb-2">Logs_Count</div>
            <div class="text-xs font-bold font-mono text-white tracking-widest uppercase">${subFileCount} NODES</div>
        </div>
    `;

    const grid = document.createElement('div');
    grid.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-24 gap-x-12 file-grid hidden pt-12';

    sectionFiles.forEach(item => {
      if (item.type === 'file') {
        const temp = document.createElement('div');
        temp.innerHTML = item.content;
        grid.appendChild(temp.firstElementChild);
      } else {
        const header = document.createElement('div');
        header.className = 'col-span-full pt-12 mt-12 border-t border-white/5 flex items-center justify-between';
        header.innerHTML = `
            <span class="text-[10px] font-black tracking-[0.4em] text-white/20 uppercase font-mono italic"></span>
            <span class="h-px flex-1 mx-8 bg-white/5"></span>
            <span class="text-[9px] font-black text-red-500 font-mono tracking-widest"></span>
        `;
        header.querySelector('span:first-child').textContent = item.text;
        header.querySelector('span:last-child').textContent = `${item.count} FILES`;
        grid.appendChild(header);
      }
    });

    sectionDiv.appendChild(btn);
    sectionDiv.appendChild(grid);
    container.appendChild(sectionDiv);
  });

  // Update file count in header
  const countEl = document.getElementById('file-count');
  if (countEl) {
      countEl.textContent = `${totalFiles} NODES_SYNCED`;
  }

  // Search Logic
  setupSearch(container);

  // View Toggle Logic
  setupViewToggle(container);
}

// Toggle folder expansion
export function toggleFolder(headerBtn) {
  const section = headerBtn.closest('.folder-section');
  const grid = section.querySelector('.file-grid');
  const isOpen = section.classList.toggle('is-open');

  if (isOpen) {
    grid.classList.remove('hidden');
    grid.classList.add('grid');
  } else {
    grid.classList.add('hidden');
    grid.classList.remove('grid');
  }
}

function generateFileCard(file, userClass, subject, sub, subSub, index, user) {
  const fileExt = (file.file_path || '').split('.').pop().toUpperCase();
  const fileName = file.title || 'Untitled_Node';
  const fileId = file.id;
  const path = file.file_url || '';

  const isAlt = index % 2 === 1;
  const safeFileId = fileId.toString().replace(/\./g, '-');

  // Initialize likes
  initLikeButton(fileId, user);

  return `
    <div class="file-card group relative p-10 border-2 border-white transition-all duration-300 flex flex-col justify-between h-full min-h-[340px] cursor-default
                ${isAlt ? 'bg-white text-black' : 'bg-transparent text-white'}">
      
      <div class="relative z-10 h-full flex flex-col">
        <div class="flex items-center justify-between mb-8">
           <span class="text-[9px] font-black px-3 py-1 border-2 ${isAlt ? 'border-black text-black' : 'border-red-500 text-red-500'} uppercase tracking-widest">${fileExt}</span>
           <span class="text-[9px] font-bold font-mono uppercase tracking-tighter ${isAlt ? 'text-black/40' : 'text-white/40'}">0x${index.toString(16).toUpperCase()}</span>
        </div>
        
        <div class="flex-1">
          <h5 class="text-3xl lg:text-4xl serif-display italic leading-tight mb-4 group-hover:underline decoration-red-600 decoration-3 transition-all truncate" 
              title="${fileName.replace(/"/g, '&quot;')}"
              style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;"
              data-text-filename="${fileName.replace(/"/g, '&quot;')}">${fileName.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</h5>
          <div class="flex items-center gap-2 mb-8">
            <span class="text-[40px] grayscale contrast-125">${getFileIcon(fileExt.toLowerCase())}</span>
          </div>
        </div>

        <div class="mt-8 pt-8 border-t-2 ${isAlt ? 'border-black/10' : 'border-white/10'} flex flex-col gap-4">
          <div class="flex gap-2">
            <button onclick="window.viewMaterial('${path.replace(/'/g, "\\'")}', '${fileName.replace(/'/g, "\\'")}')"
                    class="bg-black text-white px-4 py-3 flex-1 text-[9px] font-black uppercase tracking-widest hover:bg-red-600 transition-all ${isAlt ? '' : 'border border-white/20'}">
              INSPECT
            </button>
            <button id="like-${safeFileId}" 
                    class="px-4 py-3 border-2 ${isAlt ? 'border-black text-black' : 'border-white text-white'} text-[9px] font-black uppercase flex items-center justify-center gap-2 hover:bg-red-600 hover:text-black hover:border-red-600 transition-all like-btn"
                    data-file-id="${fileId}">
              <span class="material-symbols-outlined text-sm">favorite</span>
              <span class="like-count">...</span>
            </button>
          </div>
          <button onclick="window.downloadMaterial('${path.replace(/'/g, "\\'")}', '${fileName.replace(/'/g, "\\'")}')"
                  class="w-full bg-red-600 text-black py-3 text-[9px] font-black uppercase tracking-widest hover:bg-white border-2 border-red-600 hover:border-white transition-all">
            SYNCHRONIZE_DATA
          </button>
        </div>
      </div>
    </div>
  `;
}

function setupSearch(container) {
  const searchInput = document.getElementById('modal-search');
  if (!searchInput) return;

  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    const folderSections = container.querySelectorAll('.folder-section');

    folderSections.forEach(section => {
      const fileCards = section.querySelectorAll('.file-card');
      const grid = section.querySelector('.file-grid');
      let hasVisibleFiles = false;

      fileCards.forEach(card => {
        const title = card.querySelector('h5')?.textContent.toLowerCase() || '';
        const isVisible = !query || title.includes(query);
        card.style.display = isVisible ? 'flex' : 'none';
        if (isVisible) hasVisibleFiles = true;
      });

      // Show section if it has matches, and auto-expand if searching
      section.style.display = hasVisibleFiles ? 'block' : 'none';
      if (query && hasVisibleFiles) {
        section.classList.add('is-open');
        grid.classList.remove('hidden');
        grid.classList.add('grid');
      } else if (!query) {
        // Keep as is or collapse? Usually collapse if no query and wasn't manually opened.
        // For now, let's leave manually opened ones open.
      }
    });
  });
}

function setupViewToggle(container) {
  const gridBtn = document.getElementById('view-toggle-grid');
  const listBtn = document.getElementById('view-toggle-list');

  if (!gridBtn || !listBtn) return;

  gridBtn.addEventListener('click', () => {
    const grids = container.querySelectorAll('.file-grid');
    grids.forEach(grid => {
      grid.classList.remove('lg:grid-cols-1');
      grid.classList.add('lg:grid-cols-3');
    });
    gridBtn.classList.add('bg-white', 'text-black');
    listBtn.classList.remove('bg-white', 'text-black');
  });

  listBtn.addEventListener('click', () => {
    const grids = container.querySelectorAll('.file-grid');
    grids.forEach(grid => {
      grid.classList.remove('lg:grid-cols-3');
      grid.classList.add('lg:grid-cols-1');
    });
    listBtn.classList.add('bg-white', 'text-black');
    gridBtn.classList.remove('bg-white', 'text-black');
  });
}

// Initialize like button functionality
async function initLikeButton(fileId, user) {
  setTimeout(async () => {
    const { getLikeCount, hasLiked, toggleLike } = await import('./likes.js');
    const safeId = fileId.replace(/\./g, '-');
    const likeBtn = document.getElementById(`like-${safeId}`);
    if (!likeBtn) return;

    const countEl = likeBtn.querySelector('.like-count');
    const { count } = await getLikeCount(fileId);
    if (countEl) countEl.textContent = count || 0;

    if (user) {
      const isLiked = await hasLiked(fileId, user.id);
      if (isLiked) {
        likeBtn.classList.add('bg-red-600', 'text-black', 'border-red-600');
        likeBtn.classList.remove('text-white', 'text-black');
      }
    }

    likeBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      if (!user) {
        showNotification('Identification required for node sync.', 'error');
        return;
      }

      const res = await toggleLike(fileId, user.id);
      const { count: newCount } = await getLikeCount(fileId);
      if (countEl) countEl.textContent = newCount || 0;

      if (res.action === 'liked') {
        likeBtn.classList.add('bg-red-600', 'text-black', 'border-red-600');
      } else {
        likeBtn.classList.remove('bg-red-600', 'text-black', 'border-red-600');
      }
    });
  }, 150);
}

// Get file icon based on type
function getFileIcon(fileType) {
  const icons = {
    'pdf': '📄', 'doc': '📝', 'docx': '📝', 'ppt': '📊', 'pptx': '📊',
    'xls': '📈', 'xlsx': '📈', 'jpg': '🖼️', 'png': '🖼️', 'txt': '📝'
  };
  return icons[fileType] || '📄';
}

// Show loading spinner
function showLoadingSpinner(containerSelector) {
  const container = document.querySelector(containerSelector);
  if (!container) return;
  const loadingDiv = document.createElement('div');
  loadingDiv.className = 'col-span-full py-32 flex flex-col items-start border-t-2 border-white';

  const h = document.createElement('div');
  h.className = 'text-8xl serif-display italic text-white animate-pulse mb-8';
  h.textContent = 'Synchronizing Archive...';

  const barContainer = document.createElement('div');
  barContainer.className = 'w-full h-1 bg-white/10 relative overflow-hidden';

  const bar = document.createElement('div');
  bar.className = 'absolute inset-y-0 h-full bg-red-600 animate-[loading-bar_2s_infinite]';

  barContainer.appendChild(bar);
  loadingDiv.appendChild(h);
  loadingDiv.appendChild(barContainer);

  const style = document.createElement('style');
  style.textContent = `
    @keyframes loading-bar {
        0% { left: -100%; width: 50%; }
        100% { left: 100%; width: 50%; }
    }
  `;
  loadingDiv.appendChild(style);

  container.innerHTML = '';
  container.appendChild(loadingDiv);
}

// Show notification
function showNotification(message, type) {
  const notification = document.createElement('div');
  notification.className = `fixed bottom-0 right-0 p-12 z-50 transform translate-x-full transition-all duration-700 bg-black border-l-8 ${type === 'success' ? 'border-green-500' : 'border-red-600'} text-white shadow-2xl`;
  const flexDiv = document.createElement('div');
  flexDiv.className = 'flex flex-col gap-4';

  const typeSpan = document.createElement('span');
  typeSpan.className = 'text-[9px] font-black tracking-[0.4em] uppercase text-white/40 italic';
  typeSpan.textContent = 'System_Broadcast';

  const msgDiv = document.createElement('div');
  msgDiv.className = 'text-3xl serif-display italic';
  msgDiv.textContent = message;

  flexDiv.appendChild(typeSpan);
  flexDiv.appendChild(msgDiv);
  notification.appendChild(flexDiv);

  document.body.appendChild(notification);
  setTimeout(() => notification.classList.remove('translate-x-full'), 100);

  setTimeout(() => {
    notification.classList.add('translate-x-full');
    setTimeout(() => notification.remove(), 700);
  }, 4000);
}

// Navigation functions
export function viewMaterial(fileUrl, fileName) {
  const link = document.createElement('a');
  link.href = fileUrl;
  link.target = '_blank';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function downloadMaterial(fileUrl, fileName) {
  const link = document.createElement('a');
  link.href = fileUrl;
  link.download = fileName;
  link.target = '_blank';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

window.viewMaterial = viewMaterial;
window.downloadMaterial = downloadMaterial;
window.initSubjectDetails = initSubjectDetails;
window.toggleFolder = toggleFolder;
