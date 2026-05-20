export interface DocumentResponse {
  id: string;
  fileName: string;
  fileType: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  summary: string | null;
  extractedText: string | null;
  extractedJson: string | null;
  createdAt: string;
}
