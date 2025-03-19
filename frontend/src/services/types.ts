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
  BUS = 'Bus',
}

export enum TrackerLogSource {
  MINISITE_API = 'minisite_api',
  GEODYNAMICS_API = 'geodynamics_api',
  MANUAL = 'manual',
}

export enum NotificationType {
  TRACKER_OFFLINE = 'tracker_offline',
  TRACKER_FAR_AWAY = 'tracker_far_away',
  TRACKER_SOS = 'tracker_sos',
  TRACKER_LOW_BATTERY = 'tracker_low_battery',
  TRACKER_NOT_MOVING = 'tracker_not_moving',
  TRACKER_IN_FORBIDDEN_AREA = 'tracker_in_forbidden_area',
}

export interface TrackerLog {
  id: number;
  gps_datetime: string;
  point: Point;
  source: TrackerLogSource;
  tracker: number;
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
  forbidden_area: number | null;
  is_online: boolean;
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
  tracker: number | null;
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
  identifier: string;
  name: string;
  tocht: number | null;
  polygon: Polygon;
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
  username: string | null;
  permissions: string[];
  is_staff: boolean;
}

export interface Notification {
  id: number;
  notification_type: NotificationType;
  sent: string;
  tracker: number;
  read: boolean;
  severity: number;
}
