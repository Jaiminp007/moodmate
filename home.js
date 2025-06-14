// Test comment to check edit functionality
// Get DOM elements
const settingsModal = document.getElementById('settings-modal');
const settingsBtn = document.getElementById('settings-btn');
const closeSettingsBtn = document.getElementById('close-settings');

const mainThemeToggle = document.getElementById('theme-toggle'); // Navbar toggle
const modalThemeToggle = document.getElementById('darkModeToggleModal'); // Modal toggle

const emotionText = document.getElementById('emotionText');
const mainBubble = document.querySelector('.main-bubble'); // Get main bubble element
const bubbleGroup = document.querySelector('.bubble-group'); // Get bubble group for listening class

// Define states
const states = {
    IDLE: 'idle',
    LISTENING: 'listening',
    PROCESSING: 'processing',
    SPEAKING: 'speaking',
    ERROR: 'error'
};

let currentState = states.IDLE;
let recognition = null;
let utterance = null;
let audioContext = null;
let animationFrameId = null;
let stream = null; // To hold the media stream
let voices = []; // Global array to store speech synthesis voices

// Function to set the theme and update toggles
function setTheme(isLightMode) {
  if (isLightMode) {
    document.body.classList.add('light-mode');
  } else {
    document.body.classList.remove('light-mode');
  }
  // Update toggle states: checked = dark mode
  if (mainThemeToggle) mainThemeToggle.checked = !isLightMode;
  if (modalThemeToggle) modalThemeToggle.checked = !isLightMode;
  localStorage.setItem('lightMode', isLightMode);
}

// Function to load and populate voices in the dropdown (for home.js)
function populateVoiceListHome() {
    if (typeof speechSynthesis === 'undefined') {
        console.warn('SpeechSynthesis not supported, cannot populate voices.');
        return;
    }
    voices = speechSynthesis.getVoices();
    console.log('Home.js: Populated voices.', voices.map(v => `${v.name} (${v.lang})`));
}

// Function to initialize theme based on stored preference
function initializeTheme() {
  const storedPreference = localStorage.getItem('lightMode');
  let isLightMode = false; // Default to dark mode

  if (storedPreference === 'true') {
    isLightMode = true;
  } else if (storedPreference === 'false') {
    isLightMode = false;
  }
  setTheme(isLightMode);
}

// Function to open settings modal
function openSettingsModal() {
  if (settingsModal) {
    settingsModal.style.display = 'flex';
    if (modalThemeToggle) {
        modalThemeToggle.checked = !document.body.classList.contains('light-mode');
    }
  } else {
    console.error("Settings modal not found");
  }
}

// Function to close settings modal
function closeSettingsModal() {
  if (settingsModal) {
    settingsModal.style.display = 'none';
  } else {
    console.error("Settings modal not found for closing");
  }
}

// Function to handle logout
function handleLogout() {
  // Clear current user data
  localStorage.removeItem('currentUser');
  // Redirect to login page
  window.location.href = 'login.html';
}

// Function to create a new user with default credits
function createNewUser(email, password) {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const newUser = {
        email: email,
        password: password, // In a real app, hash this!
        isLoggedIn: true,
        conversationCredits: 10 // Default free credits
    };
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    localStorage.setItem('currentUser', JSON.stringify(newUser));
    console.log(`New user ${email} created with 10 conversation credits.`);
    return newUser;
}

// Function to update the current user's data in localStorage
function updateCurrentUser(updatedUserData) {
    localStorage.setItem('currentUser', JSON.stringify(updatedUserData));
    // Also update in the main users array
    const allUsers = JSON.parse(localStorage.getItem('users')) || [];
    const userIndex = allUsers.findIndex(user => user.email === updatedUserData.email);
    if (userIndex !== -1) {
        allUsers[userIndex] = updatedUserData;
        localStorage.setItem('users', JSON.stringify(allUsers));
    }
}

// Function to handle account deletion
function handleDeleteAccount() {
  if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (currentUser) {
      // Get all users
      const users = JSON.parse(localStorage.getItem('users')) || [];
      // Remove the current user
      const updatedUsers = users.filter(user => user.email !== currentUser.email);
      // Update users in localStorage
      localStorage.setItem('users', JSON.stringify(updatedUsers));
      // Clear current user data
      localStorage.removeItem('currentUser');
      // Clear any other user-specific data
      localStorage.removeItem('aiConversations');
      // Redirect to login page
      window.location.href = 'login.html';
    }
  }
}

// Function to save message to current conversation
function saveMessageToConversation(role, content, analysis = null) {
    console.log('=== saveMessageToConversation called ===');
    console.log('Parameters:', { role, content, analysis });

    const convos = getConversations();
    console.log('Current conversations from localStorage:', convos);

    const currentTitle = localStorage.getItem('currentConversationTitle');
    console.log('Current conversation title from localStorage:', currentTitle);

    let convo = convos.find(c => c.title === currentTitle);
    if (!convo) {
        console.log('No existing conversation found, creating new one');
        convo = startNewConversation();
        console.log('New conversation created:', convo);
    } else {
        console.log('Found existing conversation:', convo);
    }

    const message = {
        role,
        content,
        timestamp: Date.now()
    };

    if (role === 'assistant' && analysis) {
        console.log('Adding analysis data to message:', analysis);
        message.feeling = analysis.feeling;
        message.tone = analysis.tone;
        message.activities = analysis.activities;
        console.log('Message with analysis:', message);
    }

    console.log('Adding message to conversation:', message);
    convo.messages.push(message);
    console.log('Updated conversation after adding message:', convo);

    saveConversations(convos);
    console.log('=== saveMessageToConversation completed ===');
}

// Function to get trigger word preference
function getTriggerWordPreference() {
    const triggerDetectionEnabled = localStorage.getItem('triggerDetection') === 'true';
    const triggerWord = localStorage.getItem('triggerWord');
    return {
        enabled: triggerDetectionEnabled,
        word: triggerWord ? triggerWord.toLowerCase() : null
    };
}

