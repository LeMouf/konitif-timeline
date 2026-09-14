import {
  createTimelineState,
  defineTimelineTrackProjectionContribution,
  projectTimelineSubject,
  reduceTimelineState,
  type TimelineProjection,
  type TimelineState,
} from '@konitif/timeline';

const metrics = defineTimelineTrackProjectionContribution<{
  id: string;
  durationSeconds: number;
}>({
  id: 'consumer.metrics',
  version: '1.0.0',
  project: () => [],
});
const projection: TimelineProjection = projectTimelineSubject({ id: 'subject', durationSeconds: 2 }, {
  getSourceId: subject => subject.id,
  getDurationSeconds: subject => subject.durationSeconds,
  trackContributions: [metrics],
});
const initial: TimelineState = createTimelineState(projection);
const next: TimelineState = reduceTimelineState(projection, initial, {
  type: 'seek',
  timeSeconds: 1,
});
void next;
