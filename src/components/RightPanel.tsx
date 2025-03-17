import React, { useEffect, useState, useRef } from 'react';
import { Bot, Send, FileText, MessageSquare } from 'lucide-react';
import { generateSummary } from '../services/openrouter';
import ReactMarkdown from 'react-markdown';

interface RightPanelProps {
  numPages: number | null;
  message: string;
  messages: Array<{ text: string; isBot: boolean; role: 'user' | 'assistant' }>;
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
  const [activeTab, setActiveTab] = useState<'summary' | 'chat'>('summary');
  const [summary, setSummary] = useState<{
    text: string;
    loading: boolean;
    error?: string;
  }>({
    text: 'Loading...',
    loading: true,
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchSummary = async () => {
      if (pdfText) {
        try {
          setSummary(prev => ({ ...prev, loading: true, error: undefined }));
          
          // Start with empty summary
          setSummary(prev => ({
            ...prev,
            text: '',
            loading: true,
          }));

          await generateSummary(
            pdfText,
            (partialSummary: string) => {
              setSummary(prev => ({
                ...prev,
                text: partialSummary,
                loading: false,
              }));
            }
          );
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
          setSummary(prev => ({
            ...prev,
            loading: false,
            error: `Failed to generate summary: ${errorMessage}. Please check your API key and network connection.`
          }));
        }
      }
    };

    fetchSummary();
  }, [pdfText]);

  useEffect(() => {
    if (activeTab === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab]);

  return (
    <div className="w-1/2 bg-white border-l border-gray-200 flex flex-col overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('summary')}
          className={`flex items-center px-4 py-3 text-sm font-medium ${
            activeTab === 'summary'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <FileText className="w-4 h-4 mr-2" />
          Document Summary
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex items-center px-4 py-3 text-sm font-medium ${
            activeTab === 'chat'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <MessageSquare className="w-4 h-4 mr-2" />
          Chat
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'summary' ? (
          // Summary Content
          <div className="h-full overflow-y-auto">
            <div className="p-4">
              <div className="space-y-2 text-sm text-gray-600">
                <p>• Total Pages: {numPages}</p>
                <div className="prose prose-sm max-w-none">
                  {summary.loading ? (
                    <p className="text-blue-500">Generating summary...</p>
                  ) : summary.error ? (
                    <div className="text-red-500 text-sm p-2 bg-red-50 rounded">
                      {summary.error}
                    </div>
                  ) : (
                    <ReactMarkdown>{summary.text}</ReactMarkdown>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Chat Content
          <div className="flex flex-col h-full">
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
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200">
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
        )}
      </div>
    </div>
  );
};

export default RightPanel; 