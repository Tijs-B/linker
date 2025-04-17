from django.db import connection

from linker.map.models import Tocht, Basis
from linker.tracing.constants import GEBIED_MAX_DISTANCE


def get_all_tracks() -> str:
    tocht_centroid = Tocht.centroid()
    basis = Basis.objects.get().point
    with connection.cursor() as cursor:
        cursor.execute(
            """
SELECT ST_AsGeoJSON(ST_Collect(f.line))
FROM (
    SELECT 
        ST_MakeLine(trackers_trackerlog.point ORDER BY trackers_trackerlog.gps_datetime) as line
    FROM trackers_trackerlog
    INNER JOIN trackers_tracker
    ON (trackers_trackerlog.tracker_id = trackers_tracker.id)
    INNER JOIN people_team
    ON (trackers_tracker.id = people_team.id)
    WHERE (
        ST_DistanceSphere(trackers_trackerlog.point, %s::geometry) < %s
        AND ST_DistanceSphere(trackers_trackerlog.point, %s::geometry) > %s
        AND NOT trackers_trackerlog.team_is_safe
        AND trackers_trackerlog.speed < 15
    )
    group by trackers_trackerlog.tracker_id
) as f;
            """,
            [
                tocht_centroid.hexewkb.decode('utf-8'),
                GEBIED_MAX_DISTANCE,
                basis.hexewkb.decode('utf-8'),
                300,
            ],
        )
        row = cursor.fetchone()
    result = row[0]
    if result is None:
        return '{"type":"MultiLineString","coordinates":[]}'
    return row[0]