// Function to check and decrement conversation credits (now handles both logged-in and guest)
function checkAndDecrementCredits() {
    let currentUser = JSON.parse(localStorage.getItem('currentUser'));

    if (currentUser && currentUser.isLoggedIn) {
        // Check for unlimited credits based on plan
        if (currentUser.plan === 'plus' || currentUser.plan === 'pro') {
            console.log(`checkAndDecrementCredits: User is on ${currentUser.plan} plan, unlimited credits.`);
            return true; // Unlimited credits for Plus and Pro plans
        }

        // Logged-in user's credits (for 'free' plan)
        if (currentUser.conversationCredits === undefined || currentUser.conversationCredits === null) {
            console.log('checkAndDecrementCredits: Logged-in user has no conversationCredits property, initializing to 10.');
            currentUser.conversationCredits = 10;
            updateCurrentUser(currentUser);
        }

        if (currentUser.conversationCredits > 0) {
            currentUser.conversationCredits--;
            updateCurrentUser(currentUser);
            console.log(`checkAndDecrementCredits: Logged-in user (free plan) conversation started. Credits remaining: ${currentUser.conversationCredits}`);
            return true;
        } else {
            console.log(`checkAndDecrementCredits: Logged-in user (free plan) credits exhausted (${currentUser.conversationCredits}). Redirecting to login.html`);
            alert('You have used all your free conversations. Please log in or create an account to continue.');
            window.location.href = 'login.html';
            return false;
        }
    } else {
        // Guest user's credits
        let guestCredits = parseInt(localStorage.getItem('guestConversationCredits') || '0', 10);
        console.log(`checkAndDecrementCredits: Guest credit check during AI response. Current guestCredits from localStorage: ${guestCredits}`);

        if (guestCredits > 0) {
            guestCredits--;
            localStorage.setItem('guestConversationCredits', guestCredits);
            console.log(`checkAndDecrementCredits: Guest conversation credit consumed. Credits remaining: ${guestCredits}`);
            return true;
        } else {
            // Credits are 0 or invalid at the point of AI response
            console.log(`checkAndDecrementCredits: Guest credits exhausted (${guestCredits}). Redirecting to login.html`);
            alert('You have used all your free conversations. Please log in or create an account to continue.');
            window.location.href = 'login.html';
            return false;
        }
    }
}

// New function to ensure guest credits are initialized and handle immediate redirect on exhaustion
function ensureGuestCredits() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (currentUser && currentUser.isLoggedIn) {
        console.log('ensureGuestCredits: User is logged in, skipping guest credit check.');
        return; // Only for guests
    }

    let guestCredits = localStorage.getItem('guestConversationCredits');
    console.log(`ensureGuestCredits: Raw guestCredits from localStorage: '${guestCredits}'`);

    if (guestCredits === null) {
        console.log('ensureGuestCredits: Initializing guestConversationCredits to 10 for new guest.');
        localStorage.setItem('guestConversationCredits', '10');
    } else if (parseInt(guestCredits, 10) <= 0) {
        console.log('ensureGuestCredits: Guest credits exhausted, redirecting to login on page load.');
        window.location.href = 'login.html';
    }
    console.log('ensureGuestCredits: Final guest credits after initialization check:', localStorage.getItem('guestConversationCredits'));
}

// Function to get user customization summary from localStorage
function getUserCustomisationSummary() {
    const responseLength = localStorage.getItem('responseLength') || 'short';
    const moodLogging = localStorage.getItem('moodLogging') === 'true';
    const dataRetention = localStorage.getItem('dataRetention') || '7';
    const preferredName = localStorage.getItem('preferredName') || '';
    const triggerDetection = localStorage.getItem('triggerDetection') === 'true';
    const faceTrackingEnabled = localStorage.getItem('faceTrackingEnabled') === 'true';

    let summary = `User preferences: Response length: ${responseLength}. Mood logging: ${moodLogging ? 'on' : 'off'}. Data retention: ${dataRetention} days. Trigger detection: ${triggerDetection ? 'on' : 'off'}. Face tracking: ${faceTrackingEnabled ? 'on' : 'off'}.`;
    if (preferredName) {
        summary += ` Preferred name: ${preferredName}.`;
    }
    return summary;
}

