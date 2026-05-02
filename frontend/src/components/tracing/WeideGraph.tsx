import { useMemo, useState } from 'react';

import { Box, Checkbox, FormControlLabel, TextField } from '@mui/material';

import type { EntityState } from '@reduxjs/toolkit';

import type { Stats, Tocht, Weide } from '../../services/types.ts';
import { Direction } from '../../services/types.ts';

interface WeideGraphProps {
  tochten: EntityState<Tocht, number>;
  weides: EntityState<Weide, number>;
  stats: Stats;
  showFull: boolean;
}

const SVG_SIZE = 620;
const CENTER = SVG_SIZE / 2;
const ORBIT_R = 200;
const NODE_R = 26;
const ARROW_OFFSET = 11;
const LABEL_OFFSET = 30;
// Timestamps are placed at this radius from the centre, just outside the node circles.
const TS_RADIUS = ORBIT_R + NODE_R + 16;
// Tangential shift so red and blue timestamps don't stack on top of each other.
const TS_TANG_SHIFT = 20;

const RED = '#C62828';
const BLUE = '#1565C0';

function formatDuration(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined) return '–';
  const totalMinutes = Math.floor(Math.abs(seconds) / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) return `${hours}u ${minutes} min`;
  return `${minutes} min`;
}

function parseTimeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + (m ?? 0);
}

function minutesToTimeStr(minutes: number): string {
  const total = ((minutes % (24 * 60)) + 24 * 60) % (24 * 60);
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

interface ArrowProps {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  markerId: string;
  label: string;
  perpOffset: number;
}

function Arrow({ x1, y1, x2, y2, color, markerId, label, perpOffset }: ArrowProps) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len === 0) return null;

  // Unit perpendicular (90° CCW of arrow direction)
  const px = -dy / len;
  const py = dx / len;

  const ox1 = x1 + px * perpOffset;
  const oy1 = y1 + py * perpOffset;
  const ox2 = x2 + px * perpOffset;
  const oy2 = y2 + py * perpOffset;

  const ux = dx / len;
  const uy = dy / len;
  const ax1 = ox1 + ux * (NODE_R + 4);
  const ay1 = oy1 + uy * (NODE_R + 4);
  const ax2 = ox2 - ux * (NODE_R + 12);
  const ay2 = oy2 - uy * (NODE_R + 12);

  const mx = (ax1 + ax2) / 2 + px * LABEL_OFFSET;
  const my = (ay1 + ay2) / 2 + py * LABEL_OFFSET;

  return (
    <g>
      <line
        x1={ax1}
        y1={ay1}
        x2={ax2}
        y2={ay2}
        stroke={color}
        strokeWidth={2}
        markerEnd={`url(#${markerId})`}
      />
      <text
        x={mx}
        y={my - 6}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={11}
        fontWeight="600"
        fill={color}
      >
        {label}
      </text>
    </g>
  );
}

