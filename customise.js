// Get DOM elements for settings modal and theme
const settingsModal = document.getElementById('settings-modal');
const settingsBtn = document.getElementById('settings-btn');
const closeSettingsBtn = document.getElementById('close-settings');
const darkModeToggle = document.getElementById('darkModeToggleModal');

// Get DOM elements for new customise preferences
const responseLengthSelect = document.getElementById('responseLength');
const triggerDetectionToggle = document.getElementById('triggerDetection');
const triggerWordInputContainer = document.getElementById('triggerWordInputContainer');
const triggerWordInput = document.getElementById('triggerWord');
const moodLoggingToggle = document.getElementById('moodLogging');
const dataRetentionSelect = document.getElementById('dataRetention');
const preferredNameInput = document.getElementById('preferredName');
const faceTrackingToggle = document.getElementById('faceTracking');

// Get DOM elements for AI voice selection
const aiVoiceSelectionSection = document.getElementById('aiVoiceSelectionSection');
const aiVoiceSelect = document.getElementById('aiVoiceSelect');
const playVoiceSampleBtn = document.getElementById('playVoiceSample');

// Get DOM elements for AI Journal Summaries
const aiJournalSummariesSection = document.getElementById('aiJournalSummariesSection');
const generateSummaryBtn = document.getElementById('generateSummaryBtn');
const summaryLoading = document.getElementById('summaryLoading');
const journalSummaryText = document.getElementById('journalSummaryText');
const journalMoodChartCanvas = document.getElementById('journalMoodChart');
const journalActivities = document.getElementById('journalActivities');
const exportSummaryBtn = document.getElementById('exportSummaryBtn');

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

// Function to populate voice list
function populateVoiceList() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const userPlan = currentUser ? currentUser.plan : 'free';
    const voiceSelect = document.getElementById('aiVoiceSelect');
    
    if (userPlan === 'free') {
        voiceSelect.disabled = true;
        voiceSelect.style.opacity = '0.5';
        voiceSelect.title = 'Upgrade to Plus or Pro plan to customize AI voice';
        return;
    }
    
    // Enable voice selection for Plus/Pro users
    voiceSelect.disabled = false;
    voiceSelect.style.opacity = '1';
    voiceSelect.title = '';
    
    if (typeof speechSynthesis === 'undefined') {
        console.warn('SpeechSynthesis not supported, cannot populate voices.');
        return;
    }

    const voices = speechSynthesis.getVoices();
    
    if (!voiceSelect) {
        console.warn('Voice select element not found');
        return;
    }

    // Clear existing options
    voiceSelect.innerHTML = '';
    
    // Add default option
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Select AI Voice';
    voiceSelect.appendChild(defaultOption);

    // Add voice options
    voices.forEach(voice => {
        if (voice.lang.startsWith('en-')) {
            const option = document.createElement('option');
            option.value = voice.voiceURI;
            option.textContent = `${voice.name} (${voice.lang})`;
            voiceSelect.appendChild(option);
        }
    });

    // Set saved voice if exists
    const savedVoice = localStorage.getItem('selectedAiVoice');
    if (savedVoice) {
        voiceSelect.value = savedVoice;
    }
}

// Event listener for when voices are loaded/changed
if (typeof speechSynthesis !== 'undefined') {
    speechSynthesis.onvoiceschanged = populateVoiceList;
}

// --- Functions to save and load individual preferences ---
function savePreference(key, value) {
  localStorage.setItem(key, value);
}

