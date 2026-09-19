/**
 * @interface UploadedFile 업로드 된 파일
 */
export interface UploadedFile {
  fileId: string;
  fileSize: number;
  fileName?: string;
  downloadUrl: string;
}
