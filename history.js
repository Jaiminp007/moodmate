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
    renderEmotionChart(); // Call the new chart rendering function
    
    if (viewConvosBtn) {
        viewConvosBtn.addEventListener('click', handleViewAllConversations);
    }

    if (deleteAllConvosBtn) {
        deleteAllConvosBtn.addEventListener('click', deleteAllConversations);
    }
});

// New function for Emotion Chart
function renderEmotionChart() {
    const ctx = document.getElementById('emotion-chart').getContext('2d');
    const conversations = getConversations();
    
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