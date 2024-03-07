export function toHoursMinutes(dateTime) {
    if (dateTime) {
        const parsed = new Date(dateTime);
        return `${parsed.getHours().toString().padStart(2, '0')}:${parsed.getMinutes().toString().padStart(2, '0')}`;
    }
    return ''
}

export function secondsToHoursMinutes(seconds) {
    if (seconds === null || seconds === undefined) {
        return '-';
    }
    const totalMinutes = Math.floor(Math.abs(seconds) / 60);
    const minutes = totalMinutes % 60;
    const hours = Math.floor(totalMinutes / 60);

    const hoursText = hours > 0 ? `${hours} uur ` : '';
    const prefix = seconds < 0 ? '- ' : '+ '

    if (minutes > 0) {
        return `${prefix}${hoursText}${minutes} minuten`;
    } else {
        return `${prefix}${Math.abs(seconds)} seconden`;
    }
}


