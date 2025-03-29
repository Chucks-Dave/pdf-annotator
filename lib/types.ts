export type AnnotationType =
  | "highlight"
  | "underline"
  | "comment"
  | "signature";

export interface Annotation {
  id: string;
  type: AnnotationType;
  pageNumber: number;
  color?: string;
  content?: string;
  position?: {
    x: number;
    y: number;
  };

  range?: {
    startOffset: number;
    endOffset: number;
    startContainer: string; // Path to DOM node
    endContainer: string;
  };
}