// Function to speak text using Web Speech API
function speakText(text) {
    if ('speechSynthesis' in window) {
        const synthesis = window.speechSynthesis;
        if (synthesis.speaking) {
            synthesis.cancel();
        }

        utterance = new SpeechSynthesisUtterance(text);

        // Ensure voices are loaded; if not, try to load them
        if (voices.length === 0) {
            populateVoiceListHome();
        }

        let selectedVoice = null;

        const savedVoiceURI = localStorage.getItem('selectedAiVoice');
        console.log('Home.js: Attempting to use saved voice URI:', savedVoiceURI);
        console.log('Home.js: Available voices URIs:', voices.map(v => v.voiceURI));

        if (savedVoiceURI) {
            selectedVoice = voices.find(voice => voice.voiceURI === savedVoiceURI);
            if (selectedVoice) {
                console.log('Home.js: Using saved AI voice:', selectedVoice.name);
            } else {
                console.warn('Home.js: Saved AI voice not found. Falling back to default selection.');
            }
        }
        
        // If no saved voice or saved voice not found, try to find a suitable default
        if (!selectedVoice) {
            selectedVoice = voices.find(voice => voice.lang.startsWith('en-') && voice.name.includes('female'));
            if (!selectedVoice) {
                selectedVoice = voices.find(voice => voice.lang.startsWith('en-'));
            }
            if (!selectedVoice) {
                console.warn('Home.js: No English voice found, using browser default.');
            }
        }

        if (selectedVoice) {
            utterance.voice = selectedVoice;
        } else {
            console.warn('Home.js: No suitable voice found, using system default.');
        }

        utterance.onstart = function() {
            console.log('Speech started. Current state:', currentState);
            currentState = states.SPEAKING;
            if (mainBubble) {
                mainBubble.textContent = 'Speaking...';
                mainBubble.classList.add('speaking');
                if (bubbleGroup) bubbleGroup.classList.remove('listening');
            }
            // Stop speech recognition while AI is speaking
            if (recognition) {
                try {
                    console.log('Recognition is assumed to be stopped by onresult; not stopping again in onstart.');
                } catch (e) {
                    console.error('Error stopping recognition during AI speech:', e);
                }
            }
        };

        utterance.onend = function() {
            console.log('Speech ended. Current state:', currentState);
            currentState = states.LISTENING;
            if (mainBubble) {
                mainBubble.textContent = 'Listening...';
                mainBubble.classList.remove('speaking');
                if (bubbleGroup) bubbleGroup.classList.add('listening');
            }
            // Restart speech recognition after AI finishes speaking
            if (recognition) {
                try {
                    recognition.start();
                    console.log('Recognition restarted automatically after AI speech.');
                } catch (e) {
                    console.error('Error restarting recognition:', e);
                    stopCurrentProcess();
                }
            }
        };

        utterance.onerror = function(event) {
            // Only log as an error if it's not an intentional interruption
            if (event.error !== 'interrupted') {
                console.error('Speech synthesis error:', event.error);
                stopCurrentProcess(states.ERROR, `Speech Error: ${event.error}`);
            } else {
                console.log('Speech synthesis explicitly interrupted.');
            }
            // Note: The 'interrupted' error is expected when synthesis is cancelled.
            // We handle this by not setting the state to ERROR due to this specific error.
            // Other state changes leading to cancellation (e.g., trigger word, credit depletion)
            // will have already set the appropriate state via stopCurrentProcess.
        };

        synthesis.speak(utterance);
    } else {
        console.warn('Web Speech API is not supported in this browser for speaking.');
        currentState = states.LISTENING;
        if (mainBubble) {
            mainBubble.textContent = 'Listening...';
            if (bubbleGroup) bubbleGroup.classList.add('listening');
        }
        if (recognition && currentState === states.LISTENING) {
            try {
                recognition.start();
                console.log('Recognition started after speaking not supported.');
            } catch (e) {
                console.error('Error starting recognition after speaking not supported:', e);
                stopCurrentProcess();
            }
        }
    }
}

// Web Audio API and Animation Setup
let analyser = null;
let dataArray = null;
let source = null;
        let currentScale = 1.0; // For smoothing
        const smoothingFactor = 0.2; // Adjust for desired smoothness

        // Function to start audio processing and animation
async function startAudioProcessing() {
    console.log('--- startAudioProcessing initiated ---');
    console.log('Initial state:', { audioContext: audioContext ? audioContext.state : null, stream: stream ? stream.active : null, analyser: analyser !== null, source: source !== null });

    try {
        console.log('Requesting microphone access...');
        // Request microphone access if stream is not already available or is inactive
        if (!stream || !stream.active) {
            if (stream && !stream.active) console.log('Existing stream is inactive, requesting new one.');
            stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            console.log('Microphone access granted. Stream active:', stream.active);
        }

        // *** UPDATED: Always create a new AudioContext and analyser when starting processing ***
        // Close any existing context first to be safe (should be null from stopCurrentProcess, but double check)
        if (audioContext && audioContext.state !== 'closed') {
             console.log(`Closing existing audio context (state: ${audioContext.state})...`);
             await audioContext.close().catch(e => console.error('Error closing audio context before restart:', e));
             console.log('Existing audio context closed.');
        }
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
        console.log('New audio context created (state:', audioContext.state, ').');

                analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        const bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);
        console.log('New analyser node created.');

        // Create new source from stream using the new audio context
        if (!stream || !stream.active) {
             console.error('Cannot create MediaStreamSource: Stream is not active.');
             stopCurrentProcess(states.ERROR, 'Microphone stream inactive.');
             return; // Stop if stream is somehow not active after getUserMedia
        }
        source = audioContext.createMediaStreamSource(stream);
        console.log('New MediaStreamSource node created from stream.');

        // Connect nodes: Source -> Analyser
        console.log('Attempting to connect source to analyser.');
                source.connect(analyser);
        console.log('Source connected to analyser.');
                // analyser.connect(audioContext.destination); // Uncomment to hear mic input

        // Start the animation loop if not already running
        if (!animationFrameId) {
                draw();
             console.log('Animation loop started.');
        }
        console.log('Audio processing started successfully.');

            } catch (err) {
                console.error('Error setting up audio processing:', err);
        stopCurrentProcess(states.ERROR, 'Mic access denied or error.');
            }
    console.log('--- startAudioProcessing finished ---');
    console.log('Final state:', { audioContext: audioContext ? audioContext.state : null, stream: stream ? stream.active : null, analyser: analyser !== null, source: source !== null });
        }

        // Animation loop
        function draw() {
    animationFrameId = requestAnimationFrame(draw);

    if (currentState === states.LISTENING || currentState === states.SPEAKING) {
         try {
            analyser.getByteFrequencyData(dataArray);

            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
                sum += dataArray[i];
            }
            let average = (sum / dataArray.length);

            const minScale = 1.0;
            const maxScale = 1.15;
            const volumeThreshold = 20;
            const volumeRange = 100;
            const clampedVolume = Math.max(0, Math.min(average - volumeThreshold, volumeRange));
            let targetScale = minScale + (clampedVolume / volumeRange) * (maxScale - minScale);

             targetScale = Math.max(minScale, targetScale);

            currentScale += (targetScale - currentScale) * smoothingFactor;

            if (mainBubble) {
                mainBubble.style.transform = `scale(${currentScale})`;
            }
         } catch (e) {
             console.warn('Error accessing analyser data, stopping animation:', e);
             cancelAnimationFrame(animationFrameId);
             animationFrameId = null;
             if (mainBubble) mainBubble.style.transform = 'scale(1.0)';
         }
    } else {
         if (mainBubble) mainBubble.style.transform = 'scale(1.0)';
         cancelAnimationFrame(animationFrameId);
         animationFrameId = null;
            }
        }

        // Function to stop audio processing and animation
        function stopAudioProcessing() {
     console.log('--- stopAudioProcessing initiated ---');
     console.log('Initial state:', { audioContext: audioContext ? audioContext.state : null, stream: stream ? stream.active : null, analyser: analyser !== null, source: source !== null });

            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
                animationFrameId = null;
         console.log('Animation loop cancelled.');
            }
            // Stop all tracks on the stream
            if (stream) {
          console.log('Stopping stream tracks.');
                 stream.getTracks().forEach(track => track.stop());
          console.log('Stream tracks stopped. Stream active:', stream.active);
          stream = null; // Clear the stream reference
          console.log('Stream reference cleared.');
            }
     // *** UPDATED: Close AudioContext and clear references ***
            if (audioContext && audioContext.state !== 'closed') {
         console.log(`Closing audio context (state: ${audioContext.state})...`);
                audioContext.close().catch(e => console.error('Error closing audio context:', e));
         console.log('Audio context close requested.');
     }
     audioContext = null; // Clear the context reference
     console.log('Audio context reference cleared.');

     // *** UPDATED: Disconnect and clear analyser and source ***
     if (source) {
         console.log('Disconnecting source node.');
         source.disconnect();
         source = null;
         console.log('Source node disconnected and reference cleared.');
     }
     if (analyser) {
          // Analyser doesn't need explicit disconnect if its source is disconnected
          analyser = null; // Clear the reference
          console.log('Analyser reference cleared.');
     }

     // Reset scale and remove listening/speaking classes
     if (mainBubble) mainBubble.style.transform = 'scale(1.0)';
     if (bubbleGroup) bubbleGroup.classList.remove('listening', 'speaking');

            console.log('Audio processing stopped.');
     console.log('--- stopAudioProcessing finished ---');
     console.log('Final state:', { audioContext: audioContext ? audioContext.state : null, stream: stream ? stream.active : null, analyser: analyser !== null, source: source !== null });
}

