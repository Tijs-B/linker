import { yellow } from '@mui/material/colors';

import handSvgRaw from '../assets/debug-hand.svg?raw';
import mapNoteSvgRaw from '../assets/debug-map-note.svg?raw';
import phoneSvgRaw from '../assets/debug-phone.svg?raw';
import trackerSvgRaw from '../assets/debug-tracker.svg?raw';
import dDinUrl from '../assets/fonts/D-DIN-Bold.subset.woff2';
import dDinCondensedUrl from '../assets/fonts/D-DINCondensed-Bold.subset.woff2';
import type { OrganizationMember, Team } from '../services/types.ts';
import { itemColor } from '../theme/colors.ts';

function loadPath(svgRaw: string, id: string): Path2D {
  const doc = new DOMParser().parseFromString(svgRaw, 'image/svg+xml');
  const el = doc.getElementById(id);
  if (!el) throw new Error(`SVG path #${id} not found`);
  return new Path2D(el.getAttribute('d') ?? '');
}

const TRACKER_PATH = loadPath(trackerSvgRaw, 'tracker-body');
const TRACKER_BORDER_PATH = loadPath(trackerSvgRaw, 'tracker-border');
const TRACKER_OUTLINE_PATH = loadPath(trackerSvgRaw, 'tracker-outline');

const PHONE_BODY_PATH = loadPath(phoneSvgRaw, 'phone-body');
const PHONE_BORDER_PATH = loadPath(phoneSvgRaw, 'phone-border');
const PHONE_OUTLINE_PATH = loadPath(phoneSvgRaw, 'phone-outline');

const HAND_BODY_PATH = loadPath(handSvgRaw, 'hand-body');
const HAND_BORDER_PATH = loadPath(handSvgRaw, 'hand-border');
const HAND_OUTLINE_PATH = loadPath(handSvgRaw, 'hand-outline');

const MAP_NOTE_FLAG_PATH = loadPath(mapNoteSvgRaw, 'map-note-flag');
const MAP_NOTE_POLE_PATH = loadPath(mapNoteSvgRaw, 'map-note-pole');
const MAP_NOTE_BORDER_PATH = loadPath(mapNoteSvgRaw, 'map-note-border');

const dDinFontFace = new FontFace('D-DIN Bold', `url(${dDinUrl})`);
const dDinCondensedFontFace = new FontFace('D-DINCondensed Bold', `url(${dDinCondensedUrl})`);
document.fonts.add(dDinFontFace);
document.fonts.add(dDinCondensedFontFace);

dDinFontFace.load();
dDinCondensedFontFace.load();

const canvas = document.createElement('canvas');
canvas.width = 33 * 2;
canvas.height = 48 * 2;

function generateMapNoteIcon(
  color: string,
  context: CanvasRenderingContext2D,
  addToMap: (name: string, data: ImageData) => void,
): void {
  const gradient = context.createRadialGradient(11 / 1.8, 40.5, 0, 11 / 1.8, 40.5, 5.25);
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0.4)');
  gradient.addColorStop(0.95, 'rgba(0, 0, 0, 0.05)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

  context.clearRect(0, 0, 33 * 2, 48 * 2);
  context.fillStyle = gradient;
  context.setTransform(3.6, 0, 0, 2, 0, 0);
  context.fillRect(-6, 1.5, 33, 48);
  context.setTransform(2, 0, 0, 2, 0, 0);

  context.fillStyle = color;
  context.fill(MAP_NOTE_FLAG_PATH);

  context.fillStyle = '#333';
  context.fill(MAP_NOTE_POLE_PATH);

  context.fillStyle = 'rgba(0, 0, 0, 0.25)';
  context.fill(MAP_NOTE_BORDER_PATH);

  addToMap('map-note', context.getImageData(0, 0, 33 * 2, 48 * 2));
}

function generateTrackers(
  color: string,
  codes: string[],
  context: CanvasRenderingContext2D,
  addToMap: (name: string, data: ImageData) => void,
): void {
  const gradient = context.createRadialGradient(16.5 / 1.8, 39.1, 0, 16.5 / 1.8, 39.1, 5.25);
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0.4)');
  gradient.addColorStop(0.95, 'rgba(0, 0, 0, 0.05)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

  context.clearRect(0, 0, 33 * 2, 48 * 2);
  context.fillStyle = gradient;
  context.setTransform(3.6, 0, 0, 2, 0, 0);
  context.fillRect(0, 0, 33, 48);
  context.setTransform(2, 0, 0, 2, 0, 0);

  context.fillStyle = color;
  context.fill(TRACKER_PATH);

  context.fillStyle = 'rgba(0, 0, 0, 0.25)';
  context.fill(TRACKER_BORDER_PATH);

  const imageWithoutCode = context.getImageData(0, 0, 33 * 2, 48 * 2);

  codes.forEach((code) => {
    context.putImageData(imageWithoutCode, 0, 0);
    context.font = code.length == 2 ? '17px D-DIN Bold' : '14px D-DINCondensed Bold';
    context.textAlign = 'center';
    context.fillStyle = '#fff';
    context.fillText(code, 16.5, 23.1);

    addToMap(`tracker-${code}-${color}`, context.getImageData(0, 0, 33 * 2, 48 * 2));
  });
}

function generatePhoneTrackers(
  color: string,
  codes: string[],
  context: CanvasRenderingContext2D,
  addToMap: (name: string, data: ImageData) => void,
): void {
  // Same shadow position as tracker (tip at y≈38.8, shadow center at 39.1)
  const gradient = context.createRadialGradient(16.5 / 1.8, 39.1, 0, 16.5 / 1.8, 39.1, 5.25);
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0.4)');
  gradient.addColorStop(0.95, 'rgba(0, 0, 0, 0.05)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

  context.clearRect(0, 0, 33 * 2, 48 * 2);
  context.fillStyle = gradient;
  context.setTransform(3.6, 0, 0, 2, 0, 0);
  context.fillRect(0, 0, 33, 48);
  context.setTransform(2, 0, 0, 2, 0, 0);

  context.fillStyle = color;
  context.fill(PHONE_BODY_PATH);

  context.fillStyle = 'rgba(0, 0, 0, 0.25)';
  context.fill(PHONE_BORDER_PATH);

  const imageWithoutCode = context.getImageData(0, 0, 33 * 2, 48 * 2);

  codes.forEach((code) => {
    context.putImageData(imageWithoutCode, 0, 0);
    context.font = code.length == 2 ? '17px D-DIN Bold' : '14px D-DINCondensed Bold';
    context.textAlign = 'center';
    context.fillStyle = '#fff';
    context.fillText(code, 16.5, 23);

    addToMap(`phone-${code}-${color}`, context.getImageData(0, 0, 33 * 2, 48 * 2));
  });
}

function generateHandTrackers(
  color: string,
  codes: string[],
  context: CanvasRenderingContext2D,
  addToMap: (name: string, data: ImageData) => void,
): void {
  const gradient = context.createRadialGradient(16.5 / 1.8, 39.1, 0, 16.5 / 1.8, 39.1, 5.25);
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0.4)');
  gradient.addColorStop(0.95, 'rgba(0, 0, 0, 0.05)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

  context.clearRect(0, 0, 33 * 2, 48 * 2);
  context.fillStyle = gradient;
  context.setTransform(3.6, 0, 0, 2, 0, 0);
  context.fillRect(0, 0, 33, 48);
  context.setTransform(2, 0, 0, 2, 0, 0);

  context.fillStyle = color;
  context.fill(HAND_BODY_PATH);

  context.fillStyle = 'rgba(0, 0, 0, 0.25)';
  context.fill(HAND_BORDER_PATH);

  const imageWithoutCode = context.getImageData(0, 0, 33 * 2, 48 * 2);

  codes.forEach((code) => {
    context.putImageData(imageWithoutCode, 0, 0);
    context.font = code.length == 2 ? '16px D-DIN Bold' : '14px D-DINCondensed Bold';
    context.textAlign = 'center';
    context.fillStyle = '#fff';
    context.fillText(code, 17, 20);

    addToMap(`hand-${code}-${color}`, context.getImageData(0, 0, 33 * 2, 48 * 2));
  });
}

function generateHandOutline(
  color: string,
  name: string,
  context: CanvasRenderingContext2D,
  addToMap: (name: string, data: ImageData) => void,
): void {
  context.clearRect(0, 0, 33 * 2, 48 * 2);
  context.fillStyle = color;
  context.fill(HAND_OUTLINE_PATH);
  addToMap(name, context.getImageData(0, 0, 33 * 2, 48 * 2));
}

function generateOutline(
  path: Path2D,
  name: string,
  color: string,
  context: CanvasRenderingContext2D,
  addToMap: (name: string, data: ImageData) => void,
): void {
  context.clearRect(0, 0, 33 * 2, 48 * 2);
  context.fillStyle = color;
  context.fill(path);
  addToMap(name, context.getImageData(0, 0, 33 * 2, 48 * 2));
}

export async function generateAllIcons(
  items: (Team | OrganizationMember)[],
  addToMap: (name: string, data: ImageData) => void,
) {
  await Promise.all([dDinFontFace.load(), dDinCondensedFontFace.load()]);
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) {
    return;
  }
  context.scale(2, 2);

  const codesPerColor: Record<string, string[]> = {};

  for (const item of items) {
    const color = itemColor(item);
    if (!color) {
      continue;
    }
    if (!codesPerColor[color]) {
      codesPerColor[color] = [];
    }
    codesPerColor[color].push(item.code);
  }

  Object.entries(codesPerColor).forEach(([color, codes]) => {
    const uniqueCodes = [...new Set(codes)];
    generateTrackers(color, uniqueCodes, context, addToMap);
    generatePhoneTrackers(color, uniqueCodes, context, addToMap);
    generateHandTrackers(color, uniqueCodes, context, addToMap);
  });

  generateMapNoteIcon(yellow[400], context, addToMap);
  generateOutline(TRACKER_OUTLINE_PATH, 'tracker-outline', '#fff', context, addToMap);
  generateOutline(TRACKER_OUTLINE_PATH, 'tracker-offline-outline', yellow[700], context, addToMap);
  generateOutline(PHONE_OUTLINE_PATH, 'phone-outline', '#fff', context, addToMap);
  generateOutline(PHONE_OUTLINE_PATH, 'phone-offline-outline', yellow[700], context, addToMap);
  generateHandOutline('#fff', 'hand-outline', context, addToMap);
  generateHandOutline(yellow[700], 'hand-offline-outline', context, addToMap);
}
