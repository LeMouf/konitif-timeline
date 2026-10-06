import type {
  TimelineKeyProjection,
  TimelineProjection,
  TimelineProjectionDefinition,
  TimelineTrackProjection,
  TimelineTrackProjectionContribution
} from './contracts.js';

export function defineTimelineTrackProjectionContribution<
  TSubject,
  TTrack extends TimelineTrackProjection = TimelineTrackProjection
>(
  contribution: TimelineTrackProjectionContribution<TSubject, TTrack>
): TimelineTrackProjectionContribution<TSubject, TTrack> {
  assertIdentifier(contribution.id, 'Timeline track contribution');
  assertIdentifier(contribution.version, 'Timeline track contribution version');

  if (typeof contribution.project !== 'function') {
    throw new TypeError(`Timeline track contribution "${contribution.id}" must provide a project function.`);
  }

  return contribution;
}

export function projectTimelineSubject<
  TSubject,
  TTrack extends TimelineTrackProjection = TimelineTrackProjection
>(
  subject: TSubject,
  definition: TimelineProjectionDefinition<TSubject, TTrack>
): TimelineProjection<TTrack> {
  const sourceId = definition.getSourceId(subject);
  assertIdentifier(sourceId, 'Timeline source');
  assertUniqueContributionIds(definition.trackContributions);

  const trackIds = new Set<string>();
  const tracks = definition.trackContributions.flatMap((contribution) =>
    contribution.project(subject).map((track) => {
      assertIdentifier(track.id, `Timeline track from contribution "${contribution.id}"`);

      if (trackIds.has(track.id)) {
        throw new Error(`Duplicate Timeline track id: ${track.id}`);
      }

      trackIds.add(track.id);
      return normalizeTrackProjection(track);
    })
  );

  return {
    sourceId,
    durationSeconds: normalizeDuration(definition.getDurationSeconds(subject)),
    tracks
  };
}

function normalizeTrackProjection<TTrack extends TimelineTrackProjection>(track: TTrack): TTrack {
  return {
    ...track,
    kind: normalizeText(track.kind, 'generic'),
    label: normalizeText(track.label, track.id),
    keys: [...track.keys]
      .map((key) => normalizeKeyProjection(key))
      .sort((left, right) => left.timeSeconds - right.timeSeconds)
  };
}

function normalizeKeyProjection<TKey extends TimelineKeyProjection>(key: TKey): TKey {
  assertIdentifier(key.id, 'Timeline key');

  return {
    ...key,
    timeSeconds: normalizeDuration(key.timeSeconds)
  };
}

function assertUniqueContributionIds(
  contributions: readonly TimelineTrackProjectionContribution<unknown>[]
): void {
  const ids = new Set<string>();

  for (const contribution of contributions) {
    assertIdentifier(contribution.id, 'Timeline track contribution');

    if (ids.has(contribution.id)) {
      throw new Error(`Duplicate Timeline track contribution id: ${contribution.id}`);
    }

    ids.add(contribution.id);
  }
}

function assertIdentifier(value: string, subject: string): void {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new TypeError(`${subject} id must be a non-empty string.`);
  }
}

function normalizeDuration(value: number | null | undefined): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, value) : 0;
}

function normalizeText(value: string, fallback: string): string {
  const normalized = typeof value === 'string' ? value.trim() : '';
  return normalized.length > 0 ? normalized : fallback;
}
