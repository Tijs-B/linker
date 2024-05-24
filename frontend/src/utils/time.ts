import dayjs from 'dayjs';

const localFormatter = new Intl.DateTimeFormat('nl-BE');

export function toHoursMinutes(dateTime: string | undefined): string {
  if (dateTime) {
    const parsed = new Date(dateTime);
    return `${parsed.getHours().toString().padStart(2, '0')}:${parsed
      .getMinutes()
      .toString()
      .padStart(2, '0')}`;
  }
  return '';
}

export function secondsToHoursMinutes(
  seconds: number | null | undefined,
  showPrefix: boolean = true,
): string {
  if (seconds === null || seconds === undefined) {
    return '-';
  }
  const totalMinutes = Math.floor(Math.abs(seconds) / 60);
  const minutes = totalMinutes % 60;
  const hours = Math.floor(totalMinutes / 60);

  const hoursText = hours > 0 ? `${hours} uur ` : '';
  const prefix = showPrefix ? (seconds < 0 ? '- ' : '+ ') : '';

  if (hours > 0 || minutes > 0) {
    return `${prefix}${hoursText}${minutes} minuten`;
  } else {
    return `${prefix}${Math.abs(seconds)} seconden`;
  }
}

export function formatDateTime(timestamp: string | null | undefined) {
  if (!timestamp) {
    return '-';
  }
  return localFormatter.format(new Date(timestamp));
}

export function formatFromNow(timestamp: string | null | undefined) {
  if (!timestamp) {
    return '-';
  }
  return dayjs(timestamp).fromNow();
}
