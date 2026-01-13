import { shouldCompress, VideoMetadata, CompressionThresholds } from '../compressionDecider';

describe('CompressionDecider - shouldCompress', () => {
  const defaultThresholds: CompressionThresholds = {
    maxFileSizeMB: 60,
    maxHeight: 720,
    maxFps: 10,
  };

  const MB = 1024 * 1024;

  describe('when all metrics are within thresholds', () => {
    it('should NOT compress a small 480p file at 8fps', () => {
      const metadata: VideoMetadata = {
        fileSizeBytes: 30 * MB,
        width: 854,
        height: 480,
        fps: 8,
      };

      const result = shouldCompress(metadata, defaultThresholds);

      expect(result.shouldCompress).toBe(false);
      expect(result.reasons).toHaveLength(0);
    });

    it('should NOT compress exactly at thresholds (60MB, 720p, 10fps)', () => {
      const metadata: VideoMetadata = {
        fileSizeBytes: 60 * MB,
        width: 1280,
        height: 720,
        fps: 10,
      };

      const result = shouldCompress(metadata, defaultThresholds);

      expect(result.shouldCompress).toBe(false);
      expect(result.reasons).toHaveLength(0);
    });

    it('should NOT compress a portrait video where width is smaller than height', () => {
      const metadata: VideoMetadata = {
        fileSizeBytes: 40 * MB,
        width: 480,
        height: 854,
        fps: 10,
      };

      const result = shouldCompress(metadata, defaultThresholds);

      expect(result.shouldCompress).toBe(false);
      expect(result.reasons).toHaveLength(0);
    });
  });

  describe('when file size exceeds threshold', () => {
    it('should compress when file size is above 60MB', () => {
      const metadata: VideoMetadata = {
        fileSizeBytes: 61 * MB,
        width: 854,
        height: 480,
        fps: 8,
      };

      const result = shouldCompress(metadata, defaultThresholds);

      expect(result.shouldCompress).toBe(true);
      expect(result.reasons).toHaveLength(1);
      expect(result.reasons[0]).toContain('File size');
      expect(result.reasons[0]).toContain('60MB');
    });

    it('should compress a large file even if resolution and fps are low', () => {
      const metadata: VideoMetadata = {
        fileSizeBytes: 500 * MB,
        width: 640,
        height: 360,
        fps: 5,
      };

      const result = shouldCompress(metadata, defaultThresholds);

      expect(result.shouldCompress).toBe(true);
      expect(result.reasons.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('when resolution exceeds threshold', () => {
    it('should compress 1080p video', () => {
      const metadata: VideoMetadata = {
        fileSizeBytes: 30 * MB,
        width: 1920,
        height: 1080,
        fps: 8,
      };

      const result = shouldCompress(metadata, defaultThresholds);

      expect(result.shouldCompress).toBe(true);
      expect(result.reasons).toHaveLength(1);
      expect(result.reasons[0]).toContain('Resolution');
      expect(result.reasons[0]).toContain('720p');
    });

    it('should compress 4K video', () => {
      const metadata: VideoMetadata = {
        fileSizeBytes: 50 * MB,
        width: 3840,
        height: 2160,
        fps: 10,
      };

      const result = shouldCompress(metadata, defaultThresholds);

      expect(result.shouldCompress).toBe(true);
      expect(result.reasons[0]).toContain('Resolution');
    });

    it('should compress portrait 1080p video (1080x1920)', () => {
      const metadata: VideoMetadata = {
        fileSizeBytes: 30 * MB,
        width: 1080,
        height: 1920,
        fps: 8,
      };

      const result = shouldCompress(metadata, defaultThresholds);

      expect(result.shouldCompress).toBe(true);
      expect(result.reasons[0]).toContain('Resolution');
    });
  });

  describe('when fps exceeds threshold', () => {
    it('should compress 24fps video', () => {
      const metadata: VideoMetadata = {
        fileSizeBytes: 30 * MB,
        width: 854,
        height: 480,
        fps: 24,
      };

      const result = shouldCompress(metadata, defaultThresholds);

      expect(result.shouldCompress).toBe(true);
      expect(result.reasons).toHaveLength(1);
      expect(result.reasons[0]).toContain('Frame rate');
      expect(result.reasons[0]).toContain('10fps');
    });

    it('should compress 60fps video', () => {
      const metadata: VideoMetadata = {
        fileSizeBytes: 30 * MB,
        width: 640,
        height: 480,
        fps: 60,
      };

      const result = shouldCompress(metadata, defaultThresholds);

      expect(result.shouldCompress).toBe(true);
      expect(result.reasons[0]).toContain('Frame rate');
    });

    it('should compress video at 10.01fps (just over threshold)', () => {
      const metadata: VideoMetadata = {
        fileSizeBytes: 30 * MB,
        width: 640,
        height: 480,
        fps: 10.01,
      };

      const result = shouldCompress(metadata, defaultThresholds);

      expect(result.shouldCompress).toBe(true);
    });
  });

  describe('when multiple thresholds are exceeded', () => {
    it('should list all reasons when file size, resolution, and fps exceed thresholds', () => {
      const metadata: VideoMetadata = {
        fileSizeBytes: 200 * MB,
        width: 1920,
        height: 1080,
        fps: 30,
      };

      const result = shouldCompress(metadata, defaultThresholds);

      expect(result.shouldCompress).toBe(true);
      expect(result.reasons).toHaveLength(3);
      expect(result.reasons.some(r => r.includes('File size'))).toBe(true);
      expect(result.reasons.some(r => r.includes('Resolution'))).toBe(true);
      expect(result.reasons.some(r => r.includes('Frame rate'))).toBe(true);
    });

    it('should list two reasons when file size and fps exceed thresholds', () => {
      const metadata: VideoMetadata = {
        fileSizeBytes: 100 * MB,
        width: 854,
        height: 480,
        fps: 30,
      };

      const result = shouldCompress(metadata, defaultThresholds);

      expect(result.shouldCompress).toBe(true);
      expect(result.reasons).toHaveLength(2);
    });
  });

  describe('with custom thresholds', () => {
    it('should use custom thresholds when provided', () => {
      const customThresholds: CompressionThresholds = {
        maxFileSizeMB: 100,
        maxHeight: 1080,
        maxFps: 30,
      };

      const metadata: VideoMetadata = {
        fileSizeBytes: 80 * MB,
        width: 1920,
        height: 1080,
        fps: 24,
      };

      const result = shouldCompress(metadata, customThresholds);

      expect(result.shouldCompress).toBe(false);
      expect(result.reasons).toHaveLength(0);
    });

    it('should compress when exceeding custom thresholds', () => {
      const customThresholds: CompressionThresholds = {
        maxFileSizeMB: 20,
        maxHeight: 480,
        maxFps: 15,
      };

      const metadata: VideoMetadata = {
        fileSizeBytes: 30 * MB,
        width: 854,
        height: 480,
        fps: 10,
      };

      const result = shouldCompress(metadata, customThresholds);

      expect(result.shouldCompress).toBe(true);
      expect(result.reasons).toHaveLength(1);
      expect(result.reasons[0]).toContain('20MB');
    });
  });

  describe('edge cases', () => {
    it('should handle 0 fps gracefully', () => {
      const metadata: VideoMetadata = {
        fileSizeBytes: 30 * MB,
        width: 640,
        height: 480,
        fps: 0,
      };

      const result = shouldCompress(metadata, defaultThresholds);

      expect(result.shouldCompress).toBe(false);
    });

    it('should handle 0 file size gracefully', () => {
      const metadata: VideoMetadata = {
        fileSizeBytes: 0,
        width: 640,
        height: 480,
        fps: 8,
      };

      const result = shouldCompress(metadata, defaultThresholds);

      expect(result.shouldCompress).toBe(false);
    });

    it('should handle square video (1:1 aspect ratio)', () => {
      const metadata: VideoMetadata = {
        fileSizeBytes: 30 * MB,
        width: 720,
        height: 720,
        fps: 8,
      };

      const result = shouldCompress(metadata, defaultThresholds);

      expect(result.shouldCompress).toBe(false);
    });

    it('should compress square video if resolution is 1080x1080', () => {
      const metadata: VideoMetadata = {
        fileSizeBytes: 30 * MB,
        width: 1080,
        height: 1080,
        fps: 8,
      };

      const result = shouldCompress(metadata, defaultThresholds);

      expect(result.shouldCompress).toBe(true);
    });
  });
});
