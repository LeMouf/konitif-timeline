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

const TIMELINE_TIME_DECIMALS = 2;
export const TIMELINE_PADDING_LEFT_PERCENT = 2;
export const TIMELINE_PADDING_RIGHT_PERCENT = 2;
const TIMELINE_TARGET_MAJOR_TICK_COUNT = 10;
export const TIMELINE_MAX_ZOOM_X = 6;
const TIMELINE_WHEEL_ZOOM_SENSITIVITY = 0.0016;
const TIMELINE_WHEEL_ZOOM_DELTA_LIMIT = 240;
const TIMELINE_PRACTICAL_ZOOM_LEVELS = [
  0.05,
  0.1,
  0.125,
  0.15,
  0.2,
  0.25,
  0.33,
  0.5,
  0.67,
  0.75,
  1,
  1.25,
  1.5,
  1.75,
  2,
  2.5,
  3,
  4,
  5,
  6
] as const;
const TIMELINE_PRACTICAL_ZOOM_SNAP_RATIO = 0.05;
const TIMELINE_PRACTICAL_ZOOM_SNAP_ABSOLUTE = 0.04;

export function resolveTimelineWheelZoomFactor(deltaY: number): number {
  if (!Number.isFinite(deltaY) || deltaY === 0) {
    return 1;
  }

  const limitedDelta = Math.max(-TIMELINE_WHEEL_ZOOM_DELTA_LIMIT, Math.min(TIMELINE_WHEEL_ZOOM_DELTA_LIMIT, deltaY));

  return Math.exp(-limitedDelta * TIMELINE_WHEEL_ZOOM_SENSITIVITY);
}

export function snapTimelineZoomXToPracticalValue(
  zoomX: number,
  input: { minZoomX?: number; maxZoomX?: number; previousZoomX?: number } = {}
): number {
  const maxZoomX = Math.max(0.01, input.maxZoomX ?? TIMELINE_MAX_ZOOM_X);
  const minZoomX = Math.max(0.01, Math.min(maxZoomX, input.minZoomX ?? 0.01));
  const clampedZoomX = Math.max(minZoomX, Math.min(maxZoomX, zoomX));

  const nearestZoomLevel = TIMELINE_PRACTICAL_ZOOM_LEVELS
    .map((value) => Math.max(minZoomX, Math.min(maxZoomX, value)))
    .reduce<{ value: number; distance: number } | null>((nearest, value) => {
      const distance = Math.abs(clampedZoomX - value);

      if (!nearest || distance < nearest.distance) {
        return { value, distance };
      }

      return nearest;
    }, null);

  if (!nearestZoomLevel) {
    return Number(clampedZoomX.toFixed(2));
  }

  const snapThreshold = Math.max(
    TIMELINE_PRACTICAL_ZOOM_SNAP_ABSOLUTE,
    nearestZoomLevel.value * TIMELINE_PRACTICAL_ZOOM_SNAP_RATIO
  );

  if (nearestZoomLevel.distance <= snapThreshold) {
    const previousZoomX =
      typeof input.previousZoomX === 'number' && Number.isFinite(input.previousZoomX)
        ? Math.max(minZoomX, Math.min(maxZoomX, input.previousZoomX))
        : null;

    if (previousZoomX !== null) {
      const previousDistance = Math.abs(previousZoomX - nearestZoomLevel.value);

      if (previousDistance <= nearestZoomLevel.distance) {
        return Number(clampedZoomX.toFixed(2));
      }
    }

    return Number(nearestZoomLevel.value.toFixed(2));
  }

  return Number(clampedZoomX.toFixed(2));
}

