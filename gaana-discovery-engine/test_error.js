import Groq from 'groq-sdk';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });
const model = 'llama3-8b-8192';

async function test() {
  try {
    const response = await client.chat.completions.create({
      model: model,
      messages: [{ role: 'user', content: '{"status": "ok"}' }],
      temperature: 0.1,
      response_format: { type: "json_object" }
    });
    console.log("Success:", response.choices[0].message.content);
  } catch (err) {
    console.error("Error:", err.message);
  }
}

test();
