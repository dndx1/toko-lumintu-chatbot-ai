// File: api/gemini.js
// PASTIKAN file ini ada di folder: api/gemini.js

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST
  if (req.method !== 'POST') {
    console.error('❌ Method not allowed:', req.method);
    return res.status(405).json({ 
      error: 'Method not allowed',
      method: req.method 
    });
  }

  try {
    // Get API key from environment
    const API_KEY = process.env.GEMINI_API_KEY;

    // Check if API key exists
    if (!API_KEY) {
      console.error('❌ GEMINI_API_KEY tidak ditemukan di environment variables');
      return res.status(500).json({ 
        error: 'Server configuration error',
        details: 'GEMINI_API_KEY not configured in environment variables'
      });
    }

    console.log('✅ API Key ditemukan, length:', API_KEY.length);

    // Get message from request body
    const { message } = req.body;

    if (!message) {
      console.error('❌ Message tidak ada di request body');
      return res.status(400).json({ 
        error: 'Bad request',
        details: 'Message field is required in request body' 
      });
    }

    console.log('📝 Message received, length:', message.length);

    // ✅ GUNAKAN GEMINI 2.5 FLASH
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

    console.log('📤 Sending request to Gemini 2.5 Flash...');

    // Call Gemini API
    const geminiResponse = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: message,
              },
            ],
          },
        ],
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_NONE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_NONE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_NONE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_NONE"
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      }),
    });

    console.log('📥 Gemini API response status:', geminiResponse.status);

    // Check if response is OK
    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('❌ Gemini API error response:', errorText);
      
      // Parse error if possible
      try {
        const errorData = JSON.parse(errorText);
        return res.status(geminiResponse.status).json(errorData);
      } catch {
        return res.status(geminiResponse.status).json({
          error: 'Gemini API error',
          status: geminiResponse.status,
          details: errorText
        });
      }
    }

    // Parse JSON response
    const data = await geminiResponse.json();
    
    console.log('✅ Gemini API response received successfully');

    // Return the response
    return res.status(200).json(data);

  } catch (error) {
    console.error('❌ Internal server error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}