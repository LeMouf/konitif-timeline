import {
  getTimelineNormalizedRatio,
  resolveTimelineWheelZoomFactor,
  snapTimelineZoomXToPracticalValue,
  TIMELINE_MAX_ZOOM_X,
  TIMELINE_PADDING_LEFT_PERCENT,
  TIMELINE_PADDING_RIGHT_PERCENT
} from './scale.js';

export interface TimelineVisibleRange {
  start: number;
  end: number;
  span: number;
}

export interface TimelineViewWindow {
  start: number;
  end: number;
  span: number;
  zoomX: number;
  viewCenterTime: number | null;
}

export interface TimelineScrubResult {
  currentTime: number;
  viewCenterTime: number | null;
}

export interface NormalizeTimelineViewWindowInput {
  duration: number;
  start: number;
  end: number;
  maxZoomX?: number;
  minZoomX?: number;
}

/**
 * Normalizes projection-local viewport state without taking authority over the
 * temporal subject or its duration.
 */
export function normalizeTimelineViewWindow(
  input: NormalizeTimelineViewWindowInput
): TimelineViewWindow {
  const duration = Math.max(0, input.duration);
  const maxZoomX = Math.max(0.01, input.maxZoomX ?? TIMELINE_MAX_ZOOM_X);
  const minZoomX = Math.max(0.01, Math.min(maxZoomX, input.minZoomX ?? 1));

  if (duration <= 0) {
    return {
      start: 0,
      end: 0,
      span: 0,
      zoomX: minZoomX,
      viewCenterTime: null
    };
  }

  const minSpan = duration / maxZoomX;
  const maxSpan = duration / minZoomX;
  const requestedStart = Number.isFinite(input.start) ? input.start : 0;
  const requestedEnd = Number.isFinite(input.end)
    ? Math.max(input.end, requestedStart)
    : requestedStart;
  const requestedSpan = Math.max(requestedEnd - requestedStart, minSpan);
  const span = Math.max(minSpan, Math.min(maxSpan, requestedSpan));

  if (span > duration) {
    return {
      start: 0,
      end: span,
      span,
      zoomX: Math.max(minZoomX, Math.min(maxZoomX, duration / Math.max(span, minSpan))),
      viewCenterTime: span / 2
    };
  }

  const maxStart = Math.max(0, duration - span);
  const start = Math.max(0, Math.min(requestedStart, maxStart));
  const end = start + span;
  const zoomX = Math.max(
    minZoomX,
    Math.min(maxZoomX, duration / Math.max(end - start, minSpan))
  );

  return {
    start,
    end,
    span: end - start,
    zoomX,
    viewCenterTime: start + (end - start) / 2
  };
}

export function getTimelineWheelZoomWindow(input: {
  duration: number;
  visibleRange: TimelineVisibleRange;
  zoomX: number;
  clientRatio: number;
  deltaY: number;
  maxZoomX?: number;
  minZoomX?: number;
}): TimelineViewWindow {
  const duration = Math.max(0, input.duration);
  const maxZoomX = Math.max(1, input.maxZoomX ?? TIMELINE_MAX_ZOOM_X);
  const minZoomX = Math.max(0.01, Math.min(maxZoomX, input.minZoomX ?? 1));

  if (duration <= 0 || input.visibleRange.span <= 0 || input.deltaY === 0) {
    return normalizeTimelineViewWindow({
      duration,
      start: input.visibleRange.start,
      end: input.visibleRange.end,
      maxZoomX,
      minZoomX
    });
  }

  const normalizedRatio = getTimelineNormalizedRatio(input.clientRatio);
  const pointerTime = Math.max(
    0,
    Math.min(duration, input.visibleRange.start + input.visibleRange.span * normalizedRatio)
  );
  const zoomFactor = resolveTimelineWheelZoomFactor(input.deltaY);
  const requestedZoomX = input.zoomX * zoomFactor;
  const nextZoomX = snapTimelineZoomXToPracticalValue(requestedZoomX, {
    minZoomX,
    maxZoomX,
    previousZoomX: input.zoomX
  });
  const nextSpan = duration / nextZoomX;
  const nextStart = pointerTime - normalizedRatio * nextSpan;

  return normalizeTimelineViewWindow({
    duration,
    start: nextStart,
    end: nextStart + nextSpan,
    maxZoomX,
    minZoomX
  });
}

export function getTimelineScrubResult(input: {
  clientRatio: number;
  visibleRange: TimelineVisibleRange;
  duration: number;
  currentTime: number;
  viewCenterTime: number | null;
}): TimelineScrubResult {
  const { clientRatio, visibleRange, duration, currentTime, viewCenterTime } = input;
  const normalizedRatio = getTimelineNormalizedRatio(clientRatio);
  const baseTime = visibleRange.start + visibleRange.span * normalizedRatio;

  if (duration <= visibleRange.span) {
    return {
      currentTime: Math.max(0, Math.min(duration, baseTime)),
      viewCenterTime
    };
  }

  const startRatio = TIMELINE_PADDING_LEFT_PERCENT / 100;
  const endRatio = 1 - TIMELINE_PADDING_RIGHT_PERCENT / 100;
  const usableSpan = endRatio - startRatio;
  const threshold = usableSpan * 0.08;
  const baseCenter = viewCenterTime ?? currentTime;
  let nextCenter = baseCenter;

  if (clientRatio < startRatio + threshold) {
    const intensity = Math.min(
      1.5,
      (startRatio + threshold - clientRatio) / Math.max(threshold, 0.0001)
    );
    nextCenter -= visibleRange.span * 0.05 * intensity;
  } else if (clientRatio > endRatio - threshold) {
    const intensity = Math.min(
      1.5,
      (clientRatio - (endRatio - threshold)) / Math.max(threshold, 0.0001)
    );
    nextCenter += visibleRange.span * 0.05 * intensity;
  }

  const halfSpan = visibleRange.span / 2;
  const clampedCenter = Math.max(halfSpan, Math.min(duration - halfSpan, nextCenter));
  const nextStart = Math.max(0, Math.min(duration - visibleRange.span, clampedCenter - halfSpan));

  return {
    currentTime: Math.max(0, Math.min(duration, nextStart + visibleRange.span * normalizedRatio)),
    viewCenterTime: clampedCenter
  };
}
