// src/services/geminiService.js

const { GoogleGenAI, Modality } = require('@google/genai');
const { OpusEncoder } = require('@discordjs/opus');
const ebml = require('ebml'); // Correct EBML/WebM library

const genAI = new GoogleGenAI(process.env.GEMINI_API_KEY);

/**
 * Handles real-time, server-to-server audio chat by decoding
 * WebM/Opus audio in pure JavaScript
 * @param {WebSocket} ws The WebSocket connection from the client.
 */
async function startChat(ws) {
  console.log('Starting new real-time chat session (JavaScript-based)...');

  try {
    const session = await genAI.live.connect({
      model: "gemini-2.5-flash-preview-native-audio-dialog",
      config: {
        responseModalities: [Modality.AUDIO],
        systemInstruction: "You are an expert sales and support assistant for Revolt Motors. You are enthusiastic, clear, and helpful. Your sole purpose is to answer questions about Revolt's products and company. Do not discuss other topics."
      },
      callbacks: {
        onopen: () => console.log('Google AI session opened.'),
        onclose: () => console.log('Google AI session closed.'),
        onerror: (e) => console.error('Google AI error:', e.message),
        onmessage: (message) => {
          if (ws.readyState === ws.OPEN && message.data) {
            const audioBuffer = Buffer.from(message.data, 'base64');
            ws.send(audioBuffer);
          }
        },
      },
    });

    // 1. Create the Opus decoder.
    const opusDecoder = new OpusEncoder(16000, 1);
    
    // 2. Create the EBML decoder.
    const ebmlDecoder = new ebml.Decoder();

    // 3. When the decoder finds an EBML tag, check if it's a SimpleBlock.
    // A SimpleBlock in a WebM file contains the raw Opus audio data.
    ebmlDecoder.on('data', (chunk) => {
      if (chunk[1].name === 'SimpleBlock') {
        try {
          // The Opus data is inside the SimpleBlock's payload.
          const opusChunk = chunk[1].payload;
          
          // Decode the Opus chunk to raw PCM
          const pcmChunk = opusDecoder.decode(opusChunk);
          
          // Base64 encode the PCM and send it to the Gemini API
          const base64Audio = pcmChunk.toString('base64');
          session.sendRealtimeInput({
            audio: { data: base64Audio, mimeType: "audio/pcm;rate=16000" }
          });
        } catch (error) {
          console.error('Opus decoding error:', error);
        }
      }
    });

    // 4. When the browser sends an audio chunk, feed it to the EBML decoder.
    ws.on('message', (clientAudioChunk) => {
      ebmlDecoder.write(clientAudioChunk);
    });

    // 5. Handle cleanup.
    ws.on('close', () => {
      console.log('Client disconnected. Closing session.');
      session.close();
    });
    
  } catch (error) {
    console.error('Failed to connect to Google AI:', error);
    ws.close();
  }
}

module.exports = { startChat };