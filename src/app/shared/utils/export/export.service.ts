import { Injectable } from '@angular/core';
import { buildExportFileName, downloadBlob } from './download-blob';

@Injectable({ providedIn: 'root' })
export class ExportService {
  fileName(entity: string, extension: 'xlsx' | 'pdf'): string {
    return buildExportFileName(entity, extension);
  }

  downloadServerFile(blob: Blob, filename: string): void {
    downloadBlob(blob, filename);
  }

  downloadExport(blob: Blob, fallbackName: string): void {
    this.downloadServerFile(blob, fallbackName);
  }
}
