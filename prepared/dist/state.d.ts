import type { TimelineIntent, TimelineProjection, TimelineState } from './contracts.js';
export declare function createTimelineState(projection: TimelineProjection, input?: Partial<TimelineState>): TimelineState;
export declare function reduceTimelineState(projection: TimelineProjection, state: TimelineState, intent: TimelineIntent): TimelineState;
//# sourceMappingURL=state.d.ts.map