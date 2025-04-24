import React from 'react';
import { Document } from '@/models/DocumentTypes';

interface DocumentCardProps {
  document: Document;
}

export default function DocumentCard({ document }: DocumentCardProps) {
  return (
    <div className="relative">
      {document.filetype === 'pdf' ? (
        <iframe 
          src={`/api/documents/preview?filename=${encodeURIComponent(document.filename || document.originalFilename)}`}
          className="w-full h-48 rounded-lg"
        />
      ) : (
        <img
          src={`/api/documents/preview?filename=${encodeURIComponent(document.filename || document.originalFilename)}`}
          alt={document.filename || document.originalFilename}
          className="w-full h-48 object-cover rounded-lg"
        />
      )}
      <div className="absolute bottom-0 left-0 right-0 p-2 bg-black bg-opacity-50 text-white">
        <span className="text-sm truncate">{document.filename || document.originalFilename}</span>
      </div>
    </div>
  );
} 