import type { TimelineVisibleRange } from './viewWindow.js';
export interface TimelineTick {
    time: number;
    label: string;
    major: boolean;
    majorIndex?: number;
}
export interface TimelineGridMetrics {
    leftInset: string;
    rightInset: string;
    leftInsetPercent: number;
    rightInsetPercent: number;
    verticalLayers: TimelineGridPatternLayer[];
}
export type TimelineVerticalGridTone = 'frame' | 'time-fine' | 'time-base' | 'time-major';
export type TimelineHorizontalGridTone = 'curve-fine' | 'curve-major';
export interface TimelineGridPatternLayer {
    id: string;
    stepPercent: number;
    offsetPercent: number;
    tone: TimelineVerticalGridTone | TimelineHorizontalGridTone;
}
export declare const TIMELINE_PADDING_LEFT_PERCENT = 2;
export declare const TIMELINE_PADDING_RIGHT_PERCENT = 2;
export declare const TIMELINE_MAX_ZOOM_X = 6;
export declare function resolveTimelineWheelZoomFactor(deltaY: number): number;
export declare function snapTimelineZoomXToPracticalValue(zoomX: number, input?: {
    minZoomX?: number;
    maxZoomX?: number;
    previousZoomX?: number;
}): number;
export declare function createTimelineTicks(rangeStart: number, rangeEnd: number, zoomX: number): TimelineTick[];
export declare function formatTimelineTime(time: number): string;
export declare function formatTimelineClock(time: number): string;
export declare function formatTimelineClockAdaptive(time: number, secondsPerMajorTick: number): string;
export declare function resolveNiceTimelineStep(rawStep: number): number;
export declare function normalizeTimelineStepTime(value: number): number;
export declare function getTimelinePositionPercent(time: number | null, visibleRange: TimelineVisibleRange): number;
export declare function getTimelinePositionPercentUnclamped(time: number | null, visibleRange: TimelineVisibleRange): number;
export declare function getTimelineNormalizedRatio(clientRatio: number): number;
export declare function getTimelineNormalizedRatioUnclamped(clientRatio: number): number;
export declare function getTimelineGridMetrics(input: {
    ticks: TimelineTick[];
    visibleRange: TimelineVisibleRange;
    fps: number;
}): TimelineGridMetrics;
//# sourceMappingURL=scale.d.ts.map