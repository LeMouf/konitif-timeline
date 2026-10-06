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
export declare function normalizeTimelineViewWindow(input: NormalizeTimelineViewWindowInput): TimelineViewWindow;
export declare function getTimelineWheelZoomWindow(input: {
    duration: number;
    visibleRange: TimelineVisibleRange;
    zoomX: number;
    clientRatio: number;
    deltaY: number;
    maxZoomX?: number;
    minZoomX?: number;
}): TimelineViewWindow;
export declare function getTimelineScrubResult(input: {
    clientRatio: number;
    visibleRange: TimelineVisibleRange;
    duration: number;
    currentTime: number;
    viewCenterTime: number | null;
}): TimelineScrubResult;
//# sourceMappingURL=viewWindow.d.ts.map