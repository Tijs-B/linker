import { LineString, MultiPolygon, Point, Polygon } from 'geojson';

export enum Direction {
  RED = 'R',
  BLUE = 'B',
}

export enum MemberType {
  AGENDA = 'Agenda',
  COORDINATIE = 'Coordinatie',
  RODE_KRUIS = 'Rode Kruis',
  HANDIGE_HARRY = 'Handige Harry',
  WEIDE = 'Weide',
}

export interface TrackerLog {
  id: number;
  gps_datetime: string;
  point: Point;
  team_is_safe: boolean;
}

export interface Tracker {
  id: number;
  last_log: TrackerLog | null;
  tracker_id: string;
  tracker_name: string;
  fiche: number | null;
  weide: number | null;
  tocht: number | null;
  basis: number | null;
}

export interface ContactPerson {
  id: number;
  name: string;
  phone_number: string;
  email_address: string;
  is_favorite: boolean;
  team: number;
}

export interface TeamNote {
  id: number;
  team: number;
  created: string;
  text: string;
  author: string | null;
}

export interface Team {
  id: number;
  direction: Direction;
  number: number;
  name: string;
  chiro: string;
  tracker: number | null;
  contact_persons: ContactPerson[];
  team_notes: TeamNote[];
  group_picture: string | null;
  safe_weide: number | null;
  safe_weide_updated_at: string | null;
  safe_weide_updated_by: string | null;
  code: string;
}

export interface OrganizationMember {
  id: number;
  tracker: number;
  name: string;
  code: string;
  phone_number: string;
  member_type: MemberType;
}

export interface Tocht {
  id: number;
  identifier: string;
  order: number;
  route: LineString;
}

export interface Fiche {
  id: number;
  order: number;
  point: Point;
  tocht: number;
  display_name: string;
}

export interface Weide {
  id: number;
  tocht: number;
  polygon: Polygon;
  display_name: string;
}

export interface Zijweg {
  id: number;
  geom: LineString;
}

export interface MapNote {
  id: number;
  created: string;
  updated: string;
  content: string;
  point: Point;
  author: string | null;
}

export interface Basis {
  id: number;
  point: Point;
}

export interface ForbiddenArea {
  id: number;
  description: string;
  area: MultiPolygon;
}

export interface CheckpointLog {
  id: number;
  arrived: string;
  left: string | null;
  fiche: number;
  team: number;
}

interface SingleStat {
  average: number;
  nb_teams: number;
}

interface TeamStat {
  fiches: Record<number, number>;
  fullTochten: Record<number, number>;
  partialTochten: Record<number, number>;
  avgFicheDeviation: number | null;
  avgFullTochtDeviation: number | null;
  avgPartialTochtDeviation: number | null;
}

export interface Stats {
  fiches: Record<number, Record<Direction, SingleStat>>;
  fullTochten: Record<number, Record<Direction, SingleStat>>;
  partialTochten: Record<number, Record<Direction, SingleStat>>;
  teams: Record<number, TeamStat>;
}

export interface LoginUser {
  username: string;
  password: string;
}

export interface User {
  username: string;
  permissions: string[];
}