// Function to stop the current process and reset
function stopCurrentProcess(newState = states.IDLE, message = 'Tap Here to Start') {
    console.log(`Stopping current process. Current state: ${currentState}, Transitioning to: ${newState}`);
    
    // Finalize the current conversation if we're stopping from an active state
    if (currentState !== states.IDLE) {
        finalizeCurrentConversation();
    }
    
    // Only stop recognition if we're actually in a listening or processing state
    if (recognition && (currentState === states.LISTENING || currentState === states.PROCESSING)) {
        try {
            recognition.abort();
            console.log('Speech recognition aborted.');
        } catch (e) {
            console.error('Error aborting recognition:', e);
        }
    }

    // Only stop speech synthesis if it's actually speaking
    if ('speechSynthesis' in window && window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
        console.log('Speech synthesis cancelled.');
    }

    // Only stop audio processing if we're not transitioning to listening state
    if (newState !== states.LISTENING) {
        stopAudioProcessing();
    }

    currentState = newState;
            if (mainBubble) {
        mainBubble.textContent = message;
        mainBubble.classList.remove('listening', 'processing', 'speaking');
        if (newState === states.ERROR) {
            mainBubble.classList.add('error-state');
        } else {
            mainBubble.classList.remove('error-state');
        }
    }
    if (bubbleGroup) bubbleGroup.classList.remove('listening');

    console.log('Process stopped and reset. New state:', currentState);
}

// --- Speech Recognition Setup ---
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

