"use client";

import type React from "react";
import { useRef, useState, useEffect, useMemo } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Loader2 } from "lucide-react";
import SignatureCanvas from "@/components/signature-canvas";
import CommentDialog from "@/components/comment-dialog";
import type { AnnotationType } from "@/lib/types";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

interface AnnotationData {
  type: "highlight" | "underline" | "comment" | "signature";
  pageNumber: number;
  x: number;
  y: number;
  width?: number;
  height?: number;
  color?: string;
  text?: string;
  imageDataUrl?: string;
}

interface PDFViewerProps {
  pdfUrl: string;
  currentTool: AnnotationType;
  currentColor: string;
  onError: (message: string) => void;
}

export default function PDFViewer({
  pdfUrl,
  currentTool,
  currentColor,
  onError,
}: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [showSignatureCanvas, setShowSignatureCanvas] =
    useState<boolean>(false);
  const [signaturePosition, setSignaturePosition] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const [showCommentDialog, setShowCommentDialog] = useState<boolean>(false);
  const [commentPosition, setCommentPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const [pdfData, setPdfData] = useState<ArrayBuffer | null>(null);

  const [annotationDomElements, setAnnotationDomElements] = useState<
    HTMLElement[]
  >([]);

  const [annotationData, setAnnotationData] = useState<AnnotationData[]>([]);

  const containerRef = useRef<HTMLDivElement>(null);
  const annotationLayerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchPdf = async () => {
      try {
        setIsLoading(true);
        console.log("Fetching PDF from URL:", pdfUrl);

        const response = await fetch(pdfUrl);
        if (!response.ok) {
          throw new Error(
            `Failed to fetch PDF: ${response.status} ${response.statusText}`
          );
        }

        const data = await response.arrayBuffer();
        if (!data || data.byteLength === 0) {
          throw new Error("Received empty PDF data");
        }

        console.log(
          "PDF data fetched successfully, size:",
          (data.byteLength / 1024).toFixed(2) + "KB"
        );
        setPdfData(data);
      } catch (error) {
        console.error("Error fetching PDF:", error);
        onError(
          `Failed to load PDF: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
        setIsLoading(false);
      }
    };

    if (pdfUrl) {
      fetchPdf();
    }
  }, [pdfUrl, onError]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    console.log("PDF loaded successfully with", numPages, "pages");
    setNumPages(numPages);
    setIsLoading(false);
  };

  const onDocumentLoadError = (error: Error) => {
    console.error("Error loading PDF document:", error);
    onError(`Failed to load PDF: ${error.message}`);
    setIsLoading(false);
  };

  const handlePrevPage = () => {
    setPageNumber((prev) => Math.max(prev - 1, 1));
  };
  const handleNextPage = () => {
    setPageNumber((prev) => (numPages ? Math.min(prev + 1, numPages) : prev));
  };

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.2, 3));
  };
  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.2, 0.5));
  };

  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (currentTool === "signature") {
      setSignaturePosition({ x, y });
      setShowSignatureCanvas(true);
    } else if (currentTool === "comment") {
      setCommentPosition({ x, y });
      setShowCommentDialog(true);
    }
  };

  const handleTextSelection = () => {
    if (currentTool !== "highlight" && currentTool !== "underline") return;

    const selection = window.getSelection();
    if (!selection || selection.toString().length === 0) return;

    try {
      const range = selection.getRangeAt(0);
      const rects = range.getClientRects();
      if (!rects.length) return;

      const containerRect = containerRef.current?.getBoundingClientRect();
      if (!containerRect) return;

      for (let i = 0; i < rects.length; i++) {
        const rect = rects[i];

        const left =
          rect.left -
          containerRect.left +
          (containerRef.current?.scrollLeft || 0);
        const top =
          rect.top - containerRect.top + (containerRef.current?.scrollTop || 0);

        const highlightEl = document.createElement("div");
        highlightEl.className = "absolute pointer-events-none";
        highlightEl.style.left = `${left}px`;
        highlightEl.style.top = `${top}px`;
        highlightEl.style.width = `${rect.width}px`;
        highlightEl.style.height = `${rect.height}px`;

        if (currentTool === "highlight") {
          highlightEl.style.backgroundColor = currentColor;
          highlightEl.style.opacity = "0.3";
        } else if (currentTool === "underline") {
          highlightEl.style.borderBottom = `2px solid ${currentColor}`;
          highlightEl.style.height = "0";
          highlightEl.style.top = `${top + rect.height}px`;
        }

        annotationLayerRef.current?.appendChild(highlightEl);

        setAnnotationDomElements((prev) => [...prev, highlightEl]);

        const annotation: AnnotationData = {
          type: currentTool,
          pageNumber,
          x: left,
          y: top,
          width: rect.width,
          height: rect.height,
          color: currentColor,
        };
        setAnnotationData((prev) => [...prev, annotation]);
      }

      selection.removeAllRanges();
    } catch (e) {
      console.error("Error applying annotation:", e);
    }
  };

  const handleAddSignature = (signatureDataUrl: string) => {
    if (!signaturePosition || !annotationLayerRef.current) return;

    const img = document.createElement("img");
    img.src = signatureDataUrl;
    img.style.position = "absolute";
    img.style.left = `${signaturePosition.x}px`;
    img.style.top = `${signaturePosition.y}px`;
    img.style.maxWidth = "200px";
    img.style.maxHeight = "100px";
    img.style.zIndex = "10";
    img.style.pointerEvents = "none";

    annotationLayerRef.current.appendChild(img);
    setAnnotationDomElements((prev) => [...prev, img]);

    const annotation: AnnotationData = {
      type: "signature",
      pageNumber,
      x: signaturePosition.x,
      y: signaturePosition.y,
      imageDataUrl: signatureDataUrl,
    };
    setAnnotationData((prev) => [...prev, annotation]);

    setShowSignatureCanvas(false);
  };

  const handleAddComment = (comment: string) => {
    if (!commentPosition || !annotationLayerRef.current) return;

    const commentEl = document.createElement("div");
    commentEl.className =
      "absolute bg-yellow-100 p-2 rounded shadow-md text-sm max-w-xs z-10";
    commentEl.style.left = `${commentPosition.x}px`;
    commentEl.style.top = `${commentPosition.y}px`;
    commentEl.textContent = comment;

    annotationLayerRef.current.appendChild(commentEl);
    setAnnotationDomElements((prev) => [...prev, commentEl]);

    const annotation: AnnotationData = {
      type: "comment",
      pageNumber,
      x: commentPosition.x,
      y: commentPosition.y,
      text: comment,
    };
    setAnnotationData((prev) => [...prev, annotation]);

    setShowCommentDialog(false);
  };

  useEffect(() => {
    annotationDomElements.forEach((el) => {
      el.remove();
    });
    setAnnotationDomElements([]);
  }, [pageNumber]);

  const docOptions = useMemo(() => {
    return {
      cMapUrl: "https://unpkg.com/pdfjs-dist@3.4.120/cmaps/",
      cMapPacked: true,
    };
  }, []);

  return (
    <div className="w-full bg-white border rounded-lg shadow-sm overflow-hidden flex flex-col">
      <div className="flex items-center justify-between p-2 border-b">
        {/* Page navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevPage}
            disabled={pageNumber <= 1}
            className="px-2 py-1 rounded border hover:bg-gray-100 disabled:opacity-50"
          >
            Previous
          </button>
          <span>
            Page {pageNumber} of {numPages ?? "--"}
          </span>
          <button
            onClick={handleNextPage}
            disabled={pageNumber >= (numPages ?? 1)}
            className="px-2 py-1 rounded border hover:bg-gray-100 disabled:opacity-50"
          >
            Next
          </button>
        </div>

        {/* Zoom controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleZoomOut}
            className="px-2 py-1 rounded border hover:bg-gray-100"
          >
            -
          </button>
          <span>{Math.round(scale * 100)}%</span>
          <button
            onClick={handleZoomIn}
            className="px-2 py-1 rounded border hover:bg-gray-100"
          >
            +
          </button>
        </div>
      </div>

      {/* PDF Container + Overlays */}
      <div
        ref={containerRef}
        className="relative flex-1 overflow-auto bg-gray-100 min-h-[500px]"
        onClick={handleContainerClick}
        onMouseUp={handleTextSelection}
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        <div className="mx-auto my-4">
          {pdfData ? (
            <Document
              file={pdfData}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={<div className="h-[500px]" />}
              options={docOptions}
            >
              <Page
                pageNumber={pageNumber}
                scale={scale}
                renderTextLayer
                renderAnnotationLayer
                className="shadow-md"
              />
            </Document>
          ) : (
            <div className="h-[500px] flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
        </div>

        {/* The absolute layer for annotation overlays */}
        <div
          ref={annotationLayerRef}
          className="absolute top-0 left-0 w-full h-full pointer-events-none"
        />
      </div>

      {/* Modals for signature + comment */}
      {showSignatureCanvas && (
        <SignatureCanvas
          onSave={handleAddSignature}
          onCancel={() => setShowSignatureCanvas(false)}
        />
      )}
      {showCommentDialog && (
        <CommentDialog
          onSave={handleAddComment}
          onCancel={() => setShowCommentDialog(false)}
        />
      )}
    </div>
  );
}
