// Initialize Chart.js
document.addEventListener('DOMContentLoaded', () => {
    // Register required Chart.js components
    if (typeof Chart !== 'undefined') {
        const {
            LinearScale,
            CategoryScale,
            TimeScale,
            Tooltip,
            Title,
            Legend,
            LineController,
            PointElement,
            LineElement
        } = Chart;

        Chart.register(
            LinearScale,
            CategoryScale,
            TimeScale,
            Tooltip,
            Title,
            Legend,
            LineController,
            PointElement,
            LineElement
        );
        console.log('Chart.js components registered successfully');
    } else {
        console.warn('Chart.js not available. Please check if the library is loaded.');
    }
});

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
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const userId = currentUser ? currentUser.email : 'guest';
    const data = localStorage.getItem(`aiConversations_${userId}`);
    return data ? JSON.parse(data) : [];
}

function saveConversations(conversations) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const userId = currentUser ? currentUser.email : 'guest';
    console.log('Saving conversations to localStorage from history.js for user', userId, ':', conversations);
    localStorage.setItem(`aiConversations_${userId}`, JSON.stringify(conversations));
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
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const userPlan = currentUser ? currentUser.plan : 'free';
    const convos = getConversations();
    
    // Clear existing conversations
    conversationList.innerHTML = '';
    
    if (userPlan === 'free') {
        // Create locked state for free users
        const bottomBox = document.querySelector('.bottom-box');
        bottomBox.innerHTML = `
            <img src="assets/lock.png" alt="Lock Icon" class="lock-image">
            <p class="lock-message">Upgrade to Plus or Pro plan to view your conversation history</p>
        `;
        return;
    }
    
    // For Plus/Pro users, show the conversations
    if (convos.length === 0) {
        conversationList.innerHTML = '<p>No past conversations available.</p>';
        return;
    }

    // Display conversations in reverse chronological order
    convos.slice().reverse().forEach(convo => {
        const conversationItem = document.createElement('div');
        conversationItem.className = 'conversation-item';
        conversationItem.dataset.title = convo.title;
        conversationItem.dataset.id = convo.startTime;
        
        const titleContainer = document.createElement('div');
        titleContainer.className = 'conversation-title-container';

        const title = document.createElement('h3');
        title.textContent = convo.title;
        
        const actionsContainer = document.createElement('div');
        actionsContainer.className = 'conversation-actions';

        const editButton = document.createElement('button');
        editButton.className = 'conversation-action-btn edit-btn';
        editButton.setAttribute('aria-label', 'Edit conversation title');
        editButton.innerHTML = '<img src="assets/edit.png" alt="Edit Icon">';
        editButton.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent opening conversation details
            handleEditConversation(convo.startTime, convo.title, null);
        });

        const exportButton = document.createElement('button');
        exportButton.className = 'conversation-action-btn export-btn';
        exportButton.setAttribute('aria-label', 'Export conversation as JSON');
        exportButton.innerHTML = '<img src="assets/external-link.png" alt="Export Icon">';
        exportButton.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent opening conversation details
            handleExportConversation(convo);
        });

        actionsContainer.appendChild(editButton);
        actionsContainer.appendChild(exportButton);

        titleContainer.appendChild(title);
        titleContainer.appendChild(actionsContainer);

        conversationItem.appendChild(titleContainer);

        const duration = document.createElement('p');
        if (convo.endTime) {
            const durationMs = convo.endTime - convo.startTime;
            const minutes = Math.floor(durationMs / 60000);
            const seconds = Math.floor((durationMs % 60000) / 1000);
            duration.textContent = `Duration: ${minutes}m ${seconds}s`;
        } else {
            duration.textContent = 'Incomplete conversation';
        }
        
        const messageCount = document.createElement('p');
        messageCount.textContent = `${convo.messages.length} messages`;
        
        conversationItem.appendChild(duration);
        conversationItem.appendChild(messageCount);
        
        // Add click handler to show conversation details
        conversationItem.addEventListener('click', () => showConversationDetails(convo));
        
        conversationList.appendChild(conversationItem);
    });
}