function initializeRecognition() {
     if (!SpeechRecognition) {
        console.warn('Web Speech API is not supported in this browser.');
        if (mainBubble) {
          mainBubble.textContent = 'Voice input not supported';
          mainBubble.style.cursor = 'default';
        }
        currentState = states.ERROR;
        return null;
     }

     recognition = new SpeechRecognition();
     recognition.lang = 'en-US';
     recognition.continuous = true;
     recognition.interimResults = false;

    recognition.onstart = function() {
        console.log('recognition.onstart triggered.');
        currentState = states.LISTENING;
        if (bubbleGroup) {
            bubbleGroup.classList.add('listening');
        }
        if (mainBubble) {
            mainBubble.textContent = 'Listening...';
            mainBubble.classList.remove('processing', 'speaking', 'error-state');
        }
        console.log('Speech recognition started. Current state:', currentState);
    };

    recognition.onresult = async (event) => {
        const current = event.resultIndex;
        const transcript = event.results[current][0].transcript;
        console.log('Speech Recognition Result:', transcript);

        // Get trigger word preferences
        let { enabled: triggerDetectionEnabled, word: triggerWord } = getTriggerWordPreference();
        console.log('Trigger Word Preference:', { triggerDetectionEnabled, triggerWord });

        // Check user plan for Trigger Word Detection
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        const userPlan = currentUser ? currentUser.plan : 'free';

        if (userPlan !== 'pro') {
            console.log('Trigger Word Detection is a Pro plan feature. Disabling it for current user.');
            triggerDetectionEnabled = false; // Override to false if not Pro plan
        }

        // Check for trigger word immediately if detection is enabled
        if (triggerDetectionEnabled && triggerWord && transcript.toLowerCase().includes(triggerWord)) {
            console.log(`Trigger word '${triggerWord}' detected. Stopping conversation.`);
            stopCurrentProcess(states.IDLE, 'Trigger word detected. Conversation ended.');
            // Stop recognition immediately after trigger word detected
            if (recognition) {
                try {
                    recognition.abort(); // Use abort to prevent onend from firing unexpectedly
                    console.log('Recognition aborted due to trigger word.');
                } catch (e) {
                    console.error('Error aborting recognition after trigger word:', e);
                }
            }
            return; // Exit the function early
        }

        // Only proceed if not interrupted by trigger word
        if (recognition) {
            try {
                recognition.stop();
                console.log('Recognition stopped for processing.');
            } catch (e) {
                console.error('Error stopping recognition:', e);
            }
        }

        const userPreferences = getUserCustomisationSummary();
        console.log('User preferences:', userPreferences);

        // Get the current emotion from the displayed text
        const currentEmotionElement = document.getElementById('emotionText');
        const currentEmotion = currentEmotionElement ? currentEmotionElement.textContent.toLowerCase() : 'neutral';
        console.log('Detected current emotion for API request:', currentEmotion);

        saveMessageToConversation('user', transcript);

        currentState = states.PROCESSING;
        if (mainBubble) {
            mainBubble.textContent = 'Processing...';
            mainBubble.classList.remove('listening', 'speaking', 'error-state');
            if (bubbleGroup) bubbleGroup.classList.remove('listening');
        }
        console.log('Transitioned to Processing state:', currentState);

        try {
            const response = await fetch('https://moodmate-bj4k.onrender.com/api/chat', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                transcript: transcript,
                preferences: userPreferences,
                currentEmotion: currentEmotion
              })
            });

            if (!response.ok) {
              const errorDetail = await response.text();
              console.error(`Backend API error: ${response.status} - ${response.statusText}`, errorDetail);
              stopCurrentProcess(states.ERROR, `Backend Error: ${response.status}`);
              saveMessageToConversation('assistant', `Error: Could not get a response from the backend (Status: ${response.status}).`);
              return;
            }

            const data = await response.json();
            console.log('=== AI Response Data ===');
            console.log('Full response:', data);
            console.log('Response content:', data.response);
            console.log('Analysis data:', data.analysis);
            console.log('Activities:', data.analysis?.activities);

            const aiResponseContent = data.response;
            const aiAnalysisData = data.analysis;

            if (aiResponseContent) {
                console.log('Saving AI response with analysis:', {
                    content: aiResponseContent,
                    analysis: aiAnalysisData
                });
                // DEDUCT CREDIT HERE, AFTER SUCCESSFUL AI RESPONSE
                if (!checkAndDecrementCredits()) {
                    console.log('Credits exhausted after AI response, stopping process.');
                    stopCurrentProcess(states.ERROR, 'Credits depleted');
                    return; // Stop further processing if no credits
                }
                saveMessageToConversation('assistant', aiResponseContent, aiAnalysisData);
                speakText(aiResponseContent);
            } else {
              console.error('Backend response structure unexpected or empty content.', data);
                stopCurrentProcess(states.ERROR, 'Empty AI Response');
                saveMessageToConversation('assistant', 'Error: Received an empty response from the AI.');
            }

        } catch (error) {
            console.error('Error sending transcript to backend or processing response:', error);
            stopCurrentProcess(states.ERROR, 'Network Error');
            saveMessageToConversation('assistant', `Error: Network communication failed: ${error.message}`);
        }
    };

    recognition.onend = function() {
        console.log('recognition.onend triggered. Current state:', currentState);
        if (currentState === states.LISTENING) {
            console.log('Recognition ended without result. Resetting.');
            stopCurrentProcess();
        } else if (currentState === states.PROCESSING || currentState === states.SPEAKING) {
            console.log(`Recognition ended as expected in state: ${currentState}`);
        } else {
            console.warn(`recognition.onend triggered in unexpected state: ${currentState}. Performing full stop.`);
            stopCurrentProcess();
        }
    };

    recognition.onerror = function(event) {
        console.error('Speech recognition error triggered:', event.error);
        // If the error is 'aborted', it means recognition was intentionally stopped.
        // In this case, we do NOT want to transition to an ERROR state.
        if (event.error === 'aborted') {
            console.log('Speech recognition explicitly aborted. No ERROR state transition.');
        } else {
            // For other, actual errors, transition to ERROR state
            stopCurrentProcess(states.ERROR, `Speech Error: ${event.error}`);
        }
    };

    return recognition;
}

// Function to start the listening process
async function startListening() {
    console.log('=== startListening called ===');
    console.log('Current state:', currentState);
    
    if (currentState === states.IDLE) {
        // Create a new conversation when starting from IDLE state
        startNewConversation();
    }
    
    // Before starting to listen, check if any credits are available AT ALL for current user/guest
    // This prevents starting a conversation if credits are 0.
    let currentUser = JSON.parse(localStorage.getItem('currentUser'));
    let hasCredits = false;

    if (currentUser && currentUser.isLoggedIn) {
        // If user is plus or pro, they have unlimited credits
        if (currentUser.plan === 'plus' || currentUser.plan === 'pro') {
            hasCredits = true;
            console.log(`startListening: User is on ${currentUser.plan} plan, has unlimited credits.`);
        } else {
            // Free plan user credit check
            hasCredits = (currentUser.conversationCredits > 0);
            if (!hasCredits) {
                console.log('startListening: Logged-in user (free plan) has 0 credits. Redirecting to login.');
                alert('You have used all your free conversations. Please log in or create an account to continue.');
                window.location.href = 'login.html';
                return;
            }
        }
    } else {
        let guestCredits = parseInt(localStorage.getItem('guestConversationCredits') || '0', 10);
        hasCredits = (guestCredits > 0);
        if (!hasCredits) {
            console.log('startListening: Guest user has 0 credits. Redirecting to login.');
            alert('You have used all your free conversations. Please log in or create an account to continue.');
            window.location.href = 'login.html';
            return;
        }
    }

    // Only start if we're in IDLE or ERROR state and have credits
    if ((currentState === states.IDLE || currentState === states.ERROR) && hasCredits) {
        try {
            currentState = states.LISTENING;

            if (!recognition) {
                initializeRecognition();
                if (!recognition) {
                    console.error('Failed to initialize speech recognition.');
                    stopCurrentProcess(states.ERROR, 'Voice input setup failed');
                    return;
                }
            }

            // Start audio processing first
            await startAudioProcessing();
            if (currentState === states.ERROR) {
                console.error('Audio processing failed to start');
                return;
            }

            // Then start recognition
            console.log('Starting speech recognition...');
            recognition.start();
            console.log('Speech recognition started successfully');
        } catch (e) {
            console.error('Error in startListening:', e);
            stopCurrentProcess(states.ERROR, 'Voice input failed to start');
        }
    } else {
        console.log(`Cannot start listening, already in state: ${currentState} or no credits.`);
        if (!hasCredits) {
            stopCurrentProcess(states.ERROR, 'No Credits'); // Ensure bubble updates
        } else {
            stopCurrentProcess();
        }
    }
}

