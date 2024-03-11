import { LineString, MultiPolygon, Point, Polygon } from "geojson";


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
}

export interface Tracker {
    id: number;
    last_log: TrackerLog | null;
    tracker_id: string;
    tracker_code: string;
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
}

export interface Team {
  id: number;
  direction: Direction;
  number: number;
  name: string;
  chiro: string;
  start_weide_1: number | null;
  start_weide_2: number | null;
  eind_weide_1: number | null;
  eind_weide_2: number | null;
  tracker: number | null;
  contact_persons: ContactPerson[];
  team_notes: TeamNote[];
  group_picture: string | null;
  safe_weide: number | null;
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
    geom: Polygon;
}

export interface MapNote {
    id: number;
    created: string;
    updated: string;
    content: string;
    point: Point;
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
    tochten: Record<number, number>;
    avgFicheDeviation: number | null;
    avgTochtDeviation: number | null;
}

export interface Stats {
    fiches: Record<number, Record<Direction, SingleStat>>;
    tochten: Record<number, Record<Direction, SingleStat>>;
    teams: Record<number, TeamStat>;
}

export interface LoginUser {
    username: string;
    password: string;
}