// Function to show conversation details
function showConversationDetails(convo) {
    const modal = document.createElement('div');
    modal.className = 'conversations-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'modal-title');
    
    modal.innerHTML = `
        <div class="conversations-modal-content">
            <div class="modal-header">
                <h2 id="modal-title">${convo.title}</h2>
                <button class="close-modal" aria-label="Close conversation">&times;</button>
            </div>
            <div class="conversation-messages"></div>
        </div>
    `;

    const messagesContainer = modal.querySelector('.conversation-messages');
    convo.messages.forEach(msg => {
        const messageElement = document.createElement('div');
        messageElement.className = `message ${msg.role}`;
        
        const content = document.createElement('div');
        content.className = 'message-content';
        content.textContent = msg.content;
        messageElement.appendChild(content);
        
        const timestamp = document.createElement('div');
        timestamp.className = 'message-timestamp';
        timestamp.textContent = new Date(msg.timestamp).toLocaleTimeString();
        messageElement.appendChild(timestamp);
        
        if (msg.role === 'assistant' && msg.feeling) {
            const feeling = document.createElement('div');
            feeling.className = 'message-feeling';
            feeling.textContent = `Mood: ${getMoodEmoji(msg.feeling)}`;
            messageElement.appendChild(feeling);
        }
        
        messagesContainer.appendChild(messageElement);
    });

    document.body.appendChild(modal);

    // Handle modal close
    const closeBtn = modal.querySelector('.close-modal');
    closeBtn.onclick = () => {
        document.body.removeChild(modal);
    };

    // Close on outside click
    modal.onclick = (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    };

    // Close on escape key
    const handleEscape = (e) => {
        if (e.key === 'Escape') {
            document.body.removeChild(modal);
            document.removeEventListener('keydown', handleEscape);
        }
    };
    document.addEventListener('keydown', handleEscape);

    // Focus trap
    const focusableElements = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    const firstFocusableElement = focusableElements[0];
    const lastFocusableElement = focusableElements[focusableElements.length - 1];

    modal.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
            if (e.shiftKey) {
                if (document.activeElement === firstFocusableElement) {
                    lastFocusableElement.focus();
                    e.preventDefault();
                }
            } else {
                if (document.activeElement === lastFocusableElement) {
                    firstFocusableElement.focus();
                    e.preventDefault();
                }
            }
        }
    });

    // Focus the close button when modal opens
    closeBtn.focus();
}