// Close modal when clicking outside
window.onclick = function(event) {
  if (event.target === settingsModal) {
    closeSettingsModal();
  }

  // Get references to the theme toggle elements and their labels
  const mainThemeToggleElement = document.getElementById('theme-toggle');
  const modalThemeToggleElement = document.getElementById('darkModeToggleModal');
  const mainThemeToggleLabel = document.querySelector('label[for="theme-toggle"]');
  const modalThemeToggleLabel = document.querySelector('label[for="darkModeToggleModal"]');

  // Check if the click target or its parent is one of the theme toggles or their labels
  if (event.target === mainThemeToggleElement || event.target === modalThemeToggleElement ||
      event.target === mainThemeToggleLabel || event.target === modalThemeToggleLabel ||
      mainThemeToggleElement.contains(event.target) || modalThemeToggleElement.contains(event.target) ||
      (mainThemeToggleLabel && mainThemeToggleLabel.contains(event.target)) || (modalThemeToggleLabel && modalThemeToggleLabel.contains(event.target))) {
      // If the click is on a theme toggle or its label, do nothing (do not stop the process)
      return;
  }

  const isClickInsideBubbleGroup = bubbleGroup && bubbleGroup.contains(event.target);
  const isClickInsideSettingsModal = settingsModal && settingsModal.contains(event.target);

  if (currentState !== states.IDLE && currentState !== states.ERROR && !isClickInsideBubbleGroup && !isClickInsideSettingsModal) {
      console.log('Click detected outside active bubble area. Stopping process.');
      stopCurrentProcess();
  }
};

// On page load...
document.addEventListener('DOMContentLoaded', () => {
    // THIS BLOCK WAS CAUSING IMMEDIATE REDIRECTION AND IS NOW REMOVED.
    // const checkUserLoggedIn = () => {
    //     const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    //     if (!currentUser || !currentUser.isLoggedIn) {
    //         window.location.href = 'login.html';
    //         return false;
    //     }
    //     return true;
    // };

    // if (!checkUserLoggedIn()) {
    //     return;
    // }

    // Declare currentUser and userPlan once at the top of DOMContentLoaded
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const userPlan = currentUser ? currentUser.plan : 'free';

    // Ensure guest credits are handled before any conversation starts
    ensureGuestCredits();

    // Initialize a new conversation if none exists
    const convos = getConversations();
    let guestCredits = parseInt(localStorage.getItem('guestConversationCredits') || '0', 10);

    // Only create a new conversation for guests if they have credits AND no existing conversations
    // Logged-in users are assumed to have ongoing conversations or will start a new one on demand
    if (!currentUser && convos.length === 0 && guestCredits > 0) {
        console.log('Guest: No conversations found and credits available, creating initial conversation');
        startNewConversation();
    } else if (currentUser && convos.length === 0) {
        console.log('Logged-in user: No conversations found, creating initial conversation');
        startNewConversation();
    }

    console.log('=== LocalStorage Contents ===');
    console.log('Current User:', JSON.parse(localStorage.getItem('currentUser')));
    console.log('All Users:', JSON.parse(localStorage.getItem('users')));
    console.log('AI Conversations:', JSON.parse(localStorage.getItem('aiConversations')));
    console.log('Light Mode:', localStorage.getItem('lightMode'));
    console.log('Face Tracking:', localStorage.getItem('faceTrackingEnabled'));
    console.log('Response Length:', localStorage.getItem('responseLength'));
    console.log('Mood Logging:', localStorage.getItem('moodLogging'));
    console.log('Data Retention:', localStorage.getItem('dataRetention'));
    console.log('Preferred Name:', localStorage.getItem('preferredName'));
    console.log('Trigger Detection:', localStorage.getItem('triggerDetection'));
    console.log('==========================');

    initializeTheme();
    initializeRecognition();

    const hamburgerMenu = document.getElementById('hamburger-menu');
    const navLinksMenu = document.getElementById('nav-links-menu');

    if (hamburgerMenu && navLinksMenu) {
        hamburgerMenu.addEventListener('click', () => {
            navLinksMenu.classList.toggle('active-menu');
            const isExpanded = navLinksMenu.classList.contains('active-menu');
            hamburgerMenu.setAttribute('aria-expanded', isExpanded);
        });
    }

    if (settingsBtn) {
        settingsBtn.addEventListener('click', openSettingsModal);
    }
    if (closeSettingsBtn) {
        closeSettingsBtn.addEventListener('click', closeSettingsModal);
    }

    if (mainThemeToggle) {
      mainThemeToggle.addEventListener('change', () => {
        setTheme(!mainThemeToggle.checked);
      });
    }

    if (modalThemeToggle) {
      modalThemeToggle.addEventListener('change', () => {
        setTheme(!modalThemeToggle.checked);
      });
    }

    // Populate voices when they are loaded or change
    if (typeof speechSynthesis !== 'undefined') {
        speechSynthesis.onvoiceschanged = populateVoiceListHome;
        // Also call it once initially in case voices are already loaded
        populateVoiceListHome();
    }

    // Add event listener for face tracking toggle in modal
    const modalFaceTrackingToggle = document.getElementById('faceTrackingToggleModal');
    if (modalFaceTrackingToggle) {
        modalFaceTrackingToggle.addEventListener('change', (event) => {
            const isEnabled = event.target.checked;
            localStorage.setItem('faceTrackingEnabled', isEnabled);
            console.log('Face tracking setting changed to:', isEnabled);

            // Check user plan before enabling/disabling features
            // currentUser and userPlan are already declared at a higher scope

            if (userPlan !== 'pro') {
                console.log('Face tracking requires Pro plan. Not enabling/disabling.');
                alert('Face Expression Tracking is a Pro plan feature. Please upgrade to Pro to use this feature.');
                // Revert toggle state if user is not Pro and tried to enable it
                if (isEnabled) event.target.checked = false;
                return;
            }

            if (isEnabled) {
                // If enabling, attempt to start video and load models
                console.log('Attempting to start face tracking...');
                const emotionDisplay = document.querySelector('.emotion-display');
                const lightWarningText = document.querySelector('.light-warning-text'); // Get the warning text element
                if (emotionDisplay) emotionDisplay.style.display = 'block';
                if (lightWarningText) lightWarningText.style.display = 'block'; // Show warning text
                if (typeof faceapi !== 'undefined') {
                     loadModelsAndStart();
                } else {
                     console.error('face-api.js is not loaded. Cannot start face tracking.');
                     const emotionEmojiElement = document.getElementById('emotionEmoji');
                     if (emotionEmojiElement) {
                         emotionEmojiElement.alt = "face-api load error";
                         emotionEmojiElement.src = "assets/neutral.png";
                     }
                 }
                } else {
                // If disabling, stop the video stream
                console.log('Attempting to stop face tracking...');
                const videoElementForStop = document.getElementById('videoInput');
                const emotionDisplay = document.querySelector('.emotion-display');
                const lightWarningText = document.querySelector('.light-warning-text'); // Get the warning text element

                if (videoElementForStop && videoElementForStop.srcObject) {
                    videoElementForStop.srcObject.getTracks().forEach(track => track.stop());
                    videoElementForStop.srcObject = null;
                    console.log('Face tracking video stream stopped.');
                }
                if (emotionDisplay) emotionDisplay.style.display = 'none';
                if (lightWarningText) lightWarningText.style.display = 'none'; // Hide warning text
                console.log('Face tracking stopped.');
            }
        });
    }

    const logoutBtn = document.querySelector('.logout-btn');
    const deleteAccountBtn = document.querySelector('.delete-account-btn');

    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    if (deleteAccountBtn) {
        deleteAccountBtn.addEventListener('click', handleDeleteAccount);
    }

    if (mainBubble) {
      mainBubble.addEventListener('click', startListening);
    }

    const isFaceTrackingEnabled = localStorage.getItem('faceTrackingEnabled') === 'true';
    const emotionEmoji = document.getElementById('emotionEmoji');
    const emotionDisplay = document.querySelector('.emotion-display');
    const lightWarningText = document.querySelector('.light-warning-text'); // Get the warning text element

    // Check user plan for initial face tracking state on page load
    // currentUser and userPlan are already declared at a higher scope

    if (userPlan !== 'pro') {
        console.log('Face tracking is a Pro plan feature. Disabling on page load.');
        if (emotionDisplay) emotionDisplay.style.display = 'none';
        if (lightWarningText) lightWarningText.style.display = 'none';
        const videoElementForStop = document.getElementById('videoInput');
        if (videoElementForStop && videoElementForStop.srcObject) {
            videoElementForStop.srcObject.getTracks().forEach(track => track.stop());
            videoElementForStop.srcObject = null;
            console.log('Face tracking disabled for non-Pro user: Video stream stopped.');
        }
    } else if (!isFaceTrackingEnabled) {
        if (emotionDisplay) {
            emotionDisplay.style.display = 'none';
        }
        if (lightWarningText) {
            lightWarningText.style.display = 'none'; // Hide warning text if face tracking is disabled
        }
        const videoElementForStop = document.getElementById('videoInput');
        if (videoElementForStop && videoElementForStop.srcObject) {
            videoElementForStop.srcObject.getTracks().forEach(track => track.stop());
            videoElementForStop.srcObject = null;
            console.log('Face tracking disabled: Video stream stopped.');
        }
    } else {
        console.log('Face tracking is enabled. Initializing...');
        if (emotionDisplay) {
            emotionDisplay.style.display = 'block';
        }
        if (lightWarningText) {
            lightWarningText.style.display = 'block'; // Show warning text if face tracking is enabled
        }
        checkFaceApiReady();
    }
});

