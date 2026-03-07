import { supabase } from './supabase.js';

// Materials structure will be loaded dynamically from JSON files
let materialsStructure = {};

// Initialize subject details functionality
export async function initSubjectDetails() {
  const urlParams = new URLSearchParams(window.location.search);
  const subject = urlParams.get('subject');
  const userClass = urlParams.get('class') || 10;

  if (!subject) {
    showNotification('No subject specified.', 'error');
    return;
  }

  const titleEl = document.getElementById('subject-title');
  if (titleEl) {
    titleEl.innerHTML = `${subject} <br> <span class="not-italic text-white">Archives.</span>`;
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

    // Load materials structure from JSON file
    await loadMaterialsStructure(userClass);

    displaySubjectFiles(subject, userClass, user);

  } catch (error) {
    console.error('Error loading subject details:', error);
    showNotification('Failed to load subject details.', 'error');
  }
}

// Load materials structure from JSON file based on user class
async function loadMaterialsStructure(userClass) {
  try {
    const response = await fetch(`../assets/Study Library/class${userClass}.json`);
    if (!response.ok) {
      throw new Error(`Failed to load materials for class ${userClass}`);
    }
    const data = await response.json();
    materialsStructure[userClass] = data;
  } catch (error) {
    console.error('Error loading materials structure:', error);
    showNotification('Failed to load materials structure.', 'error');
  }
}

