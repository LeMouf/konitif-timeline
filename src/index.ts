import {
  evaluateInterpolation,
  resolveClipDuration,
  type KonitifClip,
  type KonitifKey,
  type KonitifSegmentInterpolation,
  type KonitifTrack
} from '@konitif/core';
import { defineKonitifToolModule } from '@konitif/tools';

export interface TimelineTrackProjection {
  id: string;
  source: KonitifTrack;
  keys: readonly KonitifKey[];
}

export interface TimelineProjection {
  sourceId: string;
  durationSeconds: number;
  tracks: readonly TimelineTrackProjection[];
}

export interface TimelineState {
  cursorSeconds: number;
  visibleStartSeconds: number;
  visibleEndSeconds: number;
  selectedTrackId: string | null;
  selectedKeyIndex: number | null;
}

export type TimelineIntent =
  | { type: 'seek'; timeSeconds: number }
  | { type: 'set-visible-range'; startSeconds: number; endSeconds: number }
  | { type: 'select-track'; trackId: string | null }
  | { type: 'select-key'; trackId: string; keyIndex: number };

export function projectClipToTimeline(clip: KonitifClip): TimelineProjection {
  const durationSeconds = resolveClipDuration(clip) ?? 0;

  return {
    sourceId: clip.id,
    durationSeconds,
    tracks: clip.tracks.map((track, index) => ({
      id: track.target ?? `track-${index}`,
      source: track,
      keys: [...track.keys].sort((left, right) => left.frame - right.frame)
    }))
  };
}

export function createTimelineState(
  projection: TimelineProjection,
  input: Partial<TimelineState> = {}
): TimelineState {
  const visibleStartSeconds = clamp(finite(input.visibleStartSeconds), 0, projection.durationSeconds);
  const visibleEndSeconds = clamp(
    finite(input.visibleEndSeconds, projection.durationSeconds),
    visibleStartSeconds,
    projection.durationSeconds
  );

  return {
    cursorSeconds: clamp(finite(input.cursorSeconds), 0, projection.durationSeconds),
    visibleStartSeconds,
    visibleEndSeconds,
    selectedTrackId: input.selectedTrackId ?? null,
    selectedKeyIndex: input.selectedKeyIndex ?? null
  };
}

export function reduceTimelineState(
  projection: TimelineProjection,
  state: TimelineState,
  intent: TimelineIntent
): TimelineState {
  switch (intent.type) {
    case 'seek':
      return { ...state, cursorSeconds: clamp(finite(intent.timeSeconds), 0, projection.durationSeconds) };
    case 'set-visible-range': {
      const visibleStartSeconds = clamp(finite(intent.startSeconds), 0, projection.durationSeconds);
      return {
        ...state,
        visibleStartSeconds,
        visibleEndSeconds: clamp(finite(intent.endSeconds), visibleStartSeconds, projection.durationSeconds)
      };
    }
    case 'select-track':
      return { ...state, selectedTrackId: intent.trackId, selectedKeyIndex: null };
    case 'select-key': {
      const track = projection.tracks.find((candidate) => candidate.id === intent.trackId);
      const selectedKeyIndex = track && intent.keyIndex >= 0 && intent.keyIndex < track.keys.length
        ? Math.floor(intent.keyIndex)
        : null;
      return { ...state, selectedTrackId: selectedKeyIndex === null ? null : intent.trackId, selectedKeyIndex };
    }
  }
}

export function sampleTimelineTrack(
  track: TimelineTrackProjection,
  timeSeconds: number,
  interpolation: KonitifSegmentInterpolation = 'linear'
): number | null {
  const numericKeys = track.keys.filter(
    (key): key is KonitifKey & { value: number } => typeof key.value === 'number' && Number.isFinite(key.value)
  );

  if (numericKeys.length === 0) return null;
  if (numericKeys.length === 1) return numericKeys[0].value;

  const time = Math.max(0, finite(timeSeconds));
  const nextIndex = numericKeys.findIndex((key) => (key.time ?? Number.POSITIVE_INFINITY) >= time);
  if (nextIndex <= 0) return numericKeys[0].value;
  if (nextIndex === -1) return numericKeys[numericKeys.length - 1].value;

  const previous = numericKeys[nextIndex - 1];
  const next = numericKeys[nextIndex];
  const previousTime = previous.time ?? previous.frame;
  const nextTime = next.time ?? next.frame;
  const progress = nextTime <= previousTime ? 1 : (time - previousTime) / (nextTime - previousTime);
  const alpha = evaluateInterpolation(interpolation, progress);
  return previous.value + (next.value - previous.value) * alpha;
}

export const timelineToolModule = defineKonitifToolModule({
  id: 'konitif.timeline',
  name: 'KONITIF Timeline',
  capability: 'temporal-projection',
  description: 'Product-neutral projection and manipulation of tracks and keys over time.'
});

function finite(value: number | undefined, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
