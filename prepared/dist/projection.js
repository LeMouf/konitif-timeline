export function defineTimelineTrackProjectionContribution(contribution) {
    assertIdentifier(contribution.id, 'Timeline track contribution');
    assertIdentifier(contribution.version, 'Timeline track contribution version');
    if (typeof contribution.project !== 'function') {
        throw new TypeError(`Timeline track contribution "${contribution.id}" must provide a project function.`);
    }
    return contribution;
}
export function projectTimelineSubject(subject, definition) {
    const sourceId = definition.getSourceId(subject);
    assertIdentifier(sourceId, 'Timeline source');
    assertUniqueContributionIds(definition.trackContributions);
    const trackIds = new Set();
    const tracks = definition.trackContributions.flatMap((contribution) => contribution.project(subject).map((track) => {
        assertIdentifier(track.id, `Timeline track from contribution "${contribution.id}"`);
        if (trackIds.has(track.id)) {
            throw new Error(`Duplicate Timeline track id: ${track.id}`);
        }
        trackIds.add(track.id);
        return normalizeTrackProjection(track);
    }));
    return {
        sourceId,
        durationSeconds: normalizeDuration(definition.getDurationSeconds(subject)),
        tracks
    };
}
function normalizeTrackProjection(track) {
    return {
        ...track,
        kind: normalizeText(track.kind, 'generic'),
        label: normalizeText(track.label, track.id),
        keys: [...track.keys]
            .map((key) => normalizeKeyProjection(key))
            .sort((left, right) => left.timeSeconds - right.timeSeconds)
    };
}
function normalizeKeyProjection(key) {
    assertIdentifier(key.id, 'Timeline key');
    return {
        ...key,
        timeSeconds: normalizeDuration(key.timeSeconds)
    };
}
function assertUniqueContributionIds(contributions) {
    const ids = new Set();
    for (const contribution of contributions) {
        assertIdentifier(contribution.id, 'Timeline track contribution');
        if (ids.has(contribution.id)) {
            throw new Error(`Duplicate Timeline track contribution id: ${contribution.id}`);
        }
        ids.add(contribution.id);
    }
}
function assertIdentifier(value, subject) {
    if (typeof value !== 'string' || value.trim().length === 0) {
        throw new TypeError(`${subject} id must be a non-empty string.`);
    }
}
function normalizeDuration(value) {
    return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, value) : 0;
}
function normalizeText(value, fallback) {
    const normalized = typeof value === 'string' ? value.trim() : '';
    return normalized.length > 0 ? normalized : fallback;
}
//# sourceMappingURL=projection.js.map