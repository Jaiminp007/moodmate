// Get DOM elements
const settingsModal = document.getElementById('settings-modal');
const settingsBtn = document.getElementById('settings-btn');
const closeSettingsBtn = document.getElementById('close-settings');
const darkModeToggle = document.getElementById('darkModeToggleModal');
const activitiesList = document.querySelector('.activities-list');
const conversationList = document.querySelector('.conversation-list');
const viewConvosBtn = document.getElementById('view-convos-btn');
const deleteAllConvosBtn = document.getElementById('delete-all-convos-btn');

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

// Function to get the latest mood boost activities
function getLatestMoodBoostActivities() {
    console.log('=== Getting Latest Mood Boost Activities ===');
    const conversations = getConversations();
    console.log('All conversations:', conversations);

    if (conversations.length === 0) {
        console.log('No conversations found');
        return [];
    }

    // Get the most recent conversation
    const latestConversation = conversations[conversations.length - 1];
    console.log('Latest conversation:', latestConversation);

    if (!latestConversation.messages || latestConversation.messages.length === 0) {
        console.log('No messages in latest conversation');
        return [];
    }

    // Find the last assistant message with activities
    const lastAssistantMessage = [...latestConversation.messages]
        .reverse()
        .find(msg => msg.role === 'assistant' && msg.activities && msg.activities.length > 0);
    
    console.log('Last assistant message with activities:', lastAssistantMessage);
    
    if (lastAssistantMessage && lastAssistantMessage.activities) {
        console.log('Found activities:', lastAssistantMessage.activities);
        return lastAssistantMessage.activities;
    }

    console.log('No activities found in latest conversation');
    return [];
}

// Function to display mood boost activities
function displayMoodBoostActivities() {
    console.log('=== Displaying Mood Boost Activities ===');
    const activities = getLatestMoodBoostActivities();
    console.log('Activities to display:', activities);

    if (!activitiesList) {
        console.error('Activities list element not found');
        return;
    }

    if (activities && activities.length > 0) {
        console.log('Creating HTML for activities:', activities);
        const activitiesHTML = activities.map(activity => `
            <div class="activity-item">
                <span class="activity-emoji">🎯</span>
                <span class="activity-text">${activity}</span>
            </div>
        `).join('');
        
        console.log('Generated activities HTML:', activitiesHTML);
        activitiesList.innerHTML = activitiesHTML;
    } else {
        console.log('No activities to display, showing empty state');
        activitiesList.innerHTML = `
            <div class="empty-state">
                <p>No mood boost activities available yet.</p>
                <p>Start a conversation to get personalized suggestions!</p>
            </div>
        `;
    }
}

// Function to format timestamp
function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString();
}

// Function to get emoji for mood
function getMoodEmoji(mood) {
    const emojiMap = {
        'happy': '😊',
        'sad': '😢',
        'angry': '😠',
        'fearful': '😨',
        'disgusted': '🤢',
        'surprised': '😲',
        'neutral': '😐'
    };
    return emojiMap[mood] || '😐';
}

// Function to display past conversations
function displayPastConversations() {
    const convos = getConversations();
    
    // Clear existing conversations
    conversationList.innerHTML = '';
    
    if (convos.length === 0) {
        conversationList.innerHTML = '<p>No past conversations available.</p>';
        return;
    }

    // Display last 5 conversations
    convos.slice(-5).reverse().forEach(convo => {
        const lastMessage = convo.messages[convo.messages.length - 1];
        if (lastMessage && lastMessage.role === 'assistant') {
            const conversationItem = document.createElement('div');
            conversationItem.className = 'conversation-item';
            
            const timestamp = document.createElement('p');
            timestamp.textContent = `Timestamp: ${formatTimestamp(convo.messages[0].timestamp)}`;
            
            const mood = document.createElement('p');
            mood.textContent = `Mood: ${getMoodEmoji(lastMessage.feeling || 'neutral')}`;
            
            conversationItem.appendChild(timestamp);
            conversationItem.appendChild(mood);
            conversationList.appendChild(conversationItem);
        }
    });
}

// Function to handle view all conversations
function handleViewAllConversations() {
    const convos = getConversations();
    if (convos.length === 0) {
        alert('No conversations available.');
        return;
    }

    // Create modal for all conversations
    const modal = document.createElement('div');
    modal.className = 'conversations-modal';
    modal.innerHTML = `
        <div class="conversations-modal-content">
            <h2>All Conversations</h2>
            <div class="all-conversations-list"></div>
            <button class="close-modal">Close</button>
        </div>
    `;

    const conversationsList = modal.querySelector('.all-conversations-list');
    convos.reverse().forEach(convo => {
        const convoElement = document.createElement('div');
        convoElement.className = 'conversation-detail';
        
        const title = document.createElement('h3');
        title.textContent = `Conversation from ${formatTimestamp(convo.messages[0].timestamp)}`;
        
        const messages = document.createElement('div');
        messages.className = 'conversation-messages';
        
        convo.messages.forEach(msg => {
            const messageElement = document.createElement('div');
            messageElement.className = `message ${msg.role}`;
            messageElement.textContent = msg.content;
            messages.appendChild(messageElement);
        });

        convoElement.appendChild(title);
        convoElement.appendChild(messages);
        conversationsList.appendChild(convoElement);
    });

    document.body.appendChild(modal);

    // Handle modal close
    const closeBtn = modal.querySelector('.close-modal');
    closeBtn.onclick = () => {
        document.body.removeChild(modal);
    };

    modal.onclick = (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    };
}

// Function to delete all conversations
function deleteAllConversations() {
    if (confirm('Are you sure you want to delete all conversations? This action cannot be undone.')) {
        localStorage.removeItem('aiConversations');
        displayMoodBoostActivities();
        displayPastConversations();
    }
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

    // Initial display of activities and conversations
    console.log('Initializing history page display');
    displayMoodBoostActivities();
    displayPastConversations();
    
    if (viewConvosBtn) {
        viewConvosBtn.addEventListener('click', handleViewAllConversations);
    }

    if (deleteAllConvosBtn) {
        deleteAllConvosBtn.addEventListener('click', deleteAllConversations);
    }
}); 