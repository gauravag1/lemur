import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Set worker URL for PDF.js
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

interface PdfViewerProps {
  file: File;
  onLoadSuccess: (numPages: number) => void;
}

const PdfViewer: React.FC<PdfViewerProps> = ({ file, onLoadSuccess }) => {
  const [numPages, setNumPages] = useState<number>(0);

  const handleLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    onLoadSuccess(numPages);
  };

  return (
    <div className="flex-1 bg-gray-100 p-4 overflow-auto">
      <Document
        file={file}
        onLoadSuccess={handleLoadSuccess}
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
  );
};

export default PdfViewer; 