// Function to handle view all conversations
function handleViewAllConversations() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const userPlan = currentUser ? currentUser.plan : 'free';
    
    // Disable View All Conversations for free plan users
    if (userPlan === 'free') {
        alert('View All Conversations is available with Plus or Pro plans. Please upgrade to access this feature.');
        return;
    }

    const convos = getConversations();
    if (convos.length === 0) {
        alert('No conversations available.');
        return;
    }

    // Create modal for all conversations
    const modal = document.createElement('div');
    modal.className = 'conversations-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'all-conversations-title');
    
    modal.innerHTML = `
        <div class="conversations-modal-content">
            <div class="modal-header">
                <h2 id="all-conversations-title">Past AI Conversations</h2>
                <button class="close-modal" aria-label="Close conversations list">&times;</button>
            </div>
            <div class="all-conversations-list"></div>
        </div>
    `;

    const conversationsList = modal.querySelector('.all-conversations-list');
    convos.reverse().forEach(convo => {
        const convoElement = document.createElement('div');
        convoElement.className = 'conversation-detail';
        convoElement.setAttribute('role', 'button');
        convoElement.setAttribute('tabindex', '0');
        convoElement.dataset.id = convo.startTime; // Unique ID for editing
        
        // Title and actions container
        const titleAndActions = document.createElement('div');
        titleAndActions.className = 'conversation-title-container';

        const title = document.createElement('h3');
        // Use a span for the text content within h3 so icons can be easily aligned
        const titleTextSpan = document.createElement('span');
        titleTextSpan.textContent = convo.title; // Use the actual conversation title
        title.appendChild(titleTextSpan);
        
        const actionsContainer = document.createElement('div');
        actionsContainer.className = 'conversation-actions';

        const editButton = document.createElement('button');
        editButton.className = 'conversation-action-btn edit-btn';
        editButton.setAttribute('aria-label', 'Edit conversation title');
        editButton.innerHTML = '<img src="assets/edit.png" alt="Edit Icon">';
        editButton.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent opening conversation details
            handleEditConversation(convo.startTime, convo.title, modal); // Pass modal reference
        });

        const exportButton = document.createElement('button');
        exportButton.className = 'conversation-action-btn export-btn';
        exportButton.setAttribute('aria-label', 'Export conversation as JSON');
        exportButton.innerHTML = '<img src="assets/external-link.png" alt="Export Icon">';
        exportButton.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent opening conversation details
            handleExportConversation(convo);
        });

        actionsContainer.appendChild(editButton);
        actionsContainer.appendChild(exportButton);

        titleAndActions.appendChild(title);
        titleAndActions.appendChild(actionsContainer);

        convoElement.appendChild(titleAndActions);
        
        const startInfo = document.createElement('p');
        startInfo.textContent = `Started: ${formatTimestamp(convo.startTime)}`;
        
        const messageCount = document.createElement('p');
        messageCount.textContent = `${convo.messages.length} messages`;
        messageCount.className = 'message-count';

        convoElement.appendChild(startInfo);
        convoElement.appendChild(messageCount);
        
        // Add click handler to show conversation details
        convoElement.addEventListener('click', () => {
            document.body.removeChild(modal); // Close the current modal
            showConversationDetails(convo); // Open details modal
        });
        
        // Add keyboard support
        convoElement.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                document.body.removeChild(modal); // Close the current modal
                showConversationDetails(convo);
            }
        });

        conversationsList.appendChild(convoElement);
    });

    document.body.appendChild(modal);

    // Handle modal close
    const closeBtn = modal.querySelector('.close-modal');
    closeBtn.onclick = () => {
        document.body.removeChild(modal);
    };

    // Close on outside click
    modal.onclick = (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    };

    // Close on escape key
    const handleEscape = (e) => {
        if (e.key === 'Escape') {
            document.body.removeChild(modal);
            document.removeEventListener('keydown', handleEscape);
        }
    };
    document.addEventListener('keydown', handleEscape);

    // Focus trap
    const focusableElements = modal.querySelectorAll('button, [tabindex]:not([tabindex="-1"])');
    const firstFocusableElement = focusableElements[0];
    const lastFocusableElement = focusableElements[focusableElements.length - 1];

    modal.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
            if (e.shiftKey) {
                if (document.activeElement === firstFocusableElement) {
                    lastFocusableElement.focus();
                    e.preventDefault();
                }
            } else {
                if (document.activeElement === lastFocusableElement) {
                    firstFocusableElement.focus();
                    e.preventDefault();
                }
            }
        }
    });

    // Focus the close button when modal opens
    closeBtn.focus();
}

// Function to delete all conversations
function deleteAllConversations() {
    if (confirm('Are you sure you want to delete all conversations? This action cannot be undone.')) {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        const userId = currentUser ? currentUser.email : 'guest';
        localStorage.removeItem(`aiConversations_${userId}`);
        displayMoodBoostActivities();
        displayPastConversations();
    }
}

