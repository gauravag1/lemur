import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Set worker URL for PDF.js
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

interface PdfViewerProps {
  file: File;
  onLoadSuccess: (numPages: number) => void;
  onTextExtracted: (text: string) => void;
}

const PdfViewer: React.FC<PdfViewerProps> = ({ file, onLoadSuccess, onTextExtracted }) => {
  const [numPages, setNumPages] = useState<number>(0);

  const handleLoadSuccess = async ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    onLoadSuccess(numPages);

    try {
      // Load the PDF document
      const pdf = await pdfjs.getDocument(URL.createObjectURL(file)).promise;
      
      // Extract text from all pages
      let fullText = '';
      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        fullText += pageText + '\n';
      }
      
      onTextExtracted(fullText);
    } catch (error) {
      console.error('Error extracting PDF text:', error);
    }
  };

  return (
    <div className="w-1/2 bg-gray-100 overflow-hidden">
      <div className="h-full overflow-y-auto p-4">
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
              width={Math.min(800, window.innerWidth / 2 - 64)}
            />
          ))}
        </Document>
      </div>
    </div>
  );
};

export default PdfViewer; 