import React, { useState } from 'react';
import Chatbot from '../components/KnowledgeBase/Chatbot';
import DocumentUpload from '../components/KnowledgeBase/DocumentUpload';
import DocumentList from '../components/KnowledgeBase/DocumentList';
import { Search, MessageSquare } from 'lucide-react';

export default function KnowledgeBase() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="p-6 bg-white min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Knowledge Base</h1>

      <div className="flex justify-between items-center mb-4 gap-4">
        <div className="relative w-1/3">
          <Search className="absolute left-2 top-2.5 text-gray-500 w-4 h-4" />
          <input
            type="text"
            placeholder="Search knowledge base..."
            className="pl-8 p-2 rounded border border-gray-300 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <DocumentUpload />
      </div>

      <DocumentList searchTerm={searchTerm} />

      <button
        onClick={() => setIsChatOpen(!isChatOpen)}
        className="fixed bottom-4 right-4 bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700"
      >
        <MessageSquare className="w-5 h-5" />
      </button>

      {isChatOpen && (
        <div className="fixed top-0 right-0 h-full w-96 bg-gray-100 shadow-lg z-50">
          <Chatbot onClose={() => setIsChatOpen(false)} />
        </div>
      )}
    </div>
  );
}