function loadPreferences() {
  // Retrieve current user and plan
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  const userPlan = currentUser ? currentUser.plan : 'free'; // Default to free if no user or plan
  console.log('Loading preferences for plan:', userPlan);

  // Response Preferences
  if (responseLengthSelect) responseLengthSelect.value = localStorage.getItem('responseLength') || 'short';
  if (triggerDetectionToggle) {
      // Trigger Word Detection: Pro plan only
      if (userPlan === 'pro') {
          triggerDetectionToggle.checked = localStorage.getItem('triggerDetection') === 'true';
          triggerDetectionToggle.disabled = false;
          triggerWordInputContainer.style.display = triggerDetectionToggle.checked ? 'block' : 'none';
      } else {
          triggerDetectionToggle.checked = false;
          triggerDetectionToggle.disabled = true; // Disable toggle
          triggerWordInputContainer.style.display = 'none'; // Hide input
      }
      updateTriggerWordVisibility(); // Call to set initial visibility based on new logic
  }
  if (triggerWordInput) {
      triggerWordInput.value = localStorage.getItem('triggerWord') || '';
      triggerWordInput.disabled = userPlan !== 'pro'; // Disable input if not Pro
  }
  
  // Mood Tracking Preferences
  if (moodLoggingToggle) moodLoggingToggle.checked = localStorage.getItem('moodLogging') === 'true';
  if (dataRetentionSelect) dataRetentionSelect.value = localStorage.getItem('dataRetention') || '7';

  // Tracking Preferences
  if (faceTrackingToggle) {
      // Face Expression Tracking: Pro plan only
      if (userPlan === 'pro') {
          faceTrackingToggle.checked = localStorage.getItem('faceTrackingEnabled') === 'true';
          faceTrackingToggle.disabled = false;
      } else {
          faceTrackingToggle.checked = false;
          faceTrackingToggle.disabled = true; // Disable toggle
      }
  }

  // Optional Preferences
  if (preferredNameInput) preferredNameInput.value = localStorage.getItem('preferredName') || '';

  // AI Voice Preference: Plus and Pro plans only
  if (aiVoiceSelectionSection) {
      if (userPlan === 'plus' || userPlan === 'pro') {
          aiVoiceSelectionSection.style.display = 'block'; // Show section
          if (aiVoiceSelect) {
              aiVoiceSelect.disabled = false;
              populateVoiceList(); // Populate voices first
              const savedVoiceURI = localStorage.getItem('selectedAiVoice');
              if (savedVoiceURI) {
                  aiVoiceSelect.value = savedVoiceURI;
              }
          }
          if (playVoiceSampleBtn) playVoiceSampleBtn.disabled = false;
      } else {
          aiVoiceSelectionSection.style.display = 'none'; // Hide section
          if (aiVoiceSelect) aiVoiceSelect.disabled = true;
          if (playVoiceSampleBtn) playVoiceSampleBtn.disabled = true;
      }
  }

  // AI Journal Summaries: Plus and Pro plans only
  if (aiJournalSummariesSection) {
      if (userPlan === 'plus' || userPlan === 'pro') {
          aiJournalSummariesSection.style.display = 'block'; // Show section
          if (generateSummaryBtn) generateSummaryBtn.disabled = false;
          if (exportSummaryBtn) exportSummaryBtn.disabled = false;
      } else {
          aiJournalSummariesSection.style.display = 'none'; // Hide section
          if (generateSummaryBtn) generateSummaryBtn.disabled = true;
          if (exportSummaryBtn) exportSummaryBtn.disabled = true;
      }
  }
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
  if (triggerDetectionToggle && !triggerDetectionToggle.disabled) {
      triggerDetectionToggle.addEventListener('change', (e) => {
          savePreference('triggerDetection', e.target.checked);
          updateTriggerWordVisibility();
      });
  }
  if (triggerWordInput && !triggerWordInput.disabled) {
      triggerWordInput.addEventListener('input', (e) => {
          savePreference('triggerWord', e.target.value);
      });
  }
  if (moodLoggingToggle) moodLoggingToggle.addEventListener('change', (e) => savePreference('moodLogging', e.target.checked));
  if (dataRetentionSelect) dataRetentionSelect.addEventListener('change', (e) => savePreference('dataRetention', e.target.value));
  if (preferredNameInput) preferredNameInput.addEventListener('input', (e) => savePreference('preferredName', e.target.value));
  if (faceTrackingToggle && !faceTrackingToggle.disabled) {
      faceTrackingToggle.addEventListener('change', (e) => savePreference('faceTrackingEnabled', e.target.checked));
  }

  // AI Voice Selection Event Listeners
  if (aiVoiceSelect && !aiVoiceSelect.disabled) {
      aiVoiceSelect.addEventListener('change', (e) => {
          const selectedVoiceURI = e.target.value;
          localStorage.setItem('selectedAiVoice', selectedVoiceURI);
          console.log('Selected AI Voice saved:', selectedVoiceURI);
      });
  }

  if (playVoiceSampleBtn && !playVoiceSampleBtn.disabled) {
      playVoiceSampleBtn.addEventListener('click', () => {
          const selectedVoiceURI = aiVoiceSelect.value;
          const sampleText = 'Hello, this is a sample of my voice.';
          const utterance = new SpeechSynthesisUtterance(sampleText);

          const selectedVoice = voices.find(voice => voice.voiceURI === selectedVoiceURI);
          if (selectedVoice) {
              utterance.voice = selectedVoice;
              speechSynthesis.speak(utterance);
          } else {
              console.warn('No voice selected or selected voice not found.');
              alert('Please select a voice first.');
          }
      });
  }

  // AI Journal Summaries Event Listeners
  if (generateSummaryBtn && !generateSummaryBtn.disabled) {
      generateSummaryBtn.addEventListener('click', generateSummary);
  }

  if (exportSummaryBtn && !exportSummaryBtn.disabled) {
      exportSummaryBtn.addEventListener('click', exportSummary);
  }

  // Explicitly register Chart.js adapter for date-fns and core components
  if (typeof Chart !== 'undefined' && typeof ChartjsAdapterDateFns !== 'undefined') {
      // Register necessary Chart.js components and the date adapter
      const {
          LinearScale, CategoryScale, TimeScale, Tooltip, Title, Legend, LineController, PointElement, LineElement
      } = Chart;

      Chart.register(
          LinearScale, CategoryScale, TimeScale,
          Tooltip, Title, Legend,
          LineController, PointElement, LineElement,
          ChartjsAdapterDateFns // Register the adapter
      );
      console.log('Customise.js: Chart.js core components and ChartjsAdapterDateFns registered.');
  } else {
      console.warn('Customise.js: Chart.js or ChartjsAdapterDateFns not available for registration. Check CDN loading.');
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

// Utility functions for conversations (copied from history.js to ensure accessibility)
function getConversations() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const userId = currentUser ? currentUser.email : 'guest';
    const data = localStorage.getItem(`aiConversations_${userId}`);
    return data ? JSON.parse(data) : [];
}

function saveConversations(conversations) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const userId = currentUser ? currentUser.email : 'guest';
    localStorage.setItem(`aiConversations_${userId}`, JSON.stringify(conversations));
}

