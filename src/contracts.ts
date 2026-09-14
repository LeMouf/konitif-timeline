export type TimelineSourceId = string;
export type TimelineTrackId = string;
export type TimelineKeyId = string;

export interface TimelineKeyProjection<TValue = unknown, TSource = unknown> {
  id: TimelineKeyId;
  timeSeconds: number;
  value: TValue;
  source?: TSource;
}

export interface TimelineTrackProjection<
  TValue = unknown,
  TSource = unknown,
  TKeySource = unknown
> {
  id: TimelineTrackId;
  kind: string;
  label: string;
  source?: TSource;
  keys: readonly TimelineKeyProjection<TValue, TKeySource>[];
  metadata?: Readonly<Record<string, unknown>>;
}

export interface TimelineProjection<
  TTrack extends TimelineTrackProjection = TimelineTrackProjection
> {
  sourceId: TimelineSourceId;
  durationSeconds: number;
  tracks: readonly TTrack[];
}

export interface TimelineTrackProjectionContribution<
  TSubject,
  TTrack extends TimelineTrackProjection = TimelineTrackProjection
> {
  id: string;
  version: string;
  project(subject: TSubject): readonly TTrack[];
}

export interface TimelineProjectionDefinition<
  TSubject,
  TTrack extends TimelineTrackProjection = TimelineTrackProjection
> {
  getSourceId(subject: TSubject): TimelineSourceId;
  getDurationSeconds(subject: TSubject): number | null | undefined;
  trackContributions: readonly TimelineTrackProjectionContribution<TSubject, TTrack>[];
}

export interface TimelineState {
  cursorSeconds: number;
  visibleStartSeconds: number;
  visibleEndSeconds: number;
  selectedTrackId: TimelineTrackId | null;
  selectedKeyIndex: number | null;
}

export type TimelineIntent =
  | { type: 'seek'; timeSeconds: number }
  | { type: 'set-visible-range'; startSeconds: number; endSeconds: number }
  | { type: 'select-track'; trackId: TimelineTrackId | null }
  | { type: 'select-key'; trackId: TimelineTrackId; keyIndex: number };
