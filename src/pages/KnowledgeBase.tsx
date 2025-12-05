import { useState } from 'react';
import DocumentUpload from '../components/KnowledgeBase/DocumentUpload';
import DocumentList from '../components/KnowledgeBase/DocumentList';
import { Search, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
 
export default function KnowledgeBase() {
  const [searchTerm, setSearchTerm] = useState('');
 
  return (
    <div className="p-6 bg-white min-h-screen">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">Knowledge Base</h1>
 
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
 
    </div>
  );
}
 
 