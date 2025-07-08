let video;
let model;
let isCameraActive = false;
let isMicrophoneActive = false;
let speechRecognition;

async function startCamera() {
    if (isCameraActive) {
        stopCamera();
        return;
    }

    video = document.getElementById("video");
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = stream;
        video.onloadedmetadata = () => {
            video.play();
            loadModel();
        };
        isCameraActive = true;
        document.getElementById("start-camera").innerText = "Stop Camera";
        document.getElementById("start-camera").classList.add("active");
        document.getElementById("video-container").style.display = "flex";
        document.getElementById("home").style.display = "block";
    } catch (err) {
        console.error("Error accessing camera:", err);
        alert("Camera access required.");
    }
}

function stopCamera() {
    if (video && video.srcObject) {
        const stream = video.srcObject;
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
        video.srcObject = null;
    }
    isCameraActive = false;
    document.getElementById("start-camera").innerText = "Start Camera";
    document.getElementById("start-camera").classList.remove("active");
    document.getElementById("video-container").style.display = "none";
    document.getElementById("person-count").innerText = "People Count: 0";
    document.getElementById("object-label").innerText = "Object: None";

    if (model) {
        model.dispose();
        model = null;
    }
}

async function loadModel() {
    console.log('Loading model...');
    try {
        model = await cocoSsd.load();
        console.log('Model loaded.');
        detectFrame();
    } catch (error) {
        console.error("Failed to load model:", error);
        alert("Failed to load the object detection model. Please check your network connection.");
    }
}

async function detectFrame() {
    if (!model || !video || !isCameraActive) return;

    try {
        const predictions = await model.detect(video);
        let personCount = 0;
        let objectName = "None";

        predictions.forEach(prediction => {
            if (prediction.class === 'person') {
                personCount++;
            }
            objectName = prediction.class;
        });

        document.getElementById("person-count").innerText = personCount === 1
            ? `1 person detected`
            : `${personCount} people detected`;
        document.getElementById("object-label").innerText = `Object: ${objectName}`;
        requestAnimationFrame(detectFrame);
    } catch (error) {
        console.error("Error during detection:", error);
        alert("Error during detection. Please reload the page.");
        isCameraActive = false;
    }
}

function startMicrophone() {
    if (isMicrophoneActive) {
        stopMicrophone();
        return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        alert("Speech Recognition is not supported in this browser. Please use a modern browser like Chrome, Safari, or Firefox.");
        console.error("Speech Recognition is not supported.");
        return;
    }

    speechRecognition = new SpeechRecognition();
    speechRecognition.continuous = true;
    speechRecognition.interimResults = true;
    speechRecognition.lang = 'en-US';

    speechRecognition.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            transcript += event.results[i][0].transcript;
        }
        document.getElementById("voice-text").innerText = transcript;
    };

    speechRecognition.onerror = (event) => {
        console.error("Speech Recognition Error:", event.error);
        const errorMsg = {
            'no-speech': "No speech detected. Please speak clearly.",
            'audio-capture': "No audio input. Check your microphone."
        }[event.error] || "Speech recognition error. Please try again.";

        document.getElementById("voice-text").innerText = errorMsg;
    };

    speechRecognition.start();
    isMicrophoneActive = true;
    document.getElementById("start-microphone").innerText = "Stop Microphone";
    document.getElementById("start-microphone").classList.add("active");
    document.getElementById("transcript").style.display = "block";
    document.getElementById("home").style.display = "block";
}

function stopMicrophone() {
    if (speechRecognition) {
        speechRecognition.stop();
        speechRecognition.onresult = null;
        speechRecognition.onerror = null;
    }
    isMicrophoneActive = false;
    document.getElementById("start-microphone").innerText = "Start Microphone";
    document.getElementById("start-microphone").classList.remove("active");
    document.getElementById("transcript").style.display = "none";
    document.getElementById("voice-text").innerText = "";
}

// Text-to-Speech for mute users
function speakTypedText() {
    const inputText = document.getElementById("keyboard-input").value.trim();
    if (!inputText) {
        alert("Please enter a message to speak.");
        return;
    }

    const utterance = new SpeechSynthesisUtterance(inputText);
    utterance.lang = 'en-US';
    speechSynthesis.speak(utterance);
}

document.getElementById('start-camera').addEventListener('click', startCamera);
document.getElementById('start-microphone').addEventListener('click', startMicrophone);
document.getElementById('speak-text').addEventListener('click', speakTypedText);

// Toggle About section
document.querySelector('nav .about a').addEventListener('click', (event) => {
    event.preventDefault();
    document.getElementById('home').style.display = 'none';
    document.getElementById('about').style.display = 'block';
});

document.querySelector('.logo a').addEventListener('click', function (e) {
    e.preventDefault();
    document.getElementById('home').style.display = 'block';
    document.getElementById('about').style.display = 'none';
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

// Toggle keyboard input visibility
let isKeyboardVisible = false;
document.getElementById('toggle-keyboard').addEventListener('click', () => {
    const keyboardContainer = document.getElementById('keyboard-input-container');
    const toggleButton = document.getElementById('toggle-keyboard');

    if (isKeyboardVisible) {
        keyboardContainer.style.display = 'none';
        toggleButton.innerText = 'Open Keyboard';
    } else {
        keyboardContainer.style.display = 'block';
        toggleButton.innerText = 'Close Keyboard';
        document.getElementById('keyboard-input').focus();
    }

    document.getElementById('speak-text').style.display = isKeyboardVisible ? 'none' : 'inline-block';
    isKeyboardVisible = !isKeyboardVisible;
});
