import React, { useEffect, useState } from 'react';
import { Bot, Send } from 'lucide-react';
import { generateSummary } from '../services/ollama';
import ReactMarkdown from 'react-markdown';

interface RightPanelProps {
  numPages: number | null;
  message: string;
  messages: Array<{ text: string; isBot: boolean }>;
  onMessageChange: (message: string) => void;
  onMessageSubmit: (e: React.FormEvent) => void;
  pdfText: string;
}

const RightPanel: React.FC<RightPanelProps> = ({
  numPages,
  message,
  messages,
  onMessageChange,
  onMessageSubmit,
  pdfText
}) => {
  const [summary, setSummary] = useState<{
    text: string;
    loading: boolean;
    error?: string;
  }>({
    text: 'Loading...',
    loading: true,
  });

  useEffect(() => {
    const fetchSummary = async () => {
      if (pdfText) {
        try {
          setSummary(prev => ({ ...prev, loading: true, error: undefined }));
          const summaryText = await generateSummary(pdfText);
          
          if (summaryText.startsWith('Error:')) {
            setSummary({
              text: '',
              loading: false,
              error: summaryText
            });
            return;
          }

          setSummary({
            text: summaryText,
            loading: false,
          });
        } catch (error) {
          setSummary({
            text: '',
            loading: false,
            error: 'Failed to generate summary. Please check if Ollama is running.'
          });
        }
      }
    };

    fetchSummary();
  }, [pdfText]);

  return (
    <div className="w-1/2 bg-white border-l border-gray-200 flex flex-col overflow-hidden">
      {/* Document Summary - Scrollable with fixed height */}
      <div className="border-b border-gray-200 flex-shrink-0 max-h-[40vh] overflow-y-auto">
        <div className="p-4">
          <h2 className="text-lg font-semibold mb-2">Document Summary</h2>
          {summary.error ? (
            <div className="text-red-500 text-sm p-2 bg-red-50 rounded">
              {summary.error}
            </div>
          ) : (
            <div className="space-y-2 text-sm text-gray-600">
              <p>• Total Pages: {numPages}</p>
              <div className="prose prose-sm max-w-none">
                {summary.loading ? (
                  <p className="text-blue-500">Generating summary...</p>
                ) : (
                  <ReactMarkdown>{summary.text}</ReactMarkdown>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Chat Interface - Takes remaining height */}
      <div className="flex-1 flex flex-col overflow-hidden min-h-0">
        {/* Messages - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.isBot ? 'justify-start' : 'justify-end'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  msg.isBot
                    ? 'bg-white border border-gray-200'
                    : 'bg-blue-500 text-white'
                }`}
              >
                {msg.isBot ? (
                  <div className="space-y-2 text-sm text-gray-600">
                    <Bot className="w-4 h-4 inline-block mr-2" />
                    <div className="prose prose-sm max-w-none">
                      <ReactMarkdown>{msg.text}</ReactMarkdown>
                    </div>
                  </div>
                ) : (
                  msg.text
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Message Input - Fixed at bottom */}
        <div className="p-4 border-t border-gray-200 flex-shrink-0">
          <form onSubmit={onMessageSubmit} className="flex space-x-2">
            <input
              type="text"
              value={message}
              onChange={(e) => onMessageChange(e.target.value)}
              placeholder="Ask about the document..."
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="bg-blue-500 text-white rounded-lg px-4 py-2 hover:bg-blue-600 transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RightPanel; 