// Function to handle editing a conversation title
function handleEditConversation(convoStartTime, currentTitle, modalToReopen = null) {
    console.log('handleEditConversation: Initiated for ID:', convoStartTime, 'Current Title:', currentTitle);
    const newTitle = prompt('Enter a new title for this conversation:', currentTitle);

    if (newTitle !== null && newTitle.trim() !== '' && newTitle !== currentTitle) {
        let convos = getConversations();
        const convoIndex = convos.findIndex(c => c.startTime === convoStartTime);
        console.log('handleEditConversation: Found convoIndex:', convoIndex, 'New Title proposed:', newTitle);

        if (convoIndex !== -1) {
            // Update the title in the conversation object
            convos[convoIndex].title = newTitle.trim();
            console.log('handleEditConversation: Conversations array BEFORE saving:', JSON.parse(JSON.stringify(convos)));
            saveConversations(convos); // Save updated conversations to localStorage
            console.log('handleEditConversation: Conversations array AFTER saving (from localStorage):', localStorage.getItem('aiConversations'));

            // Update currentConversationTitle in localStorage if this was the active convo
            const currentActiveConvoTitle = localStorage.getItem('currentConversationTitle');
            if (currentActiveConvoTitle === currentTitle) {
                localStorage.setItem('currentConversationTitle', newTitle.trim());
                console.log('handleEditConversation: Updated current active conversation title in localStorage.');
            }

            displayPastConversations(); // Re-render the main page list
            
            // Re-render the modal if it was open
            if (modalToReopen) {
                console.log('handleEditConversation: Modal was open, re-rendering.');
                document.body.removeChild(modalToReopen); // Remove the old modal
                handleViewAllConversations(); // Re-create and show the updated modal
            }
            console.log(`handleEditConversation: Conversation with ID ${convoStartTime} updated to: "${newTitle}"`);
        } else {
            console.warn(`handleEditConversation: Conversation with ID ${convoStartTime} not found for editing.`);
            alert('Error: Conversation not found.');
        }
    } else if (newTitle !== null && newTitle.trim() === '') {
        alert('Conversation title cannot be empty.');
        console.log('handleEditConversation: New title was empty.');
    } else {
        console.log('handleEditConversation: Edit cancelled or no change made.');
    }
}

// Function to handle exporting a conversation as JSON
function handleExportConversation(convo) {
    try {
        const jsonContent = JSON.stringify(convo, null, 2); // Pretty-print JSON
        const blob = new Blob([jsonContent], { type: 'application/json' });
        
        // Format filename: conversation_YYYY-MM-DD_HHMMSS.json
        const date = new Date(convo.startTime);
        const filename = `conversation_${date.getFullYear()}-
${String(date.getMonth() + 1).padStart(2, '0')}-
${String(date.getDate()).padStart(2, '0')}_
${String(date.getHours()).padStart(2, '0')}
${String(date.getMinutes()).padStart(2, '0')}
${String(date.getSeconds()).padStart(2, '0')}.json`;

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a); // Required for Firefox
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        console.log(`Conversation "${convo.title}" exported successfully.`);
    } catch (error) {
        console.error('Error exporting conversation:', error);
        alert('Failed to export conversation. Please try again.');
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

    // Remove old modal logic
    if (viewConvosBtn) {
        viewConvosBtn.addEventListener('click', handleViewAllConversations);
    }

    if (deleteAllConvosBtn) {
        deleteAllConvosBtn.addEventListener('click', deleteAllConversations);
    }

    // Initial display of activities and conversations
    console.log('Initializing history page display');
    displayMoodBoostActivities();
    displayPastConversations();
    renderEmotionChart();
});

// Emotion Chart
let emotionChartInstance = null;

