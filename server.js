import express from 'express';
import fs from 'fs';
import path from 'path';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

// ES module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8081;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));

// API endpoint to generate canvas
app.post('/api/generate-canvas', async (req, res) => {
  try {
    // Read the prompt file
    const promptFilePath = path.join(__dirname, 'Custom_Prompts', 'canvas_prompt_real.txt');
    const responseFilePath = path.join(__dirname, 'Custom_Prompts', 'canvas_response.txt');
    
    // Read the prompt file content
    const promptText = fs.readFileSync(promptFilePath, 'utf8');
    
    // Get API key from environment variables
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'OpenAI API key is not configured' });
    }
    
    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4.1-nano',
        messages: [
          { role: 'user', content: promptText }
        ],
        temperature: 0.7
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`OpenAI API error: ${response.statusText}. ${JSON.stringify(errorData)}`);
    }
    
    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    console.log('--- DEBUG: Attempting to write to file ---');
    console.log('File path:', responseFilePath);
    console.log('AI Response content length:', aiResponse ? aiResponse.length : 'undefined/null');
    console.log('AI Response (first 500 chars):', aiResponse ? aiResponse.substring(0, 500) : 'undefined/null');
    
    // Write the response to the response file
    fs.writeFileSync(responseFilePath, aiResponse);
    console.log('--- DEBUG: File write operation completed. Check file content now. ---');
    
    res.json({ success: true, message: 'Canvas generated successfully' });
    
  } catch (error) {
    console.error('Error generating canvas:', error);
    res.status(500).json({ error: error.message || 'An unknown error occurred' });
  }
});

// Catch-all route to serve the React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});