import dayjs from 'dayjs';

export function toHoursMinutes(timestamp: string | undefined): string {
  if (!timestamp) {
    return '-';
  }
  return dayjs(timestamp).tz('Europe/Brussels').format('HH:MM');
}

export function secondsToHoursMinutes(
  seconds: number | null | undefined,
  showPrefix: boolean = true,
): string {
  if (seconds === null || seconds === undefined) {
    return '-';
  }
  const duration = dayjs.duration(Math.abs(seconds), 'seconds');
  let result = '';

  if (showPrefix) {
    result += seconds < 0 ? '- ' : '+ ';
  }

  if (duration.asMinutes() >= 1) {
    if (duration.asHours() >= 1) {
      result += `${Math.floor(duration.asHours())} uur `;
    }
    result += `${duration.minutes()} minuten `;
  } else {
    result += `${duration.seconds()} seconden`;
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