// Display subject files
function displaySubjectFiles(subject, userClass, user) {
  const container = document.getElementById('files-container');
  if (!container) return;

  const classData = materialsStructure[userClass];
  if (!classData || !classData[subject]) {
    container.innerHTML = `
      <div class="col-span-full border-4 border-white p-20 text-left bg-black">
        <h3 class="text-6xl serif-display italic text-white mb-6">Archive_Empty.</h3>
        <p class="text-[10px] text-red-500 font-black uppercase tracking-[0.4em]">ERR_0x404 // SUBJECT_DATA_NOT_FOUND</p>
      </div>
    `;
    return;
  }

  const subjectData = classData[subject];
  const subKeys = Object.keys(subjectData);
  let totalFiles = 0;
  let sectionsHTML = '';

  // Count total files and build sections
  subKeys.forEach((sub, subIdx) => {
    const subData = subjectData[sub];
    let subFileCount = 0;
    let filesHTML = '';

    if (Array.isArray(subData)) {
      subFileCount = subData.length;
      totalFiles += subFileCount;

      subData.forEach((file, fileIdx) => {
        filesHTML += generateFileCard(file, userClass, subject, sub, null, fileIdx, user);
      });
    } else {
      // Nested folders
      Object.keys(subData).forEach(subSub => {
        const subSubData = subData[subSub];
        if (Array.isArray(subSubData)) {
          subFileCount += subSubData.length;
          totalFiles += subSubData.length;

          filesHTML += `
            <div class="col-span-full pt-12 mt-12 border-t border-white/5 flex items-center justify-between">
              <span class="text-[10px] font-black tracking-[0.4em] text-white/20 uppercase font-mono italic">Sub_Vector // ${subSub}</span>
              <span class="h-px flex-1 mx-8 bg-white/5"></span>
              <span class="text-[9px] font-black text-red-500 font-mono tracking-widest">${subSubData.length} FILES</span>
            </div>
          `;

          subSubData.forEach((file, fileIdx) => {
            filesHTML += generateFileCard(file, userClass, subject, sub, subSub, fileIdx, user);
          });
        }
      });
    }

    sectionsHTML += `
      <div class="folder-section group/folder" data-folder="${sub}">
        <!-- Section Header (Toggle) -->
        <button onclick="window.toggleFolder(this)" 
                class="w-full flex flex-col lg:flex-row items-end justify-between mb-12 gap-12 text-left hover:bg-white/5 p-4 -m-4 transition-all duration-300">
            <div class="flex-1">
                <div class="flex items-center gap-4 mb-6">
                    <span class="text-[9px] font-black font-mono text-white/20 tracking-[0.4em]">FRAGMENT_0${subIdx + 1}</span>
                    <span class="h-px w-12 bg-white/10"></span>
                    <span class="text-red-500 font-black tracking-[0.5em] uppercase text-[9px] italic">CHAPTER_ARCHIVE</span>
                </div>
                <div class="flex items-center gap-6">
                    <span class="text-4xl serif-display text-red-600 transition-transform duration-300 group-[.is-open]/folder:rotate-45">+</span>
                    <h4 class="text-5xl lg:text-6xl serif-display leading-none text-white italic">${sub}</h4>
                </div>
            </div>
            <div class="text-right border-r border-white/10 pr-8">
                <div class="text-[9px] font-black uppercase tracking-widest text-white/30 mb-2">Logs_Count</div>
                <div class="text-xs font-bold font-mono text-white tracking-widest uppercase">${subFileCount} NODES</div>
            </div>
        </button>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-24 gap-x-12 file-grid hidden pt-12">
            ${filesHTML}
        </div>
      </div>
    `;
  });

  // Update file count
  const fileCountEl = document.getElementById('file-count');
  if (fileCountEl) fileCountEl.textContent = `${totalFiles} NODES_SYNCED`;

  container.innerHTML = sectionsHTML;

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
  const fileIcon = getFileIcon(file.split('.').pop().toLowerCase());
  const fileName = file.replace(/\.[^/.]+$/, "");
  const fileExt = file.split('.').pop().toUpperCase();
  const fileId = `${userClass}-${subject}-${sub}-${subSub ? subSub + '-' : ''}${file}`.replace(/\s+/g, '-');
  const path = subSub
    ? `../assets/Study Library/class ${userClass}/${subject}/${sub}/${subSub}/${file}`
    : `../assets/Study Library/class ${userClass}/${subject}/${sub}/${file}`;

  // Alternate visual tension
  const isAlt = index % 2 === 1;

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
          <h5 class="text-3xl lg:text-4xl serif-display italic leading-tight mb-4 group-hover:underline decoration-red-600 decoration-3 transition-all truncate" title="${fileName}">${fileName}</h5>
          <div class="flex items-center gap-2 mb-8">
            <span class="text-[40px] grayscale contrast-125">${fileIcon}</span>
          </div>
        </div>

        <div class="mt-8 pt-8 border-t-2 ${isAlt ? 'border-black/10' : 'border-white/10'} flex flex-col gap-4">
          <div class="flex gap-2">
            <button onclick="window.viewMaterial('${path}', '${file}')"
                    class="bg-black text-white px-4 py-3 flex-1 text-[9px] font-black uppercase tracking-widest hover:bg-red-600 transition-all ${isAlt ? '' : 'border border-white/20'}">
              INSPECT
            </button>
            <button id="like-${fileId.replace(/\./g, '-')}" 
                    class="px-4 py-3 border-2 ${isAlt ? 'border-black text-black' : 'border-white text-white'} text-[9px] font-black uppercase flex items-center justify-center gap-2 hover:bg-red-600 hover:text-black hover:border-red-600 transition-all like-btn"
                    data-file-id="${fileId}">
              <span class="material-symbols-outlined text-sm">favorite</span>
              <span class="like-count">...</span>
            </button>
          </div>
          <button onclick="window.downloadMaterial('${path}', '${file}')"
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
  container.innerHTML = `
    <div class="col-span-full py-32 flex flex-col items-start border-t-2 border-white">
      <div class="text-8xl serif-display italic text-white animate-pulse mb-8">Synchronizing Archive...</div>
      <div class="w-full h-1 bg-white/10 relative overflow-hidden">
        <div class="absolute inset-y-0 h-full bg-red-600 animate-[loading-bar_2s_infinite]"></div>
      </div>
      <style>
        @keyframes loading-bar {
            0% { left: -100%; width: 50%; }
            100% { left: 100%; width: 50%; }
        }
      </style>
    </div>
  `;
}

// Show notification
function showNotification(message, type) {
  const notification = document.createElement('div');
  notification.className = `fixed bottom-0 right-0 p-12 z-50 transform translate-x-full transition-all duration-700 bg-black border-l-8 ${type === 'success' ? 'border-green-500' : 'border-red-600'} text-white shadow-2xl`;
  notification.innerHTML = `
    <div class="flex flex-col gap-4">
        <span class="text-[9px] font-black tracking-[0.4em] uppercase text-white/40 italic">System_Broadcast</span>
        <div class="text-3xl serif-display italic">${message}</div>
    </div>
  `;

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
