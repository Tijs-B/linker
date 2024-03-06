import distance from "@turf/distance";
import centroid from "@turf/centroid";
import pointToLineDistance from "@turf/point-to-line-distance";

export function getLastCheckpointLog(team, checkpointLogs) {
    let teamId = team;
    if (typeof team === 'object') {
        teamId = team.id;
    }
    const filtered = Object.values(checkpointLogs).filter((l) => l.team === teamId);
    if (filtered.length > 0) {
        return filtered.reduce((prev, curr) =>
            new Date(prev.timestamp) > new Date(curr.timestamp) ? prev : curr,
        );
    } else {
        return null;
    }
}

export function getPositionDescription(point, fiches, tochten, weides, basis) {
    if (distance(point, basis) < 0.1) {
        return 'Basis';
    }
    for (let weide of Object.values(weides.entities)) {
        if (distance(point, centroid(weide.polygon)) < 0.3) {
            let tocht = tochten.entities[weide.tocht];
            return `Weide ${tocht.identifier}`;
        }
    }
    for (let fiche of Object.values(fiches.entities)) {
        if (distance(point, fiche.point) < 0.06) {
            let tocht = tochten.entities[fiche.tocht];
            return `Fiche ${tocht.identifier}${fiche.order}`;
        }
    }
    for (let tocht of Object.values(tochten.entities)) {
        if (pointToLineDistance(point, tocht.route) < 0.06) {
            let closest_fiches = Object.values(fiches.entities)
                .map((fiche) => ({
                    distance: distance(point, fiche.point),
                    ...fiche
                }));
            closest_fiches.sort((a, b) => a.distance - b.distance);
            let first = closest_fiches[0];
            let second = closest_fiches[1];
            if (first.tocht === second.tocht && first.order > second.order || first.tocht > second.tocht) {
                [second, first] = [first, second];
            }
            return `Tocht ${tocht.identifier} (tussen ${tochten.entities[first.tocht].identifier}${first.order} en ${tochten.entities[second.tocht].identifier}${second.order})`;
        }
    }
    return `⚠️ Verloren gelopen`;
}

export function ficheDisplay(fiche, fiches, tochten) {
    const ficheData = fiches.entities[fiche];
    const tocht = tochten.entities[ficheData.tocht];
    return `${tocht.identifier}${ficheData.order}`
}

export function getNextFiche(fiche, fiches) {
    const index = fiches.ids.indexOf(fiche);
    if (index === fiches.ids.length - 1) {
        return fiches.ids[0];
    } else {
        return fiches.ids[index + 1];
    }
}

export function getCheckpointLog(team, fiche, checkpointLogs) {
    for (let log of Object.values(checkpointLogs.entities)) {
        if (log.fiche === fiche && log.team === team) {
            return log;
        }
    }
    return null;
}
