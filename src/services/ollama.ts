interface OllamaResponse {
  response: string;
  done: boolean;
}

interface OllamaRequest {
  model: string;
  prompt?: string;
  system?: string;
  stream: boolean;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface OllamaChatResponse {
  message?: {
    role: string;
    content: string;
  };
  done: boolean;
}

export async function generateSummary(
  pdfText: string,
  onToken?: (token: string) => void
): Promise<string> {
  try {
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gemma3:4b',
        prompt: `Analyze this real estate inspection document and provide a concise summary using markdown formatting (not more than 500 tokens).

## Property Overview
- [1-2 key details about property type/size]

## Major Issues
- [List 3-4 most important issues found]

## Recommendations
- [List 2-3 key recommendations]

Document text: ${pdfText}`,
        system: "You are a real estate inspection document analyzer. Use markdown formatting for headers and bullet points. Be clear and concise. Do NOT ask the user follow up questions.",
        stream: true,
        options: {
          num_ctx: 128000,
        },
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
    console.error('Summary generation error:', error);
    throw error;
  }
}

async function* streamResponse(response: Response) {
  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  
  if (!reader) return;

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      
      buffer += decoder.decode(value, { stream: true });
      
      // Split on newlines, keeping any partial line in the buffer
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep the last (potentially partial) line
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) continue;
        
        try {
          const data = JSON.parse(trimmedLine);
          if (data.message?.content) {
            // Chat API format
            yield data.message.content;
          } else if (data.response) {
            // Generate API format
            yield data.response;
          }
        } catch (e) {
          console.error('Error parsing JSON line:', trimmedLine);
          continue;
        }
      }
    }
    
    // Handle any remaining data in the buffer
    if (buffer.trim()) {
      try {
        const data = JSON.parse(buffer.trim());
        if (data.message?.content) {
          yield data.message.content;
        } else if (data.response) {
          yield data.response;
        }
      } catch (e) {
        console.error('Error parsing final buffer:', buffer);
      }
    }
  } finally {
    reader.releaseLock();
  }
}

export async function generateChatResponse(
  question: string, 
  pdfText: string, 
  chatHistory: Message[] = [],
  onToken?: (token: string) => void
): Promise<string> {
  try {
    // Convert chat history to Ollama's chat message format
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: `You are a helpful real estate inspection document analyzer. Answer questions based on the document content and conversation history. Here is the inspection document to analyze: "${pdfText}"`
      },
      // Convert existing chat history
      ...chatHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      // Add the current question
      {
        role: 'user',
        content: question
      }
    ];

    const response = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gemma3:4b',
        messages,
        stream: true,
        options: {
          num_ctx: 128000,
        },
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