// Get DOM elements
const settingsModal = document.getElementById('settings-modal');
const settingsBtn = document.getElementById('settings-btn');
const closeSettingsBtn = document.getElementById('close-settings');
const darkModeToggle = document.getElementById('darkModeToggleModal');

// Function to toggle light/dark mode
function toggleTheme() {
  document.body.classList.toggle('light-mode');
  // Invert the checkbox state since we want checked=dark mode
  darkModeToggle.checked = !document.body.classList.contains('light-mode');
  
  // Store the preference
  const isLightMode = document.body.classList.contains('light-mode');
  localStorage.setItem('lightMode', isLightMode);
}

// Function to initialize theme based on stored preference
function initializeTheme() {
  const isLightMode = localStorage.getItem('lightMode') === 'true';
  if (isLightMode) {
    document.body.classList.add('light-mode');
    // Set checkbox to unchecked for light mode
    darkModeToggle.checked = false;
  } else {
    // Set checkbox to checked for dark mode
    darkModeToggle.checked = true;
  }
}

// Function to open settings modal
function openSettingsModal() {
  settingsModal.style.display = 'flex';
}

// Function to close settings modal
function closeSettingsModal() {
  settingsModal.style.display = 'none';
}

// Close modal when clicking outside
window.onclick = function(event) {
  if (event.target === settingsModal) {
    closeSettingsModal();
  }
}

// Conversation Modal Logic
function getConversations() {
    const data = localStorage.getItem('aiConversations');
    return data ? JSON.parse(data) : [];
}

// Initialize theme when page loads
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in
    const checkUserLoggedIn = () => {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (!currentUser || !currentUser.isLoggedIn) {
            window.location.href = 'login.html';
            return false;
        }
        return true;
    };

    // Check login status immediately
    if (!checkUserLoggedIn()) {
        return; // Stop execution if not logged in
    }

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

    // Event listeners for modal
    settingsBtn.addEventListener('click', openSettingsModal);
    closeSettingsBtn.addEventListener('click', closeSettingsModal);
    darkModeToggle.addEventListener('change', toggleTheme);

    // Conversation modal logic
    const viewConvosBtn = document.getElementById('view-convos-btn');
    const convoModal = document.getElementById('convo-modal');
    const closeConvoModal = document.getElementById('close-convo-modal');
    const convoModalContent = document.getElementById('convo-modal-content');

    console.log('Modal elements found:', { viewConvosBtn, convoModal, closeConvoModal, convoModalContent }); // Log elements

    if (viewConvosBtn && convoModal && closeConvoModal && convoModalContent) {
        viewConvosBtn.addEventListener('click', () => {
            console.log('View All Conversations button clicked.'); // Log button click
            // Load conversations from localStorage
            const convos = getConversations();
            console.log('Conversations loaded from localStorage:', convos); // Log loaded data
            console.log('Number of conversations:', convos.length); // Log number of conversations

            if (convos.length === 0) {
                convoModalContent.innerHTML = '<p>No conversations found.</p>';
            } else {
                // Display a list of conversation titles instead of full content
                convoModalContent.innerHTML = '<h3>Select a conversation:</h3>' +
                                              convos.map(convo => `
                    <div class="convo-block" style="margin-bottom: 12px; padding: 10px; border: 1px solid #eee; cursor: pointer;" data-convo-title="${convo.title}">
                        <h4>${convo.title}</h4>
                        <p style="font-size: 0.9em; color: #555;">Started: ${new Date(convo.started).toLocaleString()}</p>
                    </div>
                `).join('');

                // Optional: Add event listeners to these conversation items to view full convo
                // For now, they just list the titles.
            }
            convoModal.style.display = 'flex';
        });
        closeConvoModal.addEventListener('click', () => {
            convoModal.style.display = 'none';
        });
        // Also close modal when clicking outside content
        convoModal.addEventListener('click', (e) => {
            if (e.target === convoModal) {
                convoModal.style.display = 'none';
            }
        });
    }
}); 