// Function to get emoji for mood (copied from history.js)
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

// Function to generate the AI Journal Summary
let journalChartInstance = null; // To store the Chart.js instance

async function generateSummary() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const userPlan = currentUser ? currentUser.plan : 'free';
    
    // Disable AI Journal Summaries for free plan users
    if (userPlan === 'free') {
        if (summaryLoading) summaryLoading.style.display = 'none';
        if (journalSummaryText) {
            journalSummaryText.style.display = 'block';
            journalSummaryText.innerHTML = '<p>AI Journal Summaries are available with Plus or Pro plans. Please upgrade to access this feature.</p>';
        }
        if (journalMoodChartCanvas) journalMoodChartCanvas.style.display = 'none';
        if (journalActivities) {
            journalActivities.innerHTML = '';
            journalActivities.style.display = 'none';
        }
        if (exportSummaryBtn) exportSummaryBtn.style.display = 'none';
        return;
    }

    // Show loading, hide content
    if (summaryLoading) summaryLoading.style.display = 'flex';
    if (journalSummaryText) journalSummaryText.style.display = 'none';
    if (journalMoodChartCanvas) journalMoodChartCanvas.style.display = 'none';
    if (journalActivities) journalActivities.style.display = 'none';
    if (exportSummaryBtn) exportSummaryBtn.style.display = 'none';

    // Destroy existing chart instance before creating a new one if any
    if (journalChartInstance) {
        console.log('Customise.js: Destroying existing chart instance.');
        journalChartInstance.destroy();
        journalChartInstance = null; // Clear reference
        console.log('Customise.js: Chart instance destroyed and nulled.');
    }

    const conversations = getConversations();

    if (conversations.length === 0) {
        if (summaryLoading) summaryLoading.style.display = 'none';
        if (journalSummaryText) {
            journalSummaryText.style.display = 'block';
            journalSummaryText.innerHTML = '<p>No journal entries (conversations) found to summarize.</p>';
        }
        // Ensure chart is hidden if no conversations
        if (journalMoodChartCanvas) journalMoodChartCanvas.style.display = 'none';
        if (journalActivities) {
            journalActivities.innerHTML = ''; // Clear activities
            journalActivities.style.display = 'none';
        }
        return;
    }

    const chartLabels = [];
    const chartDataPoints = [];
    const emotionMap = {
        'happy': 5,
        'surprised': 4,
        'neutral': 3,
        'sad': 2,
        'fearful': 1,
        'angry': 0,
        'disgusted': 0
    };
    const uniqueActivities = new Set();

    let earliestTimestamp = Infinity;
    let latestTimestamp = 0;
    let totalMoodScore = 0;
    let moodEntryCount = 0;

    conversations.forEach(convo => {
        convo.messages.forEach(msg => {
            // First, check if essential properties exist and are of expected types
            if (msg.role === 'assistant' && msg.feeling && (typeof msg.timestamp === 'number' || typeof msg.timestamp === 'string' || msg.timestamp instanceof Date)) {
                
                const emotion = msg.feeling.toLowerCase();
                const mappedValue = emotionMap[emotion];
                
                let dateObject;
                if (typeof msg.timestamp === 'number') {
                    dateObject = new Date(msg.timestamp);
                } else if (typeof msg.timestamp === 'string') {
                    // Attempt to parse string timestamp
                    dateObject = new Date(msg.timestamp);
                } else if (msg.timestamp instanceof Date) {
                    dateObject = msg.timestamp;
                }

                // Crucial validation: Ensure dateObject is valid AND mappedValue is defined
                if (dateObject instanceof Date && !isNaN(dateObject.getTime()) && mappedValue !== undefined) {
                    console.log('Customise.js: Valid data point found. Timestamp:', msg.timestamp, 'DateObject:', dateObject, 'Mapped Value:', mappedValue);
                    console.assert(dateObject instanceof Date, 'Customise.js: dateObject should be a Date instance.', dateObject);
                    console.assert(mappedValue !== undefined, 'Customise.js: mappedValue should not be undefined.', mappedValue);

                    chartLabels.push(dateObject); // Push Date object for time scale
                    chartDataPoints.push(mappedValue);

                    totalMoodScore += mappedValue;
                    moodEntryCount++;

                    if (dateObject.getTime() < earliestTimestamp) earliestTimestamp = dateObject.getTime();
                    if (dateObject.getTime() > latestTimestamp) latestTimestamp = dateObject.getTime();
                } else {
                    console.warn(`Customise.js: Skipping invalid mood data point after parsing. Date valid: ${!isNaN(dateObject.getTime())}, Mapped value defined: ${mappedValue !== undefined}. Original Timestamp: ${msg.timestamp}, Processed Date: ${dateObject}, Emotion: ${msg.feeling}, Mapped Value: ${mappedValue}`);
                }
            } else {
                console.warn(`Customise.js: Skipping message due to missing/invalid essential properties. Message:`, msg);
            }
            if (msg.role === 'assistant' && msg.activities && Array.isArray(msg.activities)) {
                msg.activities.forEach(activity => uniqueActivities.add(activity));
            }
        });
    });

    // Render Chart
    if (chartLabels.length > 0 && journalMoodChartCanvas) {
        console.log('Customise.js: Preparing to render chart.');
        // Ensure any existing chart instance on the canvas is destroyed
        if (journalMoodChartCanvas.chart) {
            console.log('Customise.js: Found active chart on canvas (`.chart` property), destroying it.');
            journalMoodChartCanvas.chart.destroy();
            journalMoodChartCanvas.chart = null; // Clear the reference on the canvas itself
            console.log('Customise.js: Active chart on canvas destroyed and reference cleared.');
        }
        if (journalChartInstance) {
            console.log('Customise.js: Found journalChartInstance variable, destroying it.');
            journalChartInstance.destroy();
            journalChartInstance = null; // Clear reference
            console.log('Customise.js: journalChartInstance variable destroyed and nulled.');
        }

        requestAnimationFrame(() => {
            console.log('Customise.js: Inside requestAnimationFrame, attempting to create new chart.');
            const ctx = journalMoodChartCanvas.getContext('2d');

            if (!ctx) {
                console.error('Customise.js: Failed to get 2D rendering context for canvas.');
                if (summaryLoading) summaryLoading.style.display = 'none';
                if (journalSummaryText) {
                    journalSummaryText.style.display = 'block';
                    journalSummaryText.innerHTML = '<p>Error: Could not prepare chart. Please try again.</p>';
                }
                return;
            }

            console.log('Customise.js: Chart data being passed:', {
                labels: chartLabels.map(d => d.toISOString()), // Log ISO strings for clarity
                dataPoints: chartDataPoints
            });
            console.log('Customise.js: Type of first chartLabel:', chartLabels.length > 0 ? typeof chartLabels[0] : 'N/A', 'Value:', chartLabels.length > 0 ? chartLabels[0] : 'N/A');
            console.log('Customise.js: Is first chartLabel a Date instance?', chartLabels.length > 0 ? (chartLabels[0] instanceof Date) : 'N/A');

            journalChartInstance = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: chartLabels,
                    datasets: [{
                        label: 'Mood Trend Over Time',
                        data: chartDataPoints,
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
                    scales: {
                        x: {
                            type: 'time',
                            time: {
                                unit: 'day', // Default unit, Chart.js will adjust based on data density
                                tooltipFormat: 'MMM d, yyyy h:mm a',
                                displayFormats: {
                                    hour: 'h a',
                                    day: 'MMM d',
                                    month: 'MMM yyyy',
                                    year: 'yyyy'
                                }
                            },
                            title: {
                                display: true,
                                text: 'Date and Time',
                                color: 'var(--text-color)',
                                font: { size: 14 }
                            },
                            ticks: {
                                color: 'var(--text-color)',
                                font: { size: 12 }
                            },
                            grid: {
                                color: 'rgba(0, 0, 0, 0.1)' // Adjust for dark/light mode
                            }
                        },
                        y: {
                            beginAtZero: true,
                            max: 5,
                            ticks: {
                                callback: function(value) {
                                    const reverseEmotionMap = Object.keys(emotionMap).find(key => emotionMap[key] === value);
                                    return reverseEmotionMap ? reverseEmotionMap.charAt(0).toUpperCase() + reverseEmotionMap.slice(1) : '';
                                },
                                color: 'var(--text-color)',
                                font: { size: 12 }
                            },
                            title: {
                                display: true,
                                text: 'Emotion Level',
                                color: 'var(--text-color)',
                                font: { size: 14 }
                            },
                            grid: {
                                color: 'rgba(0, 0, 0, 0.1)' // Adjust for dark/light mode
                            }
                        }
                    },
                    plugins: {
                        title: {
                            display: true,
                            text: 'Your Mood Trend',
                            font: { size: 16, weight: 'bold' },
                            color: 'var(--text-color)'
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const value = context.raw;
                                    const reverseEmotionMap = Object.keys(emotionMap).find(key => emotionMap[key] === value);
                                    return `Emotion: ${reverseEmotionMap ? reverseEmotionMap.charAt(0).toUpperCase() + reverseEmotionMap.slice(1) : 'Unknown'}`;
                                }
                            }
                        }
                    },
                    layout: { // Add padding to ensure labels are not cut off
                        padding: { left: 10, right: 10, top: 10, bottom: 10 }
                    }
                }
            });
            console.log('Customise.js: New chart instance created.', journalChartInstance);
            if (journalMoodChartCanvas) journalMoodChartCanvas.style.display = 'block';
        });
    } else if (journalMoodChartCanvas) {
        // If no chart data, ensure chart is hidden and destroy existing instance
        console.log('Customise.js: No chart data detected or canvas not available. Attempting to destroy any active chart.');
        if (journalChartInstance) {
            console.log('Customise.js: No chart data, destroying existing journalChartInstance.');
            journalChartInstance.destroy();
            journalChartInstance = null;
        }
        if (journalMoodChartCanvas.chart) {
            console.log('Customise.js: No chart data, destroying active chart on canvas (`.chart` property).');
            journalMoodChartCanvas.chart.destroy();
            journalMoodChartCanvas.chart = null;
        }
        journalMoodChartCanvas.style.display = 'none';
    }

    // Generate Summary Text
    let summaryText = `<h4>Journal Summary:</h4>`;
    summaryText += `<p>You have had <strong>${conversations.length}</strong> conversations with MoodMate AI.`;
    if (moodEntryCount > 0) {
        const avgMood = totalMoodScore / moodEntryCount;
        const overallEmotion = Object.keys(emotionMap).find(key => {
            const value = emotionMap[key];
            if (value === 0) return avgMood >= 0 && avgMood < 1; // Angry/Disgusted range
            if (value === 1) return avgMood >= 1 && avgMood < 2; // Fearful
            if (value === 2) return avgMood >= 2 && avgMood < 3; // Sad
            if (value === 3) return avgMood >= 3 && avgMood < 4; // Neutral
            if (value === 4) return avgMood >= 4 && avgMood < 5; // Surprised
            if (value === 5) return avgMood >= 5; // Happy
            return false;
        });
        
        if (earliestTimestamp !== Infinity && latestTimestamp !== 0) {
            const startDate = new Date(earliestTimestamp).toLocaleDateString();
            const endDate = new Date(latestTimestamp).toLocaleDateString();
            summaryText += ` Your conversations span from <strong>${startDate}</strong> to <strong>${endDate}</strong>.`;
        }

        summaryText += ` Overall, your mood trend has been towards <strong>${overallEmotion ? overallEmotion.charAt(0).toUpperCase() + overallEmotion.slice(1) : 'varied'}</strong> emotions, as visualized in the chart above.`;
    } else {
        summaryText += ` No mood data was logged in your conversations.`;
    }

    if (journalSummaryText) {
        journalSummaryText.innerHTML = summaryText;
        journalSummaryText.style.display = 'block';
    }

    // Display Activities
    if (journalActivities) {
        if (uniqueActivities.size > 0) {
            let activitiesHTML = `<h4>Suggested Activities to Boost Mood:</h4><ul>`;
            uniqueActivities.forEach(activity => {
                activitiesHTML += `<li>🎯 ${activity}</li>`;
            });
            activitiesHTML += `</ul>`;
            journalActivities.innerHTML = activitiesHTML;
            journalActivities.style.display = 'block';
        } else {
            journalActivities.innerHTML = `<p>No specific mood-boosting activities found in your past conversations.</p>`;
            journalActivities.style.display = 'block';
        }
    }

    // Show export button
    if (exportSummaryBtn) exportSummaryBtn.style.display = 'block';

    // Hide loading spinner
    if (summaryLoading) summaryLoading.style.display = 'none';
}

// Function to export the summary as an HTML file
async function exportSummary() {
    const summaryContent = journalSummaryText ? journalSummaryText.innerHTML : '';
    const activitiesContent = journalActivities ? journalActivities.innerHTML : '';
    let chartImage = '';

    if (journalMoodChartCanvas && journalChartInstance) {
        // Ensure the chart has rendered before trying to get its image
        await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
        chartImage = journalMoodChartCanvas.toDataURL('image/png');
    }

    const exportHtml = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>MoodMate AI Journal Summary</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 20px auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
                h1, h2, h4 { color: #1B263B; }
                ul { list-style: none; padding: 0; }
                li { margin-bottom: 5px; }
                img { max-width: 100%; height: auto; display: block; margin: 20px 0; border: 1px solid #eee; border-radius: 8px; }
                .footer { margin-top: 30px; font-size: 0.9em; color: #777; text-align: center; }
            </style>
        </head>
        <body>
            <h1>MoodMate AI Journal Summary</h1>
            <div id="summary-content">${summaryContent}</div>
            ${chartImage ? `<img src="${chartImage}" alt="Mood Trend Chart">` : ''}
            <div id="activities-content">${activitiesContent}</div>
            <div class="footer">
                <p>Generated by MoodMate AI on ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</p>
                <p>This summary is based on your conversations with MoodMate AI. It is for informational purposes only and not a substitute for professional advice.</p>
            </div>
        </body>
        </html>
    `;

    const blob = new Blob([exportHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const date = new Date();
    const filename = `journal_summary_${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}.html`;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Function to update trigger word input visibility
function updateTriggerWordVisibility() {
    if (triggerWordInputContainer && triggerDetectionToggle) {
        if (triggerDetectionToggle.checked) {
            triggerWordInputContainer.style.display = 'flex';
        } else {
            triggerWordInputContainer.style.display = 'none';
            if (triggerWordInput) {
                triggerWordInput.value = ''; // Clear input when toggle is off
                localStorage.removeItem('triggerWord'); // Remove from storage
            }
        }
    }
} 