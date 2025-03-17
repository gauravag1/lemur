interface OpenRouterMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface OpenRouterResponse {
  choices: {
    delta?: {
      content?: string;
    };
    message?: {
      content: string;
    };
    finish_reason: string | null;
  }[];
}

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;

if (!OPENROUTER_API_KEY) {
  throw new Error('OpenRouter API key not found. Please check your .env file.');
}

const BASE_URL = 'https://openrouter.ai/api/v1';

async function* streamResponse(response: Response) {
  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  
  if (!reader) return;

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');
      
      for (const line of lines) {
        if (!line.trim() || !line.startsWith('data: ')) continue;
        
        const jsonStr = line.replace('data: ', '').trim();
        if (jsonStr === '[DONE]') continue;
        
        try {
          const data = JSON.parse(jsonStr);
          // OpenRouter streaming format specifically uses choices[0].delta.content
          if (data.choices?.[0]?.delta?.content) {
            yield data.choices[0].delta.content;
          }
        } catch (e) {
          console.error('Error parsing JSON line:', e);
          console.log('Problematic line:', jsonStr);
          continue;
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

export async function generateSummary(
  pdfText: string,
  onToken?: (token: string) => void
): Promise<string> {
  try {
    const messages: OpenRouterMessage[] = [
      {
        role: 'system',
        content: "You are a real estate inspection document analyzer. Use markdown formatting for headers and bullet points. Be clear and concise. Do NOT ask the user follow up questions."
      },
      {
        role: 'user',
        content: `Analyze this real estate inspection document and provide a concise summary using markdown formatting (not more than 500 tokens).

## Property Overview
- [1-2 key details about property type/size]

## Major Issues
- [List 3-4 most important issues found]

## Recommendations
- [List 2-3 key recommendations]

Document text: ${pdfText}`
      }
    ];

    const response = await fetch(`${BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': window.location.origin,
      },
      body: JSON.stringify({
        model: 'google/gemma-3-4b-it:free',
        messages,
        stream: true,
        temperature: 0.3,
        max_tokens: 1000,
        response_format: { type: "text" }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error: ${response.status} ${response.statusText}\n${errorText}`);
    }

    let fullResponse = '';
    for await (const token of streamResponse(response)) {
      if (token) {
        fullResponse += token;
        onToken?.(fullResponse);
      }
    }

    return fullResponse;
  } catch (error) {
    console.error('Summary generation error:', error);
    throw error;
  }
}

export async function generateChatResponse(
  question: string,
  pdfText: string,
  chatHistory: { role: 'user' | 'assistant', content: string }[] = [],
  onToken?: (token: string) => void
): Promise<string> {
  try {
    const messages: OpenRouterMessage[] = [
      {
        role: 'system',
        content: "You are a real estate inspection document analyzer. The following text is from a real estate inspection report. Use this document to answer questions, and include specific citations using [text](page:line) format. Be clear and concise."
      },
      {
        role: 'system',
        content: `Here is the inspection document to analyze: ${pdfText}`
      },
      ...chatHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      {
        role: 'user',
        content: question
      }
    ];

    const response = await fetch(`${BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': window.location.origin,
      },
      body: JSON.stringify({
        model: 'google/gemma-3-4b-it:free',
        messages,
        stream: true,
        temperature: 0.3,
        max_tokens: 1000,
        response_format: { type: "text" }
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    let fullResponse = '';
    for await (const token of streamResponse(response)) {
      fullResponse += token;
      onToken?.(fullResponse);
    }

    return fullResponse;
  } catch (error) {
    console.error('Chat response error:', error);
    throw error;
  }
} 