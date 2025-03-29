"use client";

import { useState, useEffect } from "react";
import { PDFDocument } from "pdf-lib";
import PDFViewer from "@/components/pdf-viewer";
import UploadArea from "@/components/upload-area";
import AnnotationToolbar from "@/components/annotation-toolbar";
import type { AnnotationType } from "@/lib/types";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface AnnotationData {
  type: "highlight" | "underline" | "comment" | "signature";
  pageNumber: number; // 1-based page index
  x: number; // DOM coordinate (left)
  y: number; // DOM coordinate (top)
  width?: number;
  height?: number;
  color?: string; // For highlight, underline
  text?: string; // For comments
  imageDataUrl?: string; // For signature images
}

export default function Home() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [currentTool, setCurrentTool] = useState<AnnotationType>("highlight");
  const [currentColor, setCurrentColor] = useState<string>("#FFFF00");
  const [error, setError] = useState<string | null>(null);

  // Clean up object URLs when component unmounts or when a new file is uploaded
  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  const handleFileUpload = (file: File) => {
    try {
      setError(null);

      if (file.size > 10 * 1024 * 1024) {
        setError("File is too large. Maximum size is 10MB.");
        return;
      }

      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }

      const fileUrl = URL.createObjectURL(file);

      if (!fileUrl || fileUrl === "about:blank") {
        setError("Failed to create a valid URL for the file.");
        return;
      }

      setPdfFile(file);
      setPdfUrl(fileUrl);

      console.log(
        "File uploaded successfully:",
        file.name,
        "Size:",
        (file.size / 1024 / 1024).toFixed(2) + "MB"
      );
    } catch (err) {
      console.error("Error uploading file:", err);
      setError("Failed to upload file. Please try again.");
    }
  };

  const handleExport = async () => {
    if (!pdfFile) return;

    try {
      setError(null);

      const arrayBuffer = await pdfFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `annotated-${pdfFile.name}`;
      link.click();

      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting PDF:", error);
      setError("Failed to export PDF. Please try again.");
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:p-8">
      <h1 className="text-3xl font-bold mb-8">PDF Annotator</h1>

      {error && (
        <Alert variant="destructive" className="mb-4 w-full max-w-6xl">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!pdfUrl ? (
        <UploadArea onFileUpload={handleFileUpload} />
      ) : (
        <div className="w-full max-w-6xl flex flex-col gap-4">
          <AnnotationToolbar
            currentTool={currentTool}
            setCurrentTool={setCurrentTool}
            currentColor={currentColor}
            setCurrentColor={setCurrentColor}
            onExport={handleExport}
          />
          <PDFViewer
            pdfUrl={pdfUrl ?? ``}
            currentTool={currentTool}
            currentColor={currentColor}
            onError={(errorMsg) => setError(errorMsg)}
          />
        </div>
      )}
    </main>
  );
}
