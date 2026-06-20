import { ErrorHandler, Injectable } from '@angular/core';

const CHUNK_RELOAD_TIMESTAMP_KEY = 'vendor_chunk_reload_timestamp';
const CHUNK_RELOAD_COOLDOWN_MS = 60_000;

export function isChunkLoadError(error: unknown): boolean {
  const message = extractErrorMessage(error);

  return /failed to fetch dynamically imported module/i.test(message)
    || /error loading dynamically imported module/i.test(message)
    || /loading chunk [\w-]+ failed/i.test(message)
    || /chunkloaderror/i.test(message);
}

function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return `${error.name}: ${error.message}`;
  }

  if (typeof error === 'object' && error !== null && 'rejection' in error) {
    return extractErrorMessage((error as { rejection: unknown }).rejection);
  }

  return String(error);
}

@Injectable()
export class ChunkLoadErrorHandler extends ErrorHandler {
  override handleError(error: unknown): void {
    if (isChunkLoadError(error) && this.canReload()) {
      sessionStorage.setItem(CHUNK_RELOAD_TIMESTAMP_KEY, String(Date.now()));
      window.location.reload();
      return;
    }

    super.handleError(error);
  }

  private canReload(): boolean {
    const lastReload = Number(sessionStorage.getItem(CHUNK_RELOAD_TIMESTAMP_KEY) ?? 0);
    return !Number.isFinite(lastReload) || Date.now() - lastReload > CHUNK_RELOAD_COOLDOWN_MS;
  }
}