function getConversations() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const userId = currentUser ? currentUser.email : 'guest';
    const data = localStorage.getItem(`aiConversations_${userId}`);
    console.log('Raw localStorage data for user', userId, ':', data);
    const parsed = data ? JSON.parse(data) : [];
    console.log('Parsed conversations for user', userId, ':', parsed);
    return parsed;
}

function saveConversations(conversations) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const userId = currentUser ? currentUser.email : 'guest';
    console.log('Saving conversations to localStorage for user', userId, ':', conversations);
    localStorage.setItem(`aiConversations_${userId}`, JSON.stringify(conversations));
    console.log('Verification - Reading back from localStorage:', localStorage.getItem(`aiConversations_${userId}`));
}

function generateConversationTitle() {
    const now = new Date();
    return `Conversation on ${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
}

function startNewConversation() {
    console.log('=== startNewConversation called ===');
    const convos = getConversations();
    
    // Generate a timestamped title for the new conversation
    const now = new Date();
    const title = `Conversation on ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;
    
    const newConvo = {
        title: title,
        messages: [],
        startTime: now.getTime()
    };
    
    convos.push(newConvo);
    saveConversations(convos);
    localStorage.setItem('currentConversationTitle', title);
    
    console.log('New conversation created:', newConvo);
    return newConvo;
}

function getCurrentConversation() {
    const convos = getConversations();
    const currentTitle = localStorage.getItem('currentConversationTitle');
    let convo = convos.find(c => c.title === currentTitle);
    if (!convo) {
        convo = startNewConversation();
    }
    return convo;
}

async function loadModelsAndStart() {
    const MODEL_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/0.22.2/weights/';
    try {
        console.log('Loading face-api models...');
        await Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
            faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL)
        ]);
        console.log('Models loaded successfully');
        await startVideo();
    } catch (err) {
        console.error('Error loading face-api models:', err);
        const emotionEmoji = document.getElementById('emotionEmoji');
        if (emotionEmoji) {
            emotionEmoji.alt = "Model load error";
            emotionEmoji.src = "assets/neutral.png";
        }
        const emotionDisplay = document.querySelector('.emotion-display');
        if (emotionDisplay) {
            emotionDisplay.style.display = 'none';
        }
    }
}

