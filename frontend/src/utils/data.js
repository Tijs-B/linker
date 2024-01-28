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