export function createTimelineTicks(rangeStart: number, rangeEnd: number, zoomX: number): TimelineTick[] {
  const visibleDuration = Math.max(0, rangeEnd - rangeStart);

  if (visibleDuration <= 0) {
    return [{ time: 0, label: formatTimelineTime(0), major: true, majorIndex: 0 }];
  }

  const majorStep = resolveNiceTimelineStep(
    visibleDuration / Math.max(1, Math.round(TIMELINE_TARGET_MAJOR_TICK_COUNT * Math.max(1, zoomX * 0.75)))
  );
  const minorStep = majorStep / 2;
  const startTime = Math.floor(rangeStart / majorStep) * majorStep;
  const endTime = Math.ceil(rangeEnd / majorStep) * majorStep;
  const ticks: TimelineTick[] = [];
  const tickIds = new Set<string>();

  for (let time = startTime; time <= endTime + majorStep * 0.5; time += majorStep) {
    const normalizedMajorTime = normalizeTimelineStepTime(time);

    if (normalizedMajorTime < rangeStart - majorStep || normalizedMajorTime > rangeEnd + majorStep) {
      continue;
    }

    const majorId = `major:${normalizedMajorTime}`;

    if (!tickIds.has(majorId)) {
      tickIds.add(majorId);
      ticks.push({
        time: normalizedMajorTime,
        label: formatTimelineTime(normalizedMajorTime),
        major: true,
        majorIndex: resolveTimelineMajorTickIndex(normalizedMajorTime, majorStep)
      });
    }

    const minorTime = normalizeTimelineStepTime(normalizedMajorTime + minorStep);

    if (minorTime >= rangeStart && minorTime <= rangeEnd) {
      const minorId = `minor:${minorTime}`;

      if (!tickIds.has(minorId)) {
        tickIds.add(minorId);
        ticks.push({
          time: minorTime,
          label: '',
          major: false
        });
      }
    }
  }

  return ticks.sort((left, right) => left.time - right.time);
}

export function formatTimelineTime(time: number): string {
  const rounded = Number(time.toFixed(TIMELINE_TIME_DECIMALS));
  const normalized = Object.is(rounded, -0) || Math.abs(rounded) < 10 ** -TIMELINE_TIME_DECIMALS ? 0 : rounded;
  return normalized.toFixed(TIMELINE_TIME_DECIMALS);
}

