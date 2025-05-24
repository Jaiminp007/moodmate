// Get DOM elements for settings modal and theme
const settingsModal = document.getElementById('settings-modal');
const settingsBtn = document.getElementById('settings-btn');
const closeSettingsBtn = document.getElementById('close-settings');
const darkModeToggle = document.getElementById('darkModeToggleModal');

// Function to set the theme and update toggles
function setTheme(isLightMode) {
  if (isLightMode) {
    document.body.classList.add('light-mode');
  } else {
    document.body.classList.remove('light-mode');
  }
  if (darkModeToggle) darkModeToggle.checked = !isLightMode; // checked = dark mode
  localStorage.setItem('lightMode', isLightMode);
}

// Function to initialize theme based on stored preference
function initializeTheme() {
  const storedPreference = localStorage.getItem('lightMode') === 'true';
  setTheme(storedPreference);
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

// Initialize theme when page loads
document.addEventListener('DOMContentLoaded', () => {
    initializeTheme();

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
}); 