import { EntityState } from '@reduxjs/toolkit';
import distance from '@turf/distance';
import { Point } from 'geojson';
import isMobile from 'is-mobile';

import { CheckpointLog, Fiche, ForbiddenArea, Tocht, Tracker, Weide } from '../services/types.ts';

export function getLastCheckpointLog(
  team: number,
  checkpointLogs: EntityState<CheckpointLog, number>,
): CheckpointLog | null {
  const filtered = Object.values(checkpointLogs.entities).filter((l) => l.team === team);
  if (filtered.length > 0) {
    return filtered.reduce((prev, curr) =>
      new Date(prev.arrived) > new Date(curr.arrived) ? prev : curr,
    );
  } else {
    return null;
  }
}

export function getPositionDescription(
  tracker: Tracker,
  fiches: EntityState<Fiche, number>,
  tochten: EntityState<Tocht, number>,
  weides: EntityState<Weide, number>,
  forbiddenAreas: EntityState<ForbiddenArea, number>,
): string {
  if (tracker.last_log === null) {
    return '-';
  }
  if (tracker.basis !== null) {
    return 'Basis';
  }
  if (tracker.weide !== null) {
    return `Weide ${weides.entities[tracker.weide].identifier}`;
  }
  if (tracker.fiche !== null) {
    return `Fiche ${fiches.entities[tracker.fiche].display_name}`;
  }
  if (tracker.forbidden_area !== null) {
    const forbiddenArea = forbiddenAreas.entities[tracker.forbidden_area];
    return `🚨 In verboden gebied ${forbiddenArea.description}`;
  }
  if (tracker.tocht !== null) {
    const tocht = tochten.entities[tracker.tocht];
    const closest_fiches = Object.values(fiches.entities).map((fiche) => ({
      // @ts-expect-error I have no idea
      distance: distance(tracker.last_log.point, fiche.point),
      ...fiche,
    }));
    closest_fiches.sort((a, b) => a.distance - b.distance);
    let first = closest_fiches[0];
    let second = closest_fiches[1];
    if (
      (first.tocht === second.tocht && first.order > second.order) ||
      first.tocht > second.tocht
    ) {
      [second, first] = [first, second];
    }
    return `Tocht ${tocht.identifier} (tussen ${first.display_name} en ${second.display_name})`;
  }
  return `⚠️ Verloren gelopen`;
}

export function getNavigationUrl(point: Point | null | undefined): string | null {
  if (!point) {
    return null;
  }
  const [longitude, latitude] = point.coordinates;
  return isMobile({ tablet: true, featureDetect: true })
    ? `geo:${latitude},${longitude}`
    : `https://www.google.com/maps/search/?api=1&query=${latitude}%2C${longitude}`;
}
