import dayjs from 'dayjs';

export function toHoursMinutes(timestamp: string | undefined): string {
  if (!timestamp) {
    return '-';
  }
  return dayjs(timestamp).tz('Europe/Brussels').format('HH:mm');
}

export function secondsToHoursMinutes(
  seconds: number | null | undefined,
  showPrefix: boolean = true,
): string {
  if (seconds === null || seconds === undefined) {
    return '-';
  }

  let result = '';

  if (showPrefix) {
    result += seconds < 0 ? '- ' : '+ ';
  }

  seconds = Math.abs(seconds);
  const minutes = seconds / 60;
  const hours = minutes / 60;

  if (minutes >= 1) {
    if (hours >= 1) {
      result += `${Math.floor(hours)} uur `;
    }
    const minutesOfHours = Math.floor(minutes) % 60;
    result += `${minutesOfHours} minuten `;
  } else {
    result += `${Math.floor(seconds)} seconden`;
  }

  return result;
}

export function formatDateTimeLong(timestamp: string | null | undefined) {
  if (!timestamp) {
    return '-';
  }
  return dayjs(timestamp).tz('Europe/Brussels').format('ddd D MMM YYYY [om] HH:mm');
}

export function formatDateTimeShorter(timestamp: string | null | undefined) {
  if (!timestamp) {
    return '-';
  }
  return dayjs(timestamp).tz('Europe/Brussels').format('ddd [om] HH:mm');
}

export function formatFromNow(timestamp: string | null | undefined) {
  if (!timestamp) {
    return '-';
  }
  return dayjs(timestamp).fromNow();
}
