import { supabase } from '/js/supabase.js';

async function loadProfile() {
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;

  if (!user) {
    console.warn('User not logged in for profile load');
    return;
  }

  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    if (profile) {
      document.getElementById('firstName').value = profile.first_name || '';
      document.getElementById('lastName').value = profile.last_name || '';
      document.getElementById('age').value = profile.age || '';
      
      // Normalize classGrade
      let cGrade = profile.class_grade || '';
      if (cGrade && cGrade.endsWith('th')) {
          cGrade = `Class ${cGrade.replace('th', '')}`;
      }
      document.getElementById('classGrade').value = cGrade;
      
      document.getElementById('role').value = profile.role || 'Student';
      document.getElementById('photoUrl').value = profile.photo_url || '';

      // Set profile photo preview src
      const photoPreview = document.getElementById('profile-photo-preview');
      const placeholderText = document.getElementById('photo-placeholder-text');
      if (profile.photo_url) {
        photoPreview.src = profile.photo_url;
        if (placeholderText) placeholderText.style.display = 'none';
      } else {
        photoPreview.src = '';
        if (placeholderText) placeholderText.style.display = 'block';
      }

      // Update display text elements
      const displayName = document.getElementById('display-name');
      const displayRole = document.getElementById('display-role');
      if (displayName) displayName.textContent = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Welcome!';
      if (displayRole) displayRole.textContent = profile.role || 'Student';
    }
  } catch (error) {
    console.error('Error loading profile:', error);
  }
}

async function saveProfile() {
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;

  if (!user) {
    alert('User not logged in');
    return;
  }

  // Get form field values
  const firstName = document.getElementById('firstName').value;
  const lastName = document.getElementById('lastName').value;
  const age = document.getElementById('age').value;
  const classGrade = document.getElementById('classGrade').value;
  const role = document.getElementById('role').value;
  const photoUrl = document.getElementById('photoUrl').value;

  try {
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        first_name: firstName,
        last_name: lastName,
        age: parseInt(age) || null,
        class_grade: classGrade,
        role: role,
        photo_url: photoUrl,
        email: user.email,
        updated_at: new Date().toISOString()
      });

    if (error) throw error;

    // Update display names visually without reload
    const displayName = document.getElementById('display-name');
    const displayRole = document.getElementById('display-role');
    if (displayName) displayName.textContent = `${firstName} ${lastName}`.trim() || 'Welcome!';
    if (displayRole) displayRole.textContent = role || 'Student';

    const messageBox = document.getElementById('message');
    if (messageBox) {
      messageBox.textContent = 'Profile saved successfully.';
      messageBox.classList.remove('hidden');
      setTimeout(() => messageBox.classList.add('hidden'), 3000);
    }
  } catch (error) {
    alert('Error saving profile: ' + error.message);
  }
}

/**
 * Handle Profile Photo Upload to Supabase Storage
 */
async function uploadProfilePhoto(file) {
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;

  if (!user || !file) return;

  const messageBox = document.getElementById('message');
  if (messageBox) {
    messageBox.textContent = 'Uploading connection established...';
    messageBox.classList.remove('hidden');
  }

  try {
    // 1. Define safe path: user_id/timestamp_filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    // 2. Upload to 'profile-photos' bucket
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('profile-photos')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) throw uploadError;

    // 3. Get Public URL
    const { data: { publicUrl } } = supabase.storage
      .from('profile-photos')
      .getPublicUrl(fileName);

    // 4. Update UI Preview
    document.getElementById('photoUrl').value = publicUrl;
    document.getElementById('profile-photo-preview').src = publicUrl;
    const placeholderText = document.getElementById('photo-placeholder-text');
    if (placeholderText) placeholderText.style.display = 'none';

    if (messageBox) {
      messageBox.textContent = 'Photo uploaded to hive. Please commit changes to save.';
    }

  } catch (error) {
    console.error('Upload error:', error);
    alert('Failed to transmit photo: ' + error.message);
  }
}

function openUploadWidget() {
  // Trigger the hidden file input
  const fileInput = document.getElementById('profile-photo-input');
  if (fileInput) {
    fileInput.click();

    // Attach listener if not already there
    if (!fileInput.hasAttribute('data-initialized')) {
      fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          uploadProfilePhoto(e.target.files[0]);
        }
      });
      fileInput.setAttribute('data-initialized', 'true');
    }
  }
}

// Make functions globally available for inline HTML events
window.saveProfile = saveProfile;
window.openUploadWidget = openUploadWidget;
window.uploadProfilePhoto = uploadProfilePhoto;

// Make functions globally available for inline HTML events
window.saveProfile = saveProfile;
window.openUploadWidget = openUploadWidget;

// Auth check and load profile
supabase.auth.onAuthStateChange((event, session) => {
  if (session) {
    loadProfile();
  }
});
