// Get DOM elements
const settingsModal = document.getElementById('settings-modal');
const settingsBtn = document.getElementById('settings-btn');
const closeSettingsBtn = document.getElementById('close-settings');

const mainThemeToggle = document.getElementById('theme-toggle'); // Navbar toggle
const modalThemeToggle = document.getElementById('darkModeToggleModal'); // Modal toggle

const emotionText = document.getElementById('emotionText');

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

    // Event listeners for modal
    if (settingsBtn) {
        settingsBtn.addEventListener('click', openSettingsModal);
    }
    if (closeSettingsBtn) {
        closeSettingsBtn.addEventListener('click', closeSettingsModal);
    }

    // Add event listeners to both theme toggles
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

    // Placeholder for start bubble
    const startBubble = document.getElementById('start-bubble');
    if (startBubble) {
      // Remove the old alert listener
      // startBubble.removeEventListener('click', function() { alert('Start tapped!'); });

      startBubble.addEventListener('click', async function() {

        // Check if speech is currently in progress and stop it
        if ('speechSynthesis' in window && window.speechSynthesis.speaking) {
            console.log('Stopping ongoing speech...');
            window.speechSynthesis.cancel();
            // When speech is cancelled, the utterance.onend handler will set text back to 'Tap Here to Start'.
            // We should stop here and not start a new recognition session.
            return; // Stop processing this click event further
        }

        // Get a reference to the main bubble
        const mainBubble = document.querySelector('.main-bubble');

        // If not currently speaking, check if the bubble is in the 'ready' state to start listening
        if (mainBubble && mainBubble.textContent.trim() !== 'Tap Here to Start') {
             // If the text is not 'Tap Here to Start', it means we are already in a listening state or transitioning.
             // Do not start a new recognition session.
             console.log('Bubble is not in the ready state to start listening.');
             return; // Stop processing this click event further
        }

        // If we reach here, it means the bubble was clicked and it was in the 'Tap Here to Start' state.
        // Proceed with starting the listening process.

        // Check for browser support for Web Speech API
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
          console.warn('Web Speech API is not supported in this browser.');
          startBubble.textContent = 'Voice input not supported';
          startBubble.style.cursor = 'default';
          return;
        }

        // Get the bubble-group for the listening class
        const bubbleGroup = document.querySelector('.bubble-group');
        if (!bubbleGroup || !mainBubble) {
            console.error('Required bubble elements not found.');
            return;
        }

        // --- Get Microphone Access FIRST ---
        let stream;
        try {
            console.log('Requesting microphone access...');
            // Request microphone access
            stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            console.log('Microphone access granted.');
        } catch (err) {
            const mainBubble = document.querySelector('.main-bubble');
            console.error('Error accessing microphone:', err);
            // Display an error message or handle accordingly
             if (mainBubble) {
                 mainBubble.textContent = 'Mic access denied';
                 mainBubble.style.cursor = 'default';
             }
            return; // Stop if microphone access is denied
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.continuous = false; // set true for continuous listening
        recognition.interimResults = false;

        // --- Web Audio API and Animation Setup ---
        let audioContext;
        let analyser;
        let dataArray;
        // Source will now use the stream obtained above
        let source;
        let animationFrameId;
        let currentScale = 1.0; // For smoothing
        const smoothingFactor = 0.2; // Adjust for desired smoothness

        // Function to start audio processing and animation
        // This function now receives the stream
        function startAudioProcessing(audioStream) {
            try {
                // Create AudioContext and nodes
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
                analyser = audioContext.createAnalyser();
                // Use the provided stream
                source = audioContext.createMediaStreamSource(audioStream);

                // Configure analyser
                analyser.fftSize = 256; // Size of FFT, affects frequency data resolution
                const bufferLength = analyser.frequencyBinCount; // Number of data points
                dataArray = new Uint8Array(bufferLength); // Array to hold frequency data (0-255)

                // Connect nodes
                source.connect(analyser);
                // analyser.connect(audioContext.destination); // Uncomment to hear mic input

                // Start the animation loop
                draw();
                console.log('Audio processing started.');

            } catch (err) {
                console.error('Error setting up audio processing:', err);
                // If audio processing setup fails, stop recognition and clean up
                if (recognition) recognition.stop();
                handleRecognitionEnd(); // Clean up any animation/state
            }
        }

        // Animation loop
        function draw() {
            animationFrameId = requestAnimationFrame(draw); // Continue the loop

            // Get frequency data
            analyser.getByteFrequencyData(dataArray); // Or getByteTimeDomainData for waveform

            // Simple volume calculation: average of the frequency data
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
                sum += dataArray[i];
            }
            let average = (sum / dataArray.length);

            // Map volume to scale: Adjust these values as needed
            // Increased maxScale for more noticeable animation
            const minScale = 1.0; // Base scale
            const maxScale = 1.2; // Increased max scale factor (e.g., 20% growth) - adjust for desired effect
            const volumeThreshold = 20; // Minimum volume to start scaling from 1.0
            const volumeRange = 130; // The range of volume values (from threshold upwards) that map to the scale range
            const clampedVolume = Math.max(0, Math.min(average - volumeThreshold, volumeRange)); // Clamp and offset volume
            let targetScale = minScale + (clampedVolume / volumeRange) * (maxScale - minScale);

            // Ensure a minimum scale even with low volume, but only when listening is active
            if (bubbleGroup.classList.contains('listening')) {
                 targetScale = Math.max(minScale, targetScale); // Don't shrink below minScale when listening
            }

            // Smooth the scale change with interpolation (lerp)
            currentScale += (targetScale - currentScale) * smoothingFactor;

            // Apply the scale transform to the main bubble
            if (mainBubble) {
                mainBubble.style.transform = `scale(${currentScale})`;
            }
        }

        // Function to stop audio processing and animation
        function stopAudioProcessing() {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
                animationFrameId = null;
            }
            // Stop all tracks on the stream
            if (stream) {
                 stream.getTracks().forEach(track => track.stop());
            }
            if (audioContext && audioContext.state !== 'closed') {
                audioContext.close().catch(e => console.error('Error closing audio context:', e));
            }
            // Reset scale when stopping
            if (mainBubble) {
                 mainBubble.style.transform = 'scale(1.0)';
            }
            console.log('Audio processing stopped.');
        }

        // --- Speech Recognition Setup (Integrated) ---

        recognition.onresult = async function(event) {
          const transcript = event.results[0][0].transcript;
          console.log('User said:', transcript);

          // Get user customization summary
          const userPreferences = getUserCustomisationSummary();
          console.log('User preferences:', userPreferences);

          // Send transcript and preferences to the backend
          try {
            const response = await fetch('https://moodmate-bj4k.onrender.com/api/chat', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                transcript: transcript,
                preferences: userPreferences
              })
            });

            if (!response.ok) {
              const errorDetail = await response.text();
              console.error(`Backend API error: ${response.status} - ${response.statusText}`, errorDetail);
              // Optionally update mainBubble text to indicate error
              const mainBubble = document.querySelector('.main-bubble');
              if (mainBubble) {
                  mainBubble.textContent = 'Error getting response';
              }
              return;
            }

            const data = await response.json();
            const aiResponse = data.response; // Assuming your backend returns { response: "AI text" }

            if (aiResponse) {
              console.log('AI Response received from backend:', aiResponse);
              // Save AI message to conversation
              saveMessageToConversation('assistant', aiResponse);
              speakText(aiResponse);
            } else {
              console.error('Backend response structure unexpected or empty content.', data);
               const mainBubble = document.querySelector('.main-bubble');
                if (mainBubble) {
                    mainBubble.textContent = 'Empty AI response';
                }
            }

          } catch (error) {
            console.error('Error sending transcript to backend:', error);
             const mainBubble = document.querySelector('.main-bubble');
              if (mainBubble) {
                  mainBubble.textContent = 'Network error';
              }
          }
        };

        recognition.onstart = function() {
            console.log('recognition.onstart triggered.');
            // Add the listening class and change text when recognition actually starts
            if (bubbleGroup) {
                bubbleGroup.classList.add('listening');
            }
            if (mainBubble) {
                mainBubble.textContent = 'Listening...';
            }
            console.log('Speech recognition started.');
            // Audio processing animation is already started via startAudioProcessing(stream);
        };

        // This handles both recognition ending normally or due to an error
        const handleRecognitionEnd = function() {
            console.log('handleRecognitionEnd triggered.');
            const bubbleGroup = document.querySelector('.bubble-group');
            if (bubbleGroup) {
                bubbleGroup.classList.remove('listening');
            }
            if (mainBubble) {
                 mainBubble.textContent = 'Tap Here to Start'; // Revert text
            }
            console.log('Speech recognition ended.');
            stopAudioProcessing(); // Stop audio and animation when recognition ends
        };

        recognition.onend = function() {
             console.log('recognition.onend triggered.');
             handleRecognitionEnd();
        };

        recognition.onerror = function(event) {
            console.error('Speech recognition error triggered:', event.error);
            // Clean up and stop animation even on error
            handleRecognitionEnd();
        };

        // Step 4: Trigger recognition and audio processing after getting stream
        console.log('Starting audio processing and speech recognition...');

        // Start audio processing with the obtained stream
        startAudioProcessing(stream);

        // Start speech recognition - relies on permission granted by getUserMedia
        try {
            console.log('Attempting to call recognition.start()...');
            recognition.start();
            // The 'listening' class and text change will happen in recognition.onstart
        } catch (e) {
            console.error('Error calling recognition.start():', e);
            // If recognition.start() fails, stop audio processing and revert UI
            stopAudioProcessing();
             if (bubbleGroup) {
                bubbleGroup.classList.remove('listening');
            }
             if (mainBubble) {
                 mainBubble.textContent = 'Tap Here to Start'; // Revert text on error
             }
        }
      });
    }

    // Check if face tracking is enabled before proceeding
    const isFaceTrackingEnabled = localStorage.getItem('faceTrackingEnabled') === 'true';
    const emotionEmoji = document.getElementById('emotionEmoji'); // Get emoji element here for potential hiding
    const emotionDisplay = document.querySelector('.emotion-display');

    if (!isFaceTrackingEnabled) {
        if (emotionDisplay) {
            emotionDisplay.style.display = 'none'; // Hide the entire emotion display if tracking is off
        }
        // Optionally, stop the video element if it was already part of the DOM and might autoplay due to attributes
        const videoElementForStop = document.getElementById('videoInput');
        if (videoElementForStop && videoElementForStop.srcObject) {
            videoElementForStop.srcObject.getTracks().forEach(track => track.stop());
            videoElementForStop.srcObject = null;
        }
        return; // Do not proceed with face tracking setup
    } else {
        if (emotionDisplay) {
            emotionDisplay.style.display = 'block'; // Ensure emotion display is visible if tracking is on
        }
    }

    // Face Expression Tracking
    // Ensure faceapi is defined (loaded via CDN)
    if (typeof faceapi === 'undefined') {
        const emotionEmojiElement = document.getElementById('emotionEmoji');
        if (emotionEmojiElement) {
            emotionEmojiElement.alt = "face-api load error";
            emotionEmojiElement.src = "assets/neutral.png"; // Default or error image
        }
        return; // Stop further execution if face-api.js is not available
    }

    const video = document.getElementById('videoInput');
    const emojiMap = {
        happy: 'assets/happy.png',
        sad: 'assets/sad.png',
        neutral: 'assets/neutral.png'
    };

    if (!video) {
        return;
    }
    if (!emotionEmoji) {
        // return; // Don't return here, as video setup might still be useful for debugging
    }

    // Update the emoji and text based on detected emotion
    function updateEmotionDisplay(emotion) {
        if (emotionEmoji && emotionText) {
            emotionEmoji.src = emojiMap[emotion] || 'assets/neutral.png';
            emotionText.textContent = emotion.charAt(0).toUpperCase() + emotion.slice(1);
        }
    }

    async function startVideo() {
        try {
            // Check if mediaDevices and getUserMedia are supported
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
                video.srcObject = stream;

                // Attempt to play the video explicitly
                try {
                    await video.play();
                } catch (playError) {
                    if (emotionEmoji) emotionEmoji.alt = "Video play error: " + playError.name;
                    // Common errors here: NotAllowedError (if user hasn't interacted or permission denied after stream acquired)
                    // AbortError, etc.
                }

            } else {
                if (emotionEmoji) emotionEmoji.alt = "Webcam not supported";
            }
        } catch (err) { // This catch is for getUserMedia errors
            if (emotionEmoji) emotionEmoji.alt = "Webcam getUserMedia error: " + err.name;
        }
    }

    async function loadModelsAndStart() {
        // const MODEL_URL = 'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/weights'; // Old problematic URL
        const MODEL_URL = 'https://vladmandic.github.io/face-api/model/'; // New URL pointing to a more robustly hosted set of models
        try {
            await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
            await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);
            await startVideo(); // Wait for video to be set up before adding play listener
        } catch (err) {
            if (emotionEmoji) emotionEmoji.alt = "Model load error";
        }
    }

    if (video) {
        video.addEventListener('loadedmetadata', () => {
        });

        // The 'play' event indicates playback has begun, but not necessarily that the first frame is processable.
        video.addEventListener('play', () => {
        });

        // The 'canplay' event is a better indicator that the media is ready for processing.
        video.addEventListener('canplay', () => {
            
            if (!faceapi.nets.tinyFaceDetector.params || !faceapi.nets.faceExpressionNet.params) {
            }

            // It's safer to create canvas and match dimensions once the video can play.
            const canvas = faceapi.createCanvasFromMedia(video);
            const displaySize = { width: video.videoWidth, height: video.videoHeight };
            faceapi.matchDimensions(canvas, displaySize);

            setInterval(async () => {
                if (video.paused || video.ended) {
                    return;
                }
                const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions()).withFaceExpressions();
                
                if (detections.length > 0 && detections[0].expressions) {
                    const expressions = detections[0].expressions;

                    let dominantEmotion = 'neutral';
                    let maxScore = expressions.neutral || 0;

                    if (expressions.happy > maxScore) {
                        dominantEmotion = 'happy';
                        maxScore = expressions.happy;
                    }
                    if (expressions.sad > maxScore) {
                        dominantEmotion = 'sad';
                    }
                    
                    if (emotionEmoji && emojiMap[dominantEmotion]) {
                        if (emotionEmoji.src.includes(emojiMap[dominantEmotion]) === false) {
                           emotionEmoji.src = emojiMap[dominantEmotion];
                           emotionEmoji.alt = dominantEmotion;
                        }
                    } else {
                        if (emotionEmoji && emojiMap.neutral && emotionEmoji.src.includes(emojiMap.neutral) === false) {
                            emotionEmoji.src = emojiMap.neutral;
                            emotionEmoji.alt = 'neutral (error determining emotion)';
                        }
                    }

                    updateEmotionDisplay(dominantEmotion);
                } else {
                    if (emotionEmoji && emojiMap.neutral) {
                        if (emotionEmoji.src.includes(emojiMap.neutral) === false) {
                            emotionEmoji.src = emojiMap.neutral;
                            emotionEmoji.alt = 'neutral (no face)';
                        }
                    }
                }
            }, 1000);
        });

        video.addEventListener('error', (e) => {
            if (emotionEmoji) emotionEmoji.alt = "Video playback error";
        });
    }

    // Initialize face tracking: Load models, then start video.
    // The 'play' event listener on the video will then kick off the detection interval.
    // This call is now conditional based on isFaceTrackingEnabled check above
    loadModelsAndStart();
});

// On page load, ensure a conversation exists
if (!localStorage.getItem('currentConversationTitle')) {
    startNewConversation();
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

// Conversation history management
function getConversations() {
    const data = localStorage.getItem('aiConversations');
    return data ? JSON.parse(data) : [];
}

function saveConversations(convos) {
    localStorage.setItem('aiConversations', JSON.stringify(convos));
}

function generateConversationTitle() {
    const now = new Date();
    return `Conversation on ${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
}

function startNewConversation() {
    const convos = getConversations();
    const title = generateConversationTitle();
    const newConvo = {
        title,
        started: Date.now(),
        messages: []
    };
    convos.push(newConvo);
    saveConversations(convos);
    localStorage.setItem('currentConversationTitle', title);
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

function saveMessageToConversation(role, content) {
    const convos = getConversations();
    const currentTitle = localStorage.getItem('currentConversationTitle');
    let convo = convos.find(c => c.title === currentTitle);
    if (!convo) {
        convo = startNewConversation();
    }
    convo.messages.push({ role, content, timestamp: Date.now() });
    saveConversations(convos);
}

// On page load, ensure a conversation exists
if (!localStorage.getItem('currentConversationTitle')) {
    startNewConversation();
}

// Function to speak text using Web Speech API
function speakText(text) {
    if ('speechSynthesis' in window) {
        const synthesis = window.speechSynthesis;
        const utterance = new SpeechSynthesisUtterance(text);

        // Get a reference to the main bubble (already available in scope)
        const mainBubble = document.querySelector('.main-bubble');

        // Optional: Configure voice, pitch, rate, etc.
        // Example: utterance.voice = synthesis.getVoices().find(voice => voice.lang === 'en-US');
        // Example: utterance.pitch = 1.0; // 0 to 2
        // Example: utterance.rate = 1.0; // 0.1 to 10

        // Get available voices and try to find an English one
        const voices = synthesis.getVoices();
        let englishVoice = voices.find(voice => voice.lang === 'en-US' && voice.name.includes('female')); // Prefer female
        if (!englishVoice) {
             englishVoice = voices.find(voice => voice.lang === 'en-US'); // Fallback to any en-US voice
        }
         if (englishVoice) {
             utterance.voice = englishVoice;
             // console.log('Using voice:', englishVoice.name); // Optional log to see which voice is used
         } else {
             console.warn('No English voice found, using default.');
         }

        // Event listeners for when speech starts and ends
        utterance.onstart = function() {
             if (mainBubble) {
                 mainBubble.textContent = 'Stop Speaking';
                 // Add a class to indicate speaking state if needed for styling
                 mainBubble.classList.add('speaking');
             }
             console.log('Speech started.'); // Optional log
        };

        utterance.onend = function() {
             if (mainBubble) {
                 mainBubble.textContent = 'Tap Here to Start'; // Revert text
                 mainBubble.classList.remove('speaking');
             }
             console.log('Speech ended.'); // Optional log
             // Note: recognition is likely ended by now as well, handled by recognition.onend
        };

        utterance.onerror = function(event) {
             console.error('Speech synthesis error:', event.error);
             if (mainBubble) {
                 mainBubble.textContent = 'Tap Here to Start'; // Revert text on error
                 mainBubble.classList.remove('speaking');
             }
        };

        // Example: utterance.pitch = 1.0; // 0 to 2
        // Example: utterance.rate = 1.0; // 0.1 to 10

        synthesis.speak(utterance);
    } else {
        console.warn('Web Speech API is not supported in this browser.');
    }
}

// Example of how you might use these functions:
// Assuming you have your transcript ready in a variable:
// const userTranscript = "Tell me a joke about computers.";
// sendTranscriptToOpenAI(userTranscript); // This will log the response
// To speak the response, you would call speakText() after receiving it
// For example, inside the .onresult handler after getting the transcript:
/*
recognition.onresult = async function(event) {
    const transcript = event.results[0][0].transcript;
    console.log('User said:', transcript);
    const aiResponse = await sendTranscriptToOpenAI(transcript);
    if (aiResponse) {
        speakText(aiResponse);
    }else{
       // Handle case where API call failed
       console.error('Failed to get AI response.');
    }
};
*/
