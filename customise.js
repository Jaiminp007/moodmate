// Get DOM elements for settings modal and theme
const settingsModal = document.getElementById('settings-modal');
const settingsBtn = document.getElementById('settings-btn');
const closeSettingsBtn = document.getElementById('close-settings');
const darkModeToggle = document.getElementById('darkModeToggleModal');

// Get DOM elements for new customise preferences
const responseLengthSelect = document.getElementById('responseLength');
const triggerDetectionToggle = document.getElementById('triggerDetection');
const moodLoggingToggle = document.getElementById('moodLogging');
const dataRetentionSelect = document.getElementById('dataRetention');
const preferredNameInput = document.getElementById('preferredName');
const faceTrackingToggle = document.getElementById('faceTracking');

// Function to set the theme and update toggles
function setTheme(isLightMode) {
  if (isLightMode) {
    document.body.classList.add('light-mode');
  } else {
    document.body.classList.remove('light-mode');
  }
  if (darkModeToggle) darkModeToggle.checked = !isLightMode;
  localStorage.setItem('lightMode', isLightMode);
}

// Function to initialize theme based on stored preference
function initializeTheme() {
  const storedPreference = localStorage.getItem('lightMode');
  let isLightMode = storedPreference === 'true';
  setTheme(isLightMode);
}

// Function to open settings modal
function openSettingsModal() {
  if (settingsModal) settingsModal.style.display = 'flex';
  if (darkModeToggle) darkModeToggle.checked = !document.body.classList.contains('light-mode');
}

// Function to close settings modal
function closeSettingsModal() {
  if (settingsModal) settingsModal.style.display = 'none';
}

// Close modal when clicking outside
window.onclick = function(event) {
  if (event.target === settingsModal) {
    closeSettingsModal();
  }
}

// --- Functions to save and load individual preferences ---
function savePreference(key, value) {
  localStorage.setItem(key, value);
}

function loadPreferences() {
  // Response Preferences
  if (responseLengthSelect) responseLengthSelect.value = localStorage.getItem('responseLength') || 'short';
  if (triggerDetectionToggle) triggerDetectionToggle.checked = localStorage.getItem('triggerDetection') === 'true';
  
  // Mood Tracking Preferences
  if (moodLoggingToggle) moodLoggingToggle.checked = localStorage.getItem('moodLogging') === 'true';
  if (dataRetentionSelect) dataRetentionSelect.value = localStorage.getItem('dataRetention') || '7';

  // Tracking Preferences
  if (faceTrackingToggle) faceTrackingToggle.checked = localStorage.getItem('faceTrackingEnabled') === 'true';

  // Optional Preferences
  if (preferredNameInput) preferredNameInput.value = localStorage.getItem('preferredName') || '';
}

// Initialize theme and preferences when page loads
document.addEventListener('DOMContentLoaded', () => {
  initializeTheme();
  loadPreferences();

  // Hamburger Menu Toggle
  const hamburgerMenu = document.getElementById('hamburger-menu');
  const navLinksMenu = document.getElementById('nav-links-menu');

  if (hamburgerMenu && navLinksMenu) {
      hamburgerMenu.addEventListener('click', () => {
          navLinksMenu.classList.toggle('active-menu');
          const isExpanded = navLinksMenu.classList.contains('active-menu');
          hamburgerMenu.setAttribute('aria-expanded', isExpanded);
      });
  }

  // Event listeners for settings modal and theme
  if (settingsBtn) settingsBtn.addEventListener('click', openSettingsModal);
  if (closeSettingsBtn) closeSettingsBtn.addEventListener('click', closeSettingsModal);
  if (darkModeToggle) darkModeToggle.addEventListener('change', () => setTheme(!darkModeToggle.checked));

  // --- Event listeners for new customise preferences ---
  if (responseLengthSelect) responseLengthSelect.addEventListener('change', (e) => savePreference('responseLength', e.target.value));
  if (triggerDetectionToggle) triggerDetectionToggle.addEventListener('change', (e) => savePreference('triggerDetection', e.target.checked));
  if (moodLoggingToggle) moodLoggingToggle.addEventListener('change', (e) => savePreference('moodLogging', e.target.checked));
  if (dataRetentionSelect) dataRetentionSelect.addEventListener('change', (e) => savePreference('dataRetention', e.target.value));
  if (preferredNameInput) preferredNameInput.addEventListener('input', (e) => savePreference('preferredName', e.target.value));
  if (faceTrackingToggle) faceTrackingToggle.addEventListener('change', (e) => savePreference('faceTrackingEnabled', e.target.checked));

  // Initialize face tracking toggle based on stored preference
  const isFaceTrackingEnabled = localStorage.getItem('faceTrackingEnabled') === 'true';
  if (faceTrackingToggle) {
      faceTrackingToggle.checked = isFaceTrackingEnabled;
  }

  // Add event listener for face tracking toggle
  if (faceTrackingToggle) {
      faceTrackingToggle.addEventListener('change', function() {
          const isEnabled = this.checked;
          localStorage.setItem('faceTrackingEnabled', isEnabled);
          
          // Find and update emotion display visibility on all pages
          const emotionDisplay = document.querySelector('.emotion-display');
          if (emotionDisplay) {
              emotionDisplay.style.display = isEnabled ? 'block' : 'none';
          }
      });
  }
});

// Initialize face tracking toggle based on stored preference
const isFaceTrackingEnabled = localStorage.getItem('faceTrackingEnabled') === 'true';
if (faceTrackingToggle) {
    faceTrackingToggle.checked = isFaceTrackingEnabled;
}

// Add event listener for face tracking toggle
if (faceTrackingToggle) {
    faceTrackingToggle.addEventListener('change', function() {
        const isEnabled = this.checked;
        localStorage.setItem('faceTrackingEnabled', isEnabled);
        
        // Find and update emotion display visibility on all pages
        const emotionDisplay = document.querySelector('.emotion-display');
        if (emotionDisplay) {
            emotionDisplay.style.display = isEnabled ? 'block' : 'none';
        }
    });
} 