// public/script.js

document.addEventListener('DOMContentLoaded', () => {
    const talkButton = document.getElementById('talkButton');
    const statusDiv = document.getElementById('status');

    // --- State Management ---
    let isRecording = false;
    let socket;
    let mediaRecorder;
    let audioContext;
    let nextChunkTime = 0; // The scheduled time for the next audio chunk to play
    let userMediaStream;

    // --- Configuration ---
    const WEBSOCKET_URL = `ws://${window.location.host}`;
    const TIMESLICE_MS = 250; // Send audio chunks every 250ms

    // Attach the main event listener to the button
    talkButton.addEventListener('click', toggleConversation);

    /**
     * Toggles the conversation state between starting and stopping.
     */
    function toggleConversation() {
        if (!isRecording) {
            startConversation();
        } else {
            stopConversation();
        }
    }

    /**
     * Starts the WebSocket connection, gets microphone access, and begins streaming.
     */
    async function startConversation() {
        statusDiv.textContent = 'Connecting...';
        talkButton.textContent = 'Stop Listening';
        isRecording = true;
        
        // This must be done after a user interaction (like a click)
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            nextChunkTime = audioContext.currentTime; // Initialize schedule time
        }

        // --- 1. Establish WebSocket Connection ---
        socket = new WebSocket(WEBSOCKET_URL);

        socket.onopen = () => {
            statusDiv.textContent = 'Connected. Start speaking...';
        };

        // Call the new playback scheduler when a message is received
        socket.onmessage = (event) => {
            scheduleAudioPlayback(event.data);
        };

        socket.onclose = () => {
            statusDiv.textContent = 'Connection closed.';
            if (isRecording) {
                stopConversation();
            }
        };

        socket.onerror = (error) => {
            console.error('WebSocket Error:', error);
            statusDiv.textContent = 'Error: Could not connect.';
            if (isRecording) {
                stopConversation();
            }
        };

        // --- 2. Get Microphone Access & Start Recording ---
        try {
            userMediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            const options = { mimeType: 'audio/webm; codecs=opus' };
            if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                console.error(`${options.mimeType} is not supported!`);
                alert('Your browser does not support the required audio recording format.');
                statusDiv.textContent = 'Error: Recording format not supported.';
                stopConversation();
                return;
            }
            mediaRecorder = new MediaRecorder(userMediaStream, options);

            mediaRecorder.ondataavailable = (event) => {
                if (socket.readyState === WebSocket.OPEN && event.data.size > 0) {
                    socket.send(event.data);
                }
            };

            mediaRecorder.start(TIMESLICE_MS);

        } catch (error) {
            console.error('Error getting user media:', error);
            statusDiv.textContent = 'Error: Microphone access denied.';
            stopConversation();
        }
    }

    /**
     * Stops the recording, closes the WebSocket, and cleans up resources.
     */
    function stopConversation() {
        statusDiv.textContent = 'Status: Idle';
        talkButton.textContent = 'Start Talking';
        isRecording = false;

        // Stop the media recorder
        if (mediaRecorder && mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
        }

        // Turn off the microphone track
        if (userMediaStream) {
            userMediaStream.getTracks().forEach(track => track.stop());
        }

        // Close the WebSocket connection
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.close();
        }
        
        // Reset the playback schedule time
        if (audioContext) {
            nextChunkTime = audioContext.currentTime;
        }
    }

    /**
     * Processes and precisely schedules audio chunks received from the server.
     * @param {ArrayBuffer} audioData - The raw audio data chunk.
     */
    async function scheduleAudioPlayback(audioData) {
        // Convert the raw PCM data from the server into a playable AudioBuffer.
        const pcm16Data = new Int16Array(await audioData.arrayBuffer());
        const float32Data = new Float32Array(pcm16Data.length);
        for (let i = 0; i < pcm16Data.length; i++) {
            float32Data[i] = pcm16Data[i] / 32768.0;
        }
      
        const audioBuffer = audioContext.createBuffer(
            1,
            float32Data.length,
            24000 // Gemini's output sample rate
        );
        audioBuffer.copyToChannel(float32Data, 0);

        // --- Precise Scheduling Logic ---

        // 1. Get the current time of the audio context's internal clock.
        const currentTime = audioContext.currentTime;

        // 2. Determine the correct start time for this chunk.
        // If nextChunkTime is in the past, reset the schedule to start playing from "now".
        if (nextChunkTime < currentTime) {
            nextChunkTime = currentTime;
        }

        // 3. Create a new audio source and connect it to the speakers.
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);

        // 4. Schedule this chunk to start playing at our calculated time.
        source.start(nextChunkTime);

        // 5. Update the time for the *next* chunk by adding the duration of *this* chunk.
        nextChunkTime += audioBuffer.duration;
    }
});