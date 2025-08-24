# Real-Time AI Voice Assistant (Revolt Motors)

This project is a real-time, low-latency conversational AI voice assistant that runs in the browser. It features a secure server-to-server architecture where the browser streams audio to a Node.js backend, which then communicates with the Google Gemini Live API. This implementation is specifically configured to act as an expert on Revolt Motors.

## Features

- **Real-Time Conversation:** Engage in a low-latency, real-time voice chat with the AI.
- **Interruptible AI:** The user can interrupt the AI at any time, and it will stop speaking to listen to the new input.
- **Server-Side Security:** The architecture ensures that the Google Gemini API key remains secure on the backend and is never exposed to the client.
- **Pure JavaScript Audio Processing:** Audio transcoding from the browser's native WebM/Opus format to the required PCM format is handled entirely within Node.js using lightweight JavaScript libraries, eliminating the need for external dependencies like FFmpeg.
- **Advanced Audio Scheduling:** The frontend uses a precise audio scheduling engine to ensure smooth, crackle-free playback of the AI's response.

## Technology Stack

- **Backend:** Node.js, Express.js, WebSockets (`ws`)
- **Frontend:** HTML, CSS, JavaScript (Web Audio API, `MediaRecorder`)
- **AI Service:** Google Gemini Live API (`@google/genai`)
- **Audio Processing:** `@discordjs/opus`, `ebml`

## Setup and Installation

### 1. Prerequisites

- [Node.js](https://nodejs.org/) (version 18 or higher)
- A free Google Gemini API key from [aistudio.google.com](https://aistudio.google.com/)

### 2. Clone the Repository

```bash
git https://github.com/hardik-47/revolt-ai.git
cd revolt-ai
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Configure Environment Variables

In the root of the project, create a new file named `.env`.

Add your Google Gemini API key to this file:

```bash
GEMINI_API_KEY="YOUR_API_KEY_HERE"
```

Replace `YOUR_API_KEY_HERE` with your actual key.

## How to Run the Application

### Start the Server

```bash
node src/server.js
```

You should see a confirmation message in the terminal:
```
🚀 Server is live at http://localhost:3000
```

### Open the Application

Open your web browser (Chrome or Firefox recommended) and navigate to [http://localhost:3000](http://localhost:3000).

### Start a Conversation

1. Click the "Start Talking" button.  
2. Your browser will ask for permission to use your microphone. You must click **Allow**.  
3. Begin speaking to the Revolt Motors AI assistant.

##Project Video

<video src="vid.mp4" controls width="600"></video>