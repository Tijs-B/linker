import type { EntityState } from '@reduxjs/toolkit';
import distance from '@turf/distance';
import type { Point } from 'geojson';
import isMobile from 'is-mobile';

import type {
  CheckpointLog,
  Fiche,
  ForbiddenArea,
  OrganizationMember,
  Team,
  Tocht,
  Weide,
} from '../services/types.ts';

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
  item: Team | OrganizationMember,
  fiches: EntityState<Fiche, number>,
  tochten: EntityState<Tocht, number>,
  weides: EntityState<Weide, number>,
  forbiddenAreas: EntityState<ForbiddenArea, number>,
): string {
  if (item.last_position_point === null) {
    return '-';
  }
  if (item.basis !== null) {
    return 'Basis';
  }
  if (item.weide !== null) {
    return `Weide ${weides.entities[item.weide].identifier}`;
  }
  if (item.fiche !== null) {
    return `Fiche ${fiches.entities[item.fiche].display_name}`;
  }
  if (item.forbidden_area !== null) {
    const forbiddenArea = forbiddenAreas.entities[item.forbidden_area];
    return `🚨 In verboden gebied ${forbiddenArea.description}`;
  }
  if (item.tocht !== null) {
    const tocht = tochten.entities[item.tocht];
    if (tocht.is_alternative) {
      return `Tocht ${tocht.identifier}`;
    }
    const closest_fiches = Object.values(fiches.entities).map((fiche) => ({
      distance: distance(item.last_position_point!, fiche.point),
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
