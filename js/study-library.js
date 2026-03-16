import { supabase } from './supabase.js';

// Materials structure will be loaded dynamically from JSON files
let materialsStructure = {};

// Initialize study library functionality
export function initStudyLibrary() {
  loadStudyMaterials();
}

// Load and display study materials based on user class
export async function loadStudyMaterials() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;

    // Default to class 10 if not found in profile
    let userClass = "Class 10";
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('class_grade')
        .eq('id', user.id)
        .single();
      if (profile?.class_grade) {
          const grade = profile.class_grade.toString();
          userClass = grade.startsWith('Class') ? grade : `Class ${grade}`;
          // Fallback normalization for legacy "10th" style
          if (grade.endsWith('th')) userClass = `Class ${grade.replace('th', '')}`;
      }
    }

    showLoadingSpinner('#materials-container');

    // Fetch dynamic structure from Supabase
    // We use .in() to handle both "Class 10" and legacy "10th" formats during the migration
    const classVariants = [userClass];
    if (userClass.startsWith('Class ')) {
        classVariants.push(userClass.replace('Class ', '') + 'th');
    }

    const { data: approvedMaterials, error } = await supabase
        .from('study_materials')
        .select('subject')
        .eq('status', 'approved')
        .in('class_level', classVariants);

    if (error) throw error;

    // Group by subject to build the legacy materialsStructure-like object
    const subjects = {};
    (approvedMaterials || []).forEach(m => {
        if (!subjects[m.subject]) subjects[m.subject] = {};
    });

    materialsStructure[userClass] = subjects;
    displayLocalMaterials(userClass);

  } catch (error) {
    console.error('Error loading study materials:', error);
    showNotification('Neural Library Sync Failed.', 'error');
  }
}

// Display local materials
function displayLocalMaterials(userClass) {
  const container = document.getElementById('materials-container');
  if (!container) return;

  container.innerHTML = '';

  const classData = materialsStructure[userClass];
  if (!classData) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'col-span-full border-4 border-white p-20 text-left bg-black';

    const h3 = document.createElement('h3');
    h3.className = 'text-6xl serif-display italic text-white mb-6';
    h3.textContent = 'Database_Empty.';

    const p = document.createElement('p');
    p.className = 'text-[10px] text-red-500 font-black uppercase tracking-[0.4em]';
    p.textContent = 'ERR_0x404 // DATASET_NOT_REGISTERED';

    errorDiv.appendChild(h3);
    errorDiv.appendChild(p);
    container.appendChild(errorDiv);
    return;
  }

  const subjects = Object.keys(classData);
  subjects.forEach((subject, idx) => {
    const card = document.createElement('div');
    card.className = 'group relative flex flex-col cursor-pointer border-t-2 border-white/10 pt-12 transition-all hover:border-red-600';
    card.onclick = () => {
      window.location.href = `subject-details.html?subject=${encodeURIComponent(subject)}&class=${userClass}`;
    };

    const metaDiv = document.createElement('div');
    metaDiv.className = 'flex items-start justify-between mb-8';

    const archiveSpan = document.createElement('div');
    archiveSpan.className = 'text-[9px] font-black font-mono text-white/20 tracking-[0.4em]';
    archiveSpan.textContent = `0${idx + 1} // ARCHIVE`;

    const accessSpan = document.createElement('span');
    accessSpan.className = 'text-[10px] font-black text-red-500 italic uppercase tracking-widest group-hover:translate-x-4 transition-transform';
    accessSpan.textContent = 'ACCESS_DIR';

    metaDiv.appendChild(archiveSpan);
    metaDiv.appendChild(accessSpan);

    const h3 = document.createElement('h3');
    h3.className = 'text-6xl lg:text-7xl serif-display leading-none text-white italic group-hover:text-red-600 transition-colors mb-6';
    h3.textContent = subject;

    const p = document.createElement('p');
    p.className = 'text-[10px] text-white/40 leading-relaxed uppercase font-medium max-w-sm';
    p.textContent = `Initialize synchronization with ${subject} logic modules. Accessing distributed archive vectors for level 0${userClass} academic sync.`;

    const progressDiv = document.createElement('div');
    progressDiv.className = 'mt-12 h-1 bg-white/5 w-full overflow-hidden';
    const progressBar = document.createElement('div');
    progressBar.className = 'h-full bg-red-600 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-700 ease-in-out';
    progressDiv.appendChild(progressBar);

    card.appendChild(metaDiv);
    card.appendChild(h3);
    card.appendChild(p);
    card.appendChild(progressDiv);

    container.appendChild(card);
  });
}

// View material
export function viewMaterial(fileUrl, fileName) {
  const link = document.createElement('a');
  link.href = fileUrl;
  link.target = '_blank';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Show loading spinner
function showLoadingSpinner(containerSelector) {
  const container = document.querySelector(containerSelector);
  if (!container) return;

  const loadingDiv = document.createElement('div');
  loadingDiv.className = 'col-span-full py-32 flex flex-col items-start border-t-2 border-white';

  const h = document.createElement('div');
  h.className = 'text-8xl serif-display italic text-white animate-pulse mb-8';
  h.textContent = 'Loading Archive...';

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

// Search and filter functions
export function searchMaterials() {
  const searchInput = document.getElementById('search-input');
  if (!searchInput) return;
  const query = searchInput.value.toLowerCase();

  const allCards = document.querySelectorAll('#materials-container > div');

  allCards.forEach(card => {
    const title = card.querySelector('h3')?.textContent.toLowerCase() || '';
    const description = card.querySelector('p')?.textContent.toLowerCase() || '';
    const isVisible = title.includes(query) || description.includes(query);
    card.style.display = isVisible ? 'flex' : 'none';
  });
}

export function filterMaterials(subject) {
  const localCards = document.querySelectorAll('#materials-container > div');
  const communityCards = document.querySelectorAll('#community-grid > div');
  const filterButtons = document.querySelectorAll('.filter-btn');

  filterButtons.forEach(btn => {
    const isTarget = btn.id === `filter-${subject}` || (subject === 'all' && btn.id === 'filter-all');
    if (isTarget) {
      btn.classList.add('bg-white', 'text-black');
      btn.classList.remove('bg-transparent', 'text-white');
    } else {
      btn.classList.remove('bg-white', 'text-black');
      btn.classList.add('bg-transparent', 'text-white');
    }
  });

  [...localCards, ...communityCards].forEach(card => {
    if (subject === 'all') {
      card.style.display = 'flex';
    } else {
      const cardSubject = card.querySelector('span:nth-child(2)')?.textContent || card.querySelector('h3')?.textContent;
      const isMatch = cardSubject?.toLowerCase().includes(subject.toLowerCase()) || cardSubject === subject;
      card.style.display = isMatch ? 'flex' : 'none';
    }
  });
}

// Make functions globally available
window.viewMaterial = viewMaterial;
window.searchMaterials = searchMaterials;
window.filterMaterials = filterMaterials;
window.initStudyLibrary = initStudyLibrary;
