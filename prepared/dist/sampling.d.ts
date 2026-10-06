import type { TimelineTrackProjection } from './contracts.js';
export type TimelineInterpolation = (progress: number) => number;
export declare const linearTimelineInterpolation: TimelineInterpolation;
export declare function sampleTimelineTrack(track: Pick<TimelineTrackProjection, 'keys'>, timeSeconds: number, interpolate?: TimelineInterpolation): number | null;
//# sourceMappingURL=sampling.d.ts.map