export const linearTimelineInterpolation = (progress) => progress;
export function sampleTimelineTrack(track, timeSeconds, interpolate = linearTimelineInterpolation) {
    const numericKeys = track.keys.filter((key) => typeof key.value === 'number' && Number.isFinite(key.value));
    if (numericKeys.length === 0)
        return null;
    if (numericKeys.length === 1)
        return numericKeys[0].value;
    const time = Math.max(0, finite(timeSeconds));
    const nextIndex = numericKeys.findIndex((key) => key.timeSeconds >= time);
    if (nextIndex <= 0)
        return numericKeys[0].value;
    if (nextIndex === -1)
        return numericKeys[numericKeys.length - 1].value;
    const previous = numericKeys[nextIndex - 1];
    const next = numericKeys[nextIndex];
    const progress = next.timeSeconds <= previous.timeSeconds
        ? 1
        : (time - previous.timeSeconds) / (next.timeSeconds - previous.timeSeconds);
    const alpha = finite(interpolate(clamp(progress, 0, 1)), progress);
    return previous.value + (next.value - previous.value) * alpha;
}
function finite(value, fallback = 0) {
    return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}
function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}
//# sourceMappingURL=sampling.js.map