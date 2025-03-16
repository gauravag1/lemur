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

async function callOllama(request: OllamaRequest): Promise<string> {
  try {
    // First check if Ollama is running
    try {
      await fetch('http://localhost:11434/api/version');
    } catch (e) {
      throw new Error('Cannot connect to Ollama. Please make sure Ollama is running.');
    }

    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Ollama API Error:', errorText);
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data: OllamaResponse = await response.json();
    return data.response;
  } catch (error) {
    console.error('Ollama error:', error);
    if (error instanceof Error) {
      if (error.message.includes('Cannot connect to Ollama')) {
        return 'Error: Cannot connect to Ollama. Please make sure Ollama is running on your system.';
      }
      return `Error: ${error.message}. Please ensure Ollama is running and the gemma3:4b model is installed using 'ollama pull gemma3:4b'`;
    }
    return 'Failed to generate response. Please check if Ollama is running.';
  }
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
        prompt: `Analyze this real estate inspection document and provide a concise summary using markdown formatting (not more than 10 sentences).

## Property Overview
- [1-2 key details about property type/size]

## Major Issues
- [List 3-4 most important issues found]

## Recommendations
- [List 2-3 key recommendations]

Document text: ${pdfText}`,
        system: "You are a real estate inspection document analyzer. Use markdown formatting for headers and bullet points. Be clear and concise. Do NOT ask the user follow up questions.",
        stream: true,
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
  
  if (!reader) return;

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    
    const chunk = decoder.decode(value);
    const lines = chunk.split('\n').filter(line => line.trim());
    
    for (const line of lines) {
      try {
        const data: OllamaResponse = JSON.parse(line);
        yield data.response;
      } catch (e) {
        console.error('Error parsing JSON:', e);
      }
    }
  }
}

export async function generateChatResponse(
  question: string, 
  pdfText: string, 
  chatHistory: Message[] = [],
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
        prompt: `Given this inspection document: "${pdfText}"

Previous conversation:
${chatHistory.map(msg => `${msg.role.toUpperCase()}: ${msg.content}`).join('\n')}

Current question: ${question}

Please provide a helpful and concise answer based on the document content and previous conversation context. Format your response using markdown.`,
        system: "You are a helpful real estate inspection document analyzer. Answer questions based on the document content and conversation history.",
        stream: true, // Enable streaming
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