export default function WeideGraph({ tochten, weides, stats, showFull }: WeideGraphProps) {
  const [closingTime, setClosingTime] = useState('21:30');
  const [addBuffer, setAddBuffer] = useState(false);

  const graphData = useMemo(() => {
    const weideByIdentifier: Record<string, Weide> = {};
    for (const id of weides.ids) {
      const w = weides.entities[id];
      if (w) weideByIdentifier[w.identifier] = w;
    }

    const filteredTochten = tochten.ids
      .map((id) => tochten.entities[id])
      .filter((t) => !t.is_alternative && t.order !== null)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    const n = filteredTochten.length;
    if (n === 0) return { positions: [], edges: [] };

    // Clockwise starting from top: A at top, B next clockwise, etc.
    const positions = filteredTochten.map((tocht, i) => {
      const angle = -Math.PI / 2 + (2 * Math.PI * i) / n;
      // Outward unit vector (radial direction away from centre)
      const outX = Math.cos(angle);
      const outY = Math.sin(angle);
      // Clockwise tangential unit vector: rotate outward 90° CW in SVG (y-down) coords
      // Rotating (outX, outY) CW by 90° gives (-outY, outX)
      const cwTangX = -outY;
      const cwTangY = outX;
      return {
        x: CENTER + ORBIT_R * outX,
        y: CENTER + ORBIT_R * outY,
        angle,
        outX,
        outY,
        cwTangX,
        cwTangY,
        identifier: tocht.identifier,
      };
    });

    const theStats = showFull ? stats.fullTochten : stats.partialTochten;

    const edges = filteredTochten.map((tocht, i) => {
      const nextIdx = (i + 1) % n;
      const s = theStats[tocht.id];
      return {
        fromPos: positions[i],
        toPos: positions[nextIdx],
        rAvg: s?.[Direction.RED]?.average,

        bAvg: s?.[Direction.BLUE]?.average,
      };
    });

    return { positions, edges };
  }, [tochten, weides, stats, showFull]);

  const { positions, edges } = graphData;
  const n = positions.length;

  // Per-weide closing timestamps derived from the selected closing time.
  // Red timestamp at weide[i]  = closingTime - duration(weide[i] → weide[i+1], red)
  // Blue timestamp at weide[i] = closingTime - duration(weide[i] → weide[i-1], blue)
  //   The blue outgoing edge from weide[i] is edges[(i-1+n)%n].bAvg
  const bufferSecs = addBuffer ? 1800 : 0;
  const weideTimestamps = useMemo(() => {
    if (n === 0) return [];
    const closingMins = parseTimeToMinutes(closingTime);
    return positions.map((_, i) => {
      const redAvg = edges[i]?.rAvg;
      const blueAvg = edges[(i - 1 + n) % n]?.bAvg;
      return {
        red:
          redAvg != null
            ? minutesToTimeStr(closingMins - Math.round((redAvg + bufferSecs) / 60))
            : null,
        blue:
          blueAvg != null
            ? minutesToTimeStr(closingMins - Math.round((blueAvg + bufferSecs) / 60))
            : null,
      };
    });
  }, [positions, edges, closingTime, n, bufferSecs]);

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <TextField
          label="Sluitingstijd"
          type="time"
          value={closingTime}
          onChange={(e) => setClosingTime(e.target.value)}
          size="small"
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <FormControlLabel
          control={
            <Checkbox checked={addBuffer} onChange={(e) => setAddBuffer(e.target.checked)} />
          }
          label="+30 minuten"
        />
      </Box>
      <svg
        width={SVG_SIZE}
        height={SVG_SIZE}
        viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
        style={{ maxWidth: '100%', display: 'block' }}
      >
        <defs>
          <marker id="arrow-red" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3 z" fill={RED} />
          </marker>
          <marker id="arrow-blue" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3 z" fill={BLUE} />
          </marker>
        </defs>

        {/* Arrows */}
        {edges.map((edge, i) => (
          <g key={i}>
            {/* Red: clockwise, weide[i] → weide[i+1] */}
            <Arrow
              x1={edge.fromPos.x}
              y1={edge.fromPos.y}
              x2={edge.toPos.x}
              y2={edge.toPos.y}
              color={RED}
              markerId="arrow-red"
              label={formatDuration(edge.rAvg != null ? edge.rAvg + bufferSecs : edge.rAvg)}
              perpOffset={ARROW_OFFSET}
            />
            {/* Blue: anti-clockwise, weide[i+1] → weide[i] */}
            <Arrow
              x1={edge.toPos.x}
              y1={edge.toPos.y}
              x2={edge.fromPos.x}
              y2={edge.fromPos.y}
              color={BLUE}
              markerId="arrow-blue"
              label={formatDuration(edge.bAvg != null ? edge.bAvg + bufferSecs : edge.bAvg)}
              perpOffset={ARROW_OFFSET}
            />
          </g>
        ))}

        {/* Weide nodes + closing timestamps */}
        {positions.map((pos, i) => {
          const ts = weideTimestamps[i];
          // Base position for timestamps: radially outward from the weide circle
          const baseTsX = CENTER + pos.outX * TS_RADIUS;
          const baseTsY = CENTER + pos.outY * TS_RADIUS;
          // Red timestamp: shift in the clockwise tangential direction
          const redTsX = baseTsX + pos.cwTangX * TS_TANG_SHIFT;
          const redTsY = baseTsY + pos.cwTangY * TS_TANG_SHIFT;
          // Blue timestamp: shift in the anti-clockwise tangential direction
          const blueTsX = baseTsX - pos.cwTangX * TS_TANG_SHIFT;
          const blueTsY = baseTsY - pos.cwTangY * TS_TANG_SHIFT;

          return (
            <g key={i}>
              <circle cx={pos.x} cy={pos.y} r={NODE_R} fill="white" stroke="#333" strokeWidth={2} />
              <text
                x={pos.x}
                y={pos.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={17}
                fontWeight="bold"
                fill="#333"
              >
                {pos.identifier}
              </text>
              {ts?.red && (
                <text
                  x={redTsX}
                  y={redTsY}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={11}
                  fontWeight="600"
                  fill={RED}
                >
                  {ts.red}
                </text>
              )}
              {ts?.blue && (
                <text
                  x={blueTsX}
                  y={blueTsY}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={11}
                  fontWeight="600"
                  fill={BLUE}
                >
                  {ts.blue}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </Box>
  );
}