export function formatTimelineClock(time: number): string {
  const totalSeconds = Math.max(0, Math.round(time));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export function formatTimelineClockAdaptive(time: number, secondsPerMajorTick: number): string {
  const clampedTime = Math.max(0, time);
  const safeSecondsPerMajorTick =
    Number.isFinite(secondsPerMajorTick) && secondsPerMajorTick > 0 ? secondsPerMajorTick : 1;
  const fractionalDigits =
    safeSecondsPerMajorTick >= 10 ? 0 : safeSecondsPerMajorTick >= 1 ? 1 : safeSecondsPerMajorTick >= 0.1 ? 2 : 3;
  const totalSeconds = Number(clampedTime.toFixed(fractionalDigits));
  const wholeSeconds = Math.floor(totalSeconds);
  const hours = Math.floor(wholeSeconds / 3600);
  const minutes = Math.floor((wholeSeconds % 3600) / 60);
  const seconds = wholeSeconds % 60;

  if (fractionalDigits === 0 || Number.isInteger(totalSeconds)) {
    return formatTimelineClock(totalSeconds);
  }

  const fractionalScale = 10 ** fractionalDigits;
  const fractionalValue = Math.round((totalSeconds - wholeSeconds) * fractionalScale);
  const normalizedFractionalValue = fractionalValue >= fractionalScale ? 0 : fractionalValue;
  const fractionalLabel = String(normalizedFractionalValue)
    .padStart(fractionalDigits, '0')
    .replace(/0+$/, '');

  if (fractionalLabel.length === 0) {
    return formatTimelineClock(totalSeconds);
  }

  const secondLabel = `${String(seconds).padStart(2, '0')}.${fractionalLabel}`;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${secondLabel}`;
  }

  return `${minutes}:${secondLabel}`;
}

export function resolveNiceTimelineStep(rawStep: number): number {
  const safeStep = Math.max(rawStep, 0.0001);
  const exponent = Math.floor(Math.log10(safeStep));
  const base = 10 ** exponent;
  const normalized = safeStep / base;
  const multipliers = [1, 2, 5, 10];
  const multiplier = multipliers.find((candidate) => normalized <= candidate) ?? 10;
  return multiplier * base;
}

function resolveTimelineMajorTickIndex(time: number, majorStep: number): number {
  if (!Number.isFinite(time) || !Number.isFinite(majorStep) || majorStep <= 0) {
    return 0;
  }

  return Math.round(normalizeTimelineStepTime(time / majorStep));
}

export function normalizeTimelineStepTime(value: number): number {
  const rounded = Number(value.toFixed(6));
  return Object.is(rounded, -0) || Math.abs(rounded) < 0.000001 ? 0 : rounded;
}

export function getTimelinePositionPercent(time: number | null, visibleRange: TimelineVisibleRange): number {
  if (time === null || visibleRange.span <= 0) {
    return TIMELINE_PADDING_LEFT_PERCENT;
  }

  const ratio = (time - visibleRange.start) / visibleRange.span;
  const clampedRatio = Math.max(0, Math.min(1, ratio));
  const usableWidth = 100 - TIMELINE_PADDING_LEFT_PERCENT - TIMELINE_PADDING_RIGHT_PERCENT;

  return TIMELINE_PADDING_LEFT_PERCENT + clampedRatio * usableWidth;
}

export function getTimelinePositionPercentUnclamped(time: number | null, visibleRange: TimelineVisibleRange): number {
  if (time === null || visibleRange.span <= 0) {
    return TIMELINE_PADDING_LEFT_PERCENT;
  }

  const ratio = (time - visibleRange.start) / visibleRange.span;
  const usableWidth = 100 - TIMELINE_PADDING_LEFT_PERCENT - TIMELINE_PADDING_RIGHT_PERCENT;

  return TIMELINE_PADDING_LEFT_PERCENT + ratio * usableWidth;
}

export function getTimelineNormalizedRatio(clientRatio: number): number {
  const startRatio = TIMELINE_PADDING_LEFT_PERCENT / 100;
  const endRatio = 1 - TIMELINE_PADDING_RIGHT_PERCENT / 100;
  const usableSpan = Math.max(endRatio - startRatio, 0.0001);
  const normalizedRatio = (clientRatio - startRatio) / usableSpan;

  return Math.max(0, Math.min(1, normalizedRatio));
}

export function getTimelineNormalizedRatioUnclamped(clientRatio: number): number {
  const startRatio = TIMELINE_PADDING_LEFT_PERCENT / 100;
  const endRatio = 1 - TIMELINE_PADDING_RIGHT_PERCENT / 100;
  const usableSpan = Math.max(endRatio - startRatio, 0.0001);

  return (clientRatio - startRatio) / usableSpan;
}

export function getTimelineGridMetrics(input: {
  ticks: TimelineTick[];
  visibleRange: TimelineVisibleRange;
  fps: number;
}): TimelineGridMetrics {
  const { ticks, visibleRange, fps } = input;
  const majorTicks = ticks.filter((tick) => tick.major);
  const baseTimeStep =
    majorTicks.length >= 2
      ? Math.max(majorTicks[1].time - majorTicks[0].time, 0.0001)
      : Math.max(visibleRange.span, 0.0001);
  const fineTimeStep = baseTimeStep / 2;
  const majorTimeStep = resolvePromotedTimelineStep(baseTimeStep);
  const frameCadenceFrames = resolveFrameCadenceFrames(visibleRange.span, fps);
  const frameStepTime = frameCadenceFrames / Math.max(fps, 0.0001);

  return {
    leftInset: `${TIMELINE_PADDING_LEFT_PERCENT}%`,
    rightInset: `${TIMELINE_PADDING_RIGHT_PERCENT}%`,
    leftInsetPercent: TIMELINE_PADDING_LEFT_PERCENT,
    rightInsetPercent: TIMELINE_PADDING_RIGHT_PERCENT,
    verticalLayers: [
      buildTimelineGridPatternLayer({
        cadenceStep: frameStepTime,
        visibleRange,
        tone: 'frame'
      }),
      buildTimelineGridPatternLayer({
        cadenceStep: baseTimeStep,
        offsetWithinCadence: fineTimeStep,
        visibleRange,
        tone: 'time-fine',
        maxLineCount: 36
      }),
      buildTimelineGridPatternLayer({
        cadenceStep: baseTimeStep,
        visibleRange,
        tone: 'time-base',
        maxLineCount: 18
      }),
      buildTimelineGridPatternLayer({
        cadenceStep: majorTimeStep,
        visibleRange,
        tone: 'time-major',
        maxLineCount: 12
      })
    ].filter((layer): layer is TimelineGridPatternLayer => layer !== null)
  };
}

function buildTimelineGridPatternLayer(input: {
  cadenceStep: number;
  offsetWithinCadence?: number;
  visibleRange: TimelineVisibleRange;
  tone: TimelineVerticalGridTone;
  maxLineCount?: number;
}): TimelineGridPatternLayer | null {
  const { cadenceStep, offsetWithinCadence = 0, visibleRange, tone, maxLineCount = 180 } = input;

  if (!Number.isFinite(cadenceStep) || cadenceStep <= 0 || visibleRange.span <= 0) {
    return null;
  }

  const estimatedLineCount = Math.ceil(visibleRange.span / cadenceStep) + 2;

  if (estimatedLineCount > maxLineCount) {
    return null;
  }

  const firstVisibleTime = resolveFirstVisiblePatternTime({
    cadenceStep,
    offsetWithinCadence,
    rangeStart: visibleRange.start
  });

  if (firstVisibleTime > visibleRange.end) {
    return null;
  }

  const usableWidthPercent = 100 - TIMELINE_PADDING_LEFT_PERCENT - TIMELINE_PADDING_RIGHT_PERCENT;

  return {
    id: `${tone}:${normalizeTimelineStepTime(cadenceStep)}:${normalizeTimelineStepTime(offsetWithinCadence)}`,
    stepPercent: (cadenceStep / visibleRange.span) * usableWidthPercent,
    offsetPercent: getTimelinePositionPercent(firstVisibleTime, visibleRange),
    tone
  };
}

function resolveFirstVisiblePatternTime(input: {
  cadenceStep: number;
  offsetWithinCadence?: number;
  rangeStart: number;
}): number {
  const { cadenceStep, offsetWithinCadence = 0, rangeStart } = input;

  const normalizedOffset = normalizeTimelineStepTime(offsetWithinCadence);
  const firstCycleIndex = Math.floor((rangeStart - normalizedOffset) / cadenceStep);
  let firstVisibleTime = normalizeTimelineStepTime(firstCycleIndex * cadenceStep + normalizedOffset);

  while (firstVisibleTime < rangeStart) {
    firstVisibleTime = normalizeTimelineStepTime(firstVisibleTime + cadenceStep);
  }

  return firstVisibleTime;
}

function resolvePromotedTimelineStep(baseStep: number): number {
  return resolveNiceTimelineStep(baseStep * 4);
}

function resolveFrameCadenceFrames(visibleDuration: number, fps: number): number {
  const visibleFrameCount = Math.max(visibleDuration * Math.max(fps, 1), 1);
  const targetFrameLines = 160;
  return resolveNiceDiscreteStep(visibleFrameCount / targetFrameLines);
}

function resolveNiceDiscreteStep(rawStep: number): number {
  const safeStep = Math.max(rawStep, 1);
  const exponent = Math.floor(Math.log10(safeStep));
  const base = 10 ** exponent;
  const normalized = safeStep / base;
  const multipliers = [1, 2, 5, 10];
  const multiplier = multipliers.find((candidate) => normalized <= candidate) ?? 10;
  return Math.max(1, Math.round(multiplier * base));
}
