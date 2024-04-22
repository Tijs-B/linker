import { EntityState } from '@reduxjs/toolkit';
import distance from '@turf/distance';

import { CheckpointLog, Fiche, Tocht, Tracker, Weide } from '../services/types.ts';

export function getLastCheckpointLog(
  team: number,
  checkpointLogs: EntityState<CheckpointLog, number>,
): CheckpointLog | null {
  const filtered = Object.values(checkpointLogs).filter((l) => l.team === team);
  if (filtered.length > 0) {
    return filtered.reduce((prev, curr) =>
      new Date(prev.timestamp) > new Date(curr.timestamp) ? prev : curr,
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
): string {
  if (tracker.last_log === null) {
    return '-';
  }
  if (tracker.basis !== null) {
    return 'Basis';
  }
  if (tracker.weide !== null) {
    return `Weide ${weides.entities[tracker.weide].display_name}`;
  }
  if (tracker.fiche !== null) {
    return `Fiche ${fiches.entities[tracker.fiche].display_name}`;
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

export function getNextFiche(fiche: number, fiches: EntityState<Fiche, number>): number {
  const index = fiches.ids.indexOf(fiche);
  if (index === fiches.ids.length - 1) {
    return fiches.ids[0];
  } else {
    return fiches.ids[index + 1];
  }
}
