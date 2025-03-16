import React, { useState } from 'react';
import { Upload, FileText, Send, Bot } from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import PdfViewer from './components/PdfViewer';
import RightPanel from './components/RightPanel';
import { generateChatResponse } from './services/ollama';

// Set worker URL for PDF.js
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

// Add new interface for Message
interface Message {
  text: string;
  isBot: boolean;
  role: 'user' | 'assistant';
}

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pdfText, setPdfText] = useState<string>('');

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files?.[0]) {
      setFile(event.target.files[0]);
    }
  };

  const handleMessageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      // Add user message
      const userMessage: Message = { 
        text: message, 
        isBot: false, 
        role: 'user' 
      };
      setMessages(prev => [...prev, userMessage]);
      
      const userQuestion = message;
      setMessage('');

      try {
        // Add initial assistant message
        const assistantMessage: Message = {
          text: '',
          isBot: true,
          role: 'assistant'
        };
        setMessages(prev => [...prev, assistantMessage]);

        // Convert messages to format expected by generateChatResponse
        const chatHistory = messages.map(msg => ({
          role: msg.role,
          content: msg.text
        }));

        // Stream the response
        await generateChatResponse(
          userQuestion, 
          pdfText, 
          chatHistory,
          (partialResponse) => {
            setMessages(prev => [
              ...prev.slice(0, -1),
              {
                text: partialResponse,
                isBot: true,
                role: 'assistant'
              }
            ]);
          }
        );
      } catch (error) {
        // Update with error message
        setMessages(prev => [
          ...prev.slice(0, -1),
          {
            text: "Sorry, I encountered an error while analyzing the document.",
            isBot: true,
            role: 'assistant'
          }
        ]);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {!file ? (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
            <div className="text-center">
              <div className="bg-blue-50 rounded-full p-3 inline-block mb-4">
                <FileText className="w-8 h-8 text-blue-500" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Upload Your Inspection Document</h1>
              <p className="text-gray-600 mb-6">Upload your real estate inspection PDF to get AI-powered insights</p>
            </div>
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">Click to upload or drag and drop</p>
                <p className="text-xs text-gray-500">PDF (up to 10MB)</p>
              </div>
              <input type="file" className="hidden" accept=".pdf" onChange={handleFileChange} />
            </label>
          </div>
        </div>
      ) : (
        <div className="flex h-screen overflow-hidden">
          <PdfViewer 
            file={file} 
            onLoadSuccess={(numPages) => setNumPages(numPages)}
            onTextExtracted={(text) => setPdfText(text)}
          />
          <RightPanel
            numPages={numPages}
            message={message}
            messages={messages}
            onMessageChange={(newMessage) => setMessage(newMessage)}
            onMessageSubmit={handleMessageSubmit}
            pdfText={pdfText}
          />
        </div>
      )}
    </div>
  );
}

export default App;