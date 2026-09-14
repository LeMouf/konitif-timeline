import type { TimelineTrackProjection } from './contracts.js';

export type TimelineInterpolation = (progress: number) => number;

export const linearTimelineInterpolation: TimelineInterpolation = (progress) => progress;

export function sampleTimelineTrack(
  track: Pick<TimelineTrackProjection, 'keys'>,
  timeSeconds: number,
  interpolate: TimelineInterpolation = linearTimelineInterpolation
): number | null {
  const numericKeys = track.keys.filter(
    (key): key is typeof key & { value: number } =>
      typeof key.value === 'number' && Number.isFinite(key.value)
  );

  if (numericKeys.length === 0) return null;
  if (numericKeys.length === 1) return numericKeys[0].value;

  const time = Math.max(0, finite(timeSeconds));
  const nextIndex = numericKeys.findIndex((key) => key.timeSeconds >= time);
  if (nextIndex <= 0) return numericKeys[0].value;
  if (nextIndex === -1) return numericKeys[numericKeys.length - 1].value;

  const previous = numericKeys[nextIndex - 1];
  const next = numericKeys[nextIndex];
  const progress = next.timeSeconds <= previous.timeSeconds
    ? 1
    : (time - previous.timeSeconds) / (next.timeSeconds - previous.timeSeconds);
  const alpha = finite(interpolate(clamp(progress, 0, 1)), progress);
  return previous.value + (next.value - previous.value) * alpha;
}

function finite(value: number, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