function renderEmotionChart() {
    // Retrieve current user and plan
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const userPlan = currentUser ? currentUser.plan : 'free';
    const emotionChartContainer = document.getElementById('emotionChartContainer');

    if (userPlan === 'free') {
        console.log('Emotion Line Chart: Free plan detected, hiding chart.');
        if (emotionChartContainer) {
            emotionChartContainer.style.display = 'none';
        }
        return; // Do not render chart for free users
    } else {
        if (emotionChartContainer) {
            emotionChartContainer.style.display = 'block'; // Ensure visible for Plus/Pro
        }
    }

    const conversations = getConversations();
    const emotionsData = [];
    console.log('Rendering Emotion Chart. Conversations available:', conversations.length);

    const labels = [];
    const dataPoints = [];
    const emotionMap = {
        'happy': 5,
        'surprised': 4,
        'neutral': 3,
        'sad': 2,
        'fearful': 1,
        'angry': 0,
        'disgusted': 0
    };

    // Get the date for the chart title
    const today = new Date();
    const chartDate = today.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });

    conversations.forEach(convo => {
        convo.messages.forEach(msg => {
            if (msg.role === 'assistant' && msg.feeling) {
                const emotion = msg.feeling.toLowerCase();
                const mappedValue = emotionMap[emotion];
                console.log(`Processing message: ${msg.content.substring(0, 30)}...`);
                console.log(`Detected emotion: ${emotion}, Mapped value: ${mappedValue}`);
                
                // Parse the timestamp
                let dateObject;
                if (typeof msg.timestamp === 'number') {
                    // Handle Unix timestamp (milliseconds)
                    dateObject = new Date(msg.timestamp);
                } else if (typeof msg.timestamp === 'string') {
                    // Handle ISO string or other date string formats
                    dateObject = new Date(msg.timestamp);
                } else if (msg.timestamp instanceof Date) {
                    dateObject = msg.timestamp;
            } else {
                    console.warn(`Invalid timestamp format: ${msg.timestamp}. Skipping this data point.`);
                    return;
                }

                if (isNaN(dateObject.getTime())) {
                    console.warn(`Invalid date found for timestamp: ${msg.timestamp}. Skipping this data point.`);
                    return;
                }

                // Format only the time
                labels.push(dateObject.toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    hour12: true 
                }));
                dataPoints.push(mappedValue !== undefined ? mappedValue : 3);
            }
        });
    });

    console.log('Final chart labels:', labels);
    console.log('Final chart data points:', dataPoints);

    // Only create the chart if we have data
    if (labels.length === 0) {
        console.log('No valid data points found for the chart');
        return;
    }

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Emotional Trend',
                data: dataPoints,
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.3,
                fill: false,
                pointBackgroundColor: 'rgb(75, 192, 192)',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: 'rgb(75, 192, 192)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    top: 10,  // Further reduced top padding
                    right: 20,
                    bottom: 40,  // Increased bottom padding for time labels
                    left: 20
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: chartDate,
                    font: {
                        size: 18,
                        weight: 'bold'
                    },
                    padding: {
                        top: 0,
                        bottom: 10  // Reduced bottom padding of title
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: 'rgb(75, 192, 192)',
                    borderWidth: 1,
                    cornerRadius: 5,
                    displayColors: false,
                    callbacks: {
                        label: function(context) {
                            const value = context.raw;
                            const reverseEmotionMap = Object.keys(emotionMap).find(key => emotionMap[key] === value);
                            return `Emotion: ${reverseEmotionMap ? reverseEmotionMap.charAt(0).toUpperCase() + reverseEmotionMap.slice(1) : 'Unknown'}`;
                        }
                    }
                },
                legend: {
                    display: true,
                    labels: {
                        color: '#333'
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 5,
                    ticks: {
                        callback: function(value) {
                            const reverseEmotionMap = Object.keys(emotionMap).find(key => emotionMap[key] === value);
                            return reverseEmotionMap ? reverseEmotionMap.charAt(0).toUpperCase() + reverseEmotionMap.slice(1) : '';
                        },
                        color: '#666',
                        font: {
                            size: 14
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    title: {
                        display: true,
                        text: 'Emotion Level',
                        color: '#333',
                        font: {
                            size: 16,
                            weight: 'bold'
                        }
                    }
                },
                x: {
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45,
                        color: '#666',
                        font: {
                            size: 12
                        },
                        padding: 10  // Added padding to x-axis ticks
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    title: {
                        display: true,
                        text: 'Time',
                        color: '#333',
                        font: {
                            size: 16,
                            weight: 'bold'
                        },
                        padding: {
                            bottom: 10  // Added padding to x-axis title
                        }
                    }
                }
            }
            }
        });
    }