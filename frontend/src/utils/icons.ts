export function generateMapNoteIcon(color: string): ImageData | null {
  const canvas = document.createElement('canvas');
  canvas.width = 33 * 2;
  canvas.height = 48 * 2;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return null;
  }
  ctx.scale(2, 2);

  const gradient = ctx.createRadialGradient(11 / 1.8, 40.5, 0, 11 / 1.8, 40.5, 5.25);
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0.4)');
  gradient.addColorStop(0.95, 'rgba(0, 0, 0, 0.05)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = gradient;
  ctx.setTransform(3.6, 0, 0, 2, 0, 0);
  ctx.fillRect(0, 0, 33, 48);
  ctx.setTransform(2, 0, 0, 2, 0, 0);

  ctx.fillStyle = color;
  ctx.fill(
    new Path2D(
      'M10.4 14.06zm.32.01.09.02-.1-.02zm.28.04.05.01-.05-.01zm.24.06.06.01-.06-.01zm.18.06.1.04-.1-.04zm.14.07.11.06-.1-.06zm.11.06zm.24.2V30.7c.16.06.33.1.48.2.37.18 1.47.52 2.04.63 1.16.1 2.4.19 3.53-.23a7.98 7.98 0 0 0 3.66-2.64c2.16-2.45 6.15-4.5 9.7-5.85.09-.06-1.11-1-2.03-1.56a15.78 15.78 0 0 0-7.83-2.35c-3.19-.17-5.73-.52-8.63-2.8-.46-.57-.56-1.15-.92-1.54zm-2.68 2.28z',
    ),
  );

  ctx.fillStyle = '#333';
  ctx.fill(
    new Path2D(
      'M10.77 14.06c-.34 0-.67.14-.82.54-.07.2-.07 1.3-.07 13.45V41.3h2.03V14.56c-.2-.3-.52-.49-1.14-.5z',
    ),
  );

  ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
  ctx.fill(
    new Path2D(
      'M10.4 14.06zm.32.01.09.02-.1-.02zm.28.04zm.22.05zm.19.06.1.05-.1-.05zm.15.08.11.06-.1-.06zm.11.06zm.24.2v1.54a4.26 4.26 0 0 0 .38.53c1.68 1.68 4 2.6 7.09 2.9.4.04 1.28.1 2.04.13 1.85.09 2.66.21 4.04.64 1.08.34 2.32.9 3.43 1.6.31.18.64.43.96.66-3.42 1.48-6.78 3.31-8.8 5.6a7.12 7.12 0 0 1-3.33 2.42c-1.01.37-2.1.29-3.14.21-.46-.09-1.69-.5-1.85-.57-.22-.13-.38-.16-.6-.24a.75.75 0 0 0-.22-.04v.76c.17.04.33.13.48.2.37.18 1.47.52 2.04.63 1.22.2 2.39.09 3.53-.23a7.98 7.98 0 0 0 3.66-2.64c2.68-2.95 6.18-4.5 9.7-5.85.09-.06-1.11-1-2.03-1.56a16.52 16.52 0 0 0-7.83-2.35c-3.1-.11-6.69-.92-8.63-2.8-.46-.57-.56-1.15-.92-1.54zm-2.68 2.28z',
    ),
  );

  return ctx.getImageData(0, 0, 33 * 2, 48 * 2);
}

export function generateTracker(code: string, color: string): ImageData | null {
  const canvas = document.createElement('canvas');
  canvas.width = 33 * 2;
  canvas.height = 48 * 2;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return null;
  }
  ctx.scale(2, 2);

  const gradient = ctx.createRadialGradient(16.5 / 1.8, 39.1, 0, 16.5 / 1.8, 39.1, 5.25);
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0.4)');
  gradient.addColorStop(0.95, 'rgba(0, 0, 0, 0.05)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = gradient;
  ctx.setTransform(3.6, 0, 0, 2, 0, 0);
  ctx.fillRect(0, 0, 33, 48);
  ctx.setTransform(2, 0, 0, 2, 0, 0);

  ctx.fillStyle = color;
  ctx.fill(
    new Path2D(
      'M30 17.8c0 5.57-6.75 13.5-12.25 21-.73 1-1.77 1-2.5 0C9.75 31.3 3 23.52 3 17.8 3 10.34 9.04 4.3 16.5 4.3S30 10.34 30 17.8z',
    ),
  );

  ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
  ctx.fill(
    new Path2D(
      'M16.5 4.3C9.04 4.3 3 10.34 3 17.8c0 5.72 6.75 13.5 12.25 21 .75 1.02 1.77 1 2.5 0C23.25 31.3 30 23.37 30 17.8c0-7.46-6.04-13.5-13.5-13.5zm0 1c6.92 0 12.5 5.58 12.5 12.5 0 2.4-1.5 5.68-3.78 9.24-2.27 3.56-5.51 7.4-8.28 11.17-.2.27-.33.41-.44.53-.11-.12-.24-.26-.44-.53-2.78-3.78-5.65-7.6-8.04-11.14C5.62 23.53 4 20.25 4 17.8 4 10.88 9.58 5.3 16.5 5.3z',
    ),
  );

  ctx.font = code.length == 2 ? '17px D-DIN' : '14px D-DINCondensed';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fff';
  ctx.fillText(code, 16.5, 23.1);

  return ctx.getImageData(0, 0, 33 * 2, 48 * 2);
}

export function generateTrackerOutline(): ImageData | null {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return null;
  }
  ctx.scale(2, 2);
  ctx.fillStyle = '#fff';
  ctx.fill(
    new Path2D(
      'M16.5 2.074C7.84 2.074.775 9.138.775 17.8c0 3.735 1.97 7.331 4.43 11.058 2.46 3.726 5.538 7.56 8.248 11.254.662.907 1.767 1.662 3.047 1.662 1.28 0 2.385-.755 3.047-1.662 2.714-3.7 5.792-7.572 8.25-11.314 2.458-3.743 4.428-7.315 4.428-10.998 0-8.661-7.064-15.725-15.725-15.725zm0 2.225c7.46 0 13.5 6.04 13.5 13.5 0 5.57-6.75 13.5-12.25 21-.73 1-1.77 1-2.5 0-5.5-7.5-12.25-15.28-12.25-21 0-7.46 6.04-13.5 13.5-13.5z',
    ),
  );

  return ctx.getImageData(0, 0, 33 * 2, 48 * 2);
}
