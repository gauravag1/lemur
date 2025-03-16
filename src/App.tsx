import React, { useState } from 'react';
import { Upload, FileText, Send, Bot } from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Set worker URL for PDF.js
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<{ text: string; isBot: boolean }[]>([]);
  const [numPages, setNumPages] = useState<number | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files?.[0]) {
      setFile(event.target.files[0]);
    }
  };

  const handleMessageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      setMessages([...messages, { text: message, isBot: false }]);
      // Simulate AI response
      setTimeout(() => {
        setMessages(prev => [...prev, { 
          text: "I'm analyzing the document and will provide relevant information shortly.", 
          isBot: true 
        }]);
      }, 1000);
      setMessage('');
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
        <div className="flex h-screen">
          {/* PDF Viewer */}
          <div className="flex-1 bg-gray-100 p-4 overflow-auto">
            <Document
              file={file}
              onLoadSuccess={({ numPages }) => setNumPages(numPages)}
              className="flex flex-col items-center"
            >
              {Array.from(new Array(numPages), (_, index) => (
                <Page
                  key={`page_${index + 1}`}
                  pageNumber={index + 1}
                  className="mb-4 shadow-lg"
                  width={800}
                />
              ))}
            </Document>
          </div>

          {/* Right Panel */}
          <div className="w-96 bg-white border-l border-gray-200 flex flex-col">
            {/* Document Summary */}
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold mb-2">Document Summary</h2>
              <div className="space-y-2 text-sm text-gray-600">
                <p>• Property Type: Single Family Home</p>
                <p>• Inspection Date: March 15, 2024</p>
                <p>• Total Pages: {numPages}</p>
                <p>• Key Findings: 3 major issues identified</p>
              </div>
            </div>

            {/* Chat Interface */}
            <div className="flex-1 flex flex-col">
              <div className="flex-1 overflow-auto p-4 space-y-4">
                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex ${msg.isBot ? 'justify-start' : 'justify-end'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        msg.isBot
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-blue-500 text-white'
                      }`}
                    >
                      {msg.isBot && (
                        <Bot className="w-4 h-4 inline-block mr-2" />
                      )}
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>

              {/* Message Input */}
              <form onSubmit={handleMessageSubmit} className="p-4 border-t border-gray-200">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Ask about the document..."
                    className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    className="bg-blue-500 text-white rounded-lg px-4 py-2 hover:bg-blue-600 transition-colors"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;