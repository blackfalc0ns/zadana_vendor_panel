import { isChunkLoadError } from './chunk-load-error-handler';

describe('isChunkLoadError', () => {
  it('detects failed dynamic imports', () => {
    expect(isChunkLoadError(
      new TypeError('Failed to fetch dynamically imported module: https://example.com/chunk-OLD.js')
    )).toBeTrue();
  });

  it('detects wrapped router rejections', () => {
    expect(isChunkLoadError({
      rejection: new Error('Loading chunk dashboard failed')
    })).toBeTrue();
  });

  it('ignores unrelated application errors', () => {
    expect(isChunkLoadError(new Error('Invalid order state'))).toBeFalse();
  });
});
