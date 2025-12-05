import React, { useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchDocuments, deleteDocument } from "@/services/knowledgeBase";
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Trash2, FileText, Globe } from 'lucide-react';

// ✅ Renamed to avoid conflict with DOM Document type
interface KBDocument {
  id: string;
  name: string;
  upload_date: string;
  status: string;
  file_size: number;
  is_own_document: boolean;
  is_global_document: boolean;
  can_delete: boolean;
}

interface DeleteResponse {
  message: string;
  document: string;
}

interface DocumentListProps {
  searchTerm?: string;
}

const DocumentList: React.FC<DocumentListProps> = ({ searchTerm = '' }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const tableRef = useRef<HTMLDivElement>(null);
  const newDocRef = useRef<HTMLTableRowElement>(null);
  const prevDocsRef = useRef<KBDocument[]>([]);

  const { data: documents = [], isLoading, error } = useQuery<KBDocument[]>({
    queryKey: ['documents'],
    queryFn: async () => {
      const result = await fetchDocuments();
      return result as KBDocument[];
    },
    refetchInterval: 5000,
  });

  const deleteMutation = useMutation<DeleteResponse, any, string>({
    mutationFn: (documentId: string) => deleteDocument(documentId),
    onSuccess: (data: DeleteResponse) => {
      toast({
        title: 'Success',
        description: `Document "${data.document}" deleted successfully`,
      });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to delete document';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
      console.error("Delete error:", error);
    }
  });

  useEffect(() => {
    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch documents. Retrying... Check server status.',
        variant: 'destructive'
      });
      console.error("Document fetch error:", error);
    }
  }, [error, toast]);

  // Detect new documents and scroll to them
  useEffect(() => {
    if (documents.length > prevDocsRef.current.length) {
      const newDocs = documents.filter(
        doc => !prevDocsRef.current.some(prevDoc => prevDoc.id === doc.id)
      );
      if (newDocs.length > 0 && newDocRef.current) {
        newDocRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
    prevDocsRef.current = documents;
  }, [documents]);

  const handleDelete = async (documentId: string, documentName: string, canDelete: boolean) => {
    if (!canDelete) {
      toast({
        title: 'Cannot Delete',
        description: 'You cannot delete global documents uploaded by admin',
        variant: 'destructive'
      });
      return;
    }

    if (window.confirm(`Are you sure you want to delete "${documentName}"?`)) {
      deleteMutation.mutate(documentId);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'uploaded':
        return 'text-green-400';
      case 'processing':
        return 'text-yellow-400';
      case 'error':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case 'uploaded':
        return 'Active';
      default:
        return status;
    }
  };

  const matchedDocIndex = documents.findIndex(doc =>
    doc.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const matchedDocRef = useRef<HTMLTableRowElement>(null);

  useEffect(() => {
    if (matchedDocRef.current && matchedDocIndex >= 0) {
      matchedDocRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [matchedDocIndex]);

  if (isLoading) return <div className="text-center p-4 text-gray-400">Loading documents...</div>;

  return (
    <div
      ref={tableRef}
      className="bg-white-900 rounded-lg overflow-auto max-h-[60vh] scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800"
    >
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-black-700 sticky top-0 bg-white z-10">
            <th className="p-4 text-black-300 font-medium">Document Title</th>
            <th className="p-4 text-black-300 font-medium">Uploaded Date</th>
            <th className="p-4 text-black-300 font-medium">Status</th>
            <th className="p-4 text-black-300 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {documents.length > 0 ? (
            documents.map((doc, index) => {
              const isFirstMatch = index === matchedDocIndex && searchTerm.trim() !== '';
              const isAnyMatch =
                doc.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
                searchTerm.trim() !== '';
              const isNewDoc = !prevDocsRef.current.some(prevDoc => prevDoc.id === doc.id);
              
              // ✅ Styling: Own docs highlighted, global docs faded
              const rowClass = doc.is_own_document 
                ? 'bg-blue-50 border-l-4 border-l-blue-500' // Own document - highlighted
                : 'bg-gray-50 opacity-75'; // Global document - faded

              return (
                <tr
                  key={doc.id}
                  ref={isFirstMatch ? matchedDocRef : isNewDoc ? newDocRef : null}
                  className={`border-b border-black-800 transition-colors ${
                    isFirstMatch
                      ? 'bg-yellow-200'
                      : isAnyMatch
                      ? 'bg-yellow-100'
                      : isNewDoc
                      ? 'bg-green-100'
                      : rowClass
                  }`}
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-black-400" />
                      <span className="text-black-200">{doc.name}</span>
                      {doc.is_global_document && (
                        <div title="Global document (shared by admin)">
                          <Globe className="w-4 h-4 text-blue-500" />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-black-300">
                    {new Date(doc.upload_date).toLocaleDateString()}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${getStatusColor(doc.status).replace('text-', 'bg-')}`}
                      ></div>
                      <span className={getStatusColor(doc.status)}>
                        {getStatusText(doc.status)}
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    {/* ✅ Always show delete button, but disable for global docs */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(doc.id, doc.name, doc.can_delete)}
                      disabled={!doc.can_delete || deleteMutation.isPending}
                      className={`${
                        doc.can_delete
                          ? 'text-red-600 hover:text-red-700 hover:bg-red-50'
                          : 'text-gray-400 cursor-not-allowed opacity-50'
                      }`}
                      title={doc.can_delete ? 'Delete document' : 'Cannot delete admin documents'}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={4} className="p-8 text-center text-black-500">
                No documents found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default DocumentList;