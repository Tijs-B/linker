export function toHoursMinutes(dateTime) {
    if (dateTime) {
        const parsed = new Date(dateTime);
        return `${parsed.getHours().toString().padStart(2, '0')}:${parsed.getMinutes().toString().padStart(2, '0')}`;
    }
    return ''
}

export function secondsToHoursMinutes(seconds) {
    const totalMinutes = Math.round(seconds / 60);
    const minutes = totalMinutes % 60;
    const hours = Math.floor(totalMinutes / 60);
    return `${hours} uur ${minutes} minuten`;
}