async function startVideo() {
    const videoElement = document.getElementById('videoInput');
    if (!videoElement) {
        console.error('startVideo: Video element not found');
        return;
    }
    console.log('startVideo: Video element found.');

    try {
        console.log('startVideo: Requesting media devices...');
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                width: 320,
                height: 240,
                facingMode: 'user' // Use the user-facing camera
            } 
        });
        console.log('startVideo: Media stream obtained successfully.', stream);
        videoElement.srcObject = stream;
        
        // Wait for video to be ready
        console.log('startVideo: Waiting for video loadedmetadata...');
        await new Promise((resolve, reject) => {
            videoElement.onloadedmetadata = () => {
                console.log('startVideo: Video loadedmetadata. Attempting to play...');
                videoElement.play()
                    .then(() => {
                        console.log('startVideo: Video played successfully.');
                        resolve();
                    })
                    .catch(err => {
                        console.error('startVideo: Error playing video:', err);
                        if (emotionEmoji) emotionEmoji.alt = "Video play error: " + err.name;
                        reject(err);
                    });
            };
            videoElement.onerror = (e) => {
                console.error('startVideo: Video element error:', e);
                reject(e);
            };
        });

        // Start face detection once video is playing
        console.log('startVideo: Starting face detection...');
        startFaceDetection();
    } catch (err) {
        console.error('startVideo: Error accessing webcam:', err);
        const emotionEmoji = document.getElementById('emotionEmoji');
        if (emotionEmoji) {
            emotionEmoji.alt = "Webcam error: " + err.name;
            emotionEmoji.src = "assets/neutral.png";
        }
        // Depending on the error, you might want to hide the emotion display
        const emotionDisplay = document.querySelector('.emotion-display');
        if (emotionDisplay) emotionDisplay.style.display = 'none';
    }
}

function startFaceDetection() {
    const video = document.getElementById('videoInput');
    const emotionEmoji = document.getElementById('emotionEmoji');
    const emotionText = document.getElementById('emotionText');
    
    if (!video || !emotionEmoji || !emotionText) {
        console.error('Required elements not found');
        return;
    }

    const emojiMap = {
        happy: 'assets/happy.png',
        sad: 'assets/sad.png',
        neutral: 'assets/neutral.png',
        angry: 'assets/angry.png',
        fearful: 'assets/fearful.png',
        disgusted: 'assets/disgusted.png',
        surprised: 'assets/surprised.png'
    };

    let lastEmotion = 'neutral';
    let emotionChangeCount = 0;
    const EMOTION_CHANGE_THRESHOLD = 3; // Number of consistent detections before updating display

    async function detectEmotion() {
        if (video.paused || video.ended) {
            return;
        }

        try {
            const detections = await faceapi.detectAllFaces(
                video, 
                new faceapi.TinyFaceDetectorOptions()
            ).withFaceExpressions();

            if (detections.length > 0) {
                const expressions = detections[0].expressions;
                let dominantEmotion = 'neutral';
                let maxScore = expressions.neutral;

                Object.entries(expressions).forEach(([emotion, score]) => {
                    if (score > maxScore) {
                        maxScore = score;
                        dominantEmotion = emotion;
                    }
                });

                // Only update if emotion is consistent for several frames
                if (dominantEmotion === lastEmotion) {
                    emotionChangeCount++;
                    if (emotionChangeCount >= EMOTION_CHANGE_THRESHOLD) {
                        updateEmotionDisplay(dominantEmotion);
                    }
                } else {
                    emotionChangeCount = 1;
                    lastEmotion = dominantEmotion;
                }
            } else {
                // No face detected
                if (emotionEmoji.alt !== 'neutral (no face)') {
                    updateEmotionDisplay('neutral');
                    emotionEmoji.alt = 'neutral (no face)';
                }
            }
        } catch (err) {
            console.error('Error in face detection:', err);
        }

        // Continue detection loop
        requestAnimationFrame(detectEmotion);
    }

    function updateEmotionDisplay(emotion) {
        if (emotionEmoji && emotionText) {
            emotionEmoji.src = emojiMap[emotion] || 'assets/neutral.png';
            emotionText.textContent = emotion.charAt(0).toUpperCase() + emotion.slice(1);
            emotionEmoji.alt = emotion;
        }
    }

    // Start the detection loop
    detectEmotion();
}

// Add a function to check if faceapi is ready and retry
function checkFaceApiReady(retries = 10, delay = 500) {
    if (typeof faceapi !== 'undefined') {
        console.log('face-api.js is now loaded. Calling loadModelsAndStart()...');
        loadModelsAndStart();
    } else if (retries > 0) {
        console.log(`face-api.js not yet loaded, retrying in ${delay}ms... (Retries left: ${retries})`);
        setTimeout(() => checkFaceApiReady(retries - 1, delay), delay);
    } else {
        console.error('face-api.js did not load within the expected time. Face tracking will not be available.');
        const emotionEmojiElement = document.getElementById('emotionEmoji');
        if (emotionEmojiElement) {
            emotionEmojiElement.alt = "face-api load error";
            emotionEmojiElement.src = "assets/neutral.png";
        }
        const emotionDisplay = document.querySelector('.emotion-display');
        if (emotionDisplay) emotionDisplay.style.display = 'none';
    }
}

// Function to finalize and save the current conversation
function finalizeCurrentConversation() {
    console.log('=== finalizeCurrentConversation called ===');
    const convos = getConversations();
    const currentTitle = localStorage.getItem('currentConversationTitle');
    
    if (!currentTitle) {
        console.log('No active conversation to finalize');
        return;
    }
    
    const currentConvo = convos.find(c => c.title === currentTitle);
    if (currentConvo) {
        currentConvo.endTime = Date.now();
        saveConversations(convos);
        localStorage.removeItem('currentConversationTitle');
        console.log('Conversation finalized:', currentConvo);
    }
}