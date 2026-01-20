from django.db import connection

from linker.map.models import Basis, Tocht
from linker.tracing.constants import GEBIED_MAX_DISTANCE


def get_all_tracks() -> str:
    tocht_centroid = Tocht.centroid()
    centroid_ewkb = tocht_centroid.hexewkb.decode('utf-8') if tocht_centroid else None
    basis = Basis.objects.get().point

    with connection.cursor() as cursor:
        cursor.execute(
            """
SELECT ST_AsGeoJSON(ST_Collect(f.line))
FROM (
    SELECT
        ST_MakeLine(trackers_position.point ORDER BY trackers_position.timestamp) as line
    FROM trackers_position
    WHERE (
        trackers_position.team_id IS NOT NULL
        AND (%s IS NULL OR ST_DistanceSphere(trackers_position.point, %s::geometry) < %s)
        AND ST_DistanceSphere(trackers_position.point, %s::geometry) > %s
    )
    GROUP BY trackers_position.team_id
) as f;
            """,
            [
                centroid_ewkb,
                centroid_ewkb,
                GEBIED_MAX_DISTANCE,
                basis.hexewkb.decode('utf-8'),
                300,
            ],
        )
        row = cursor.fetchone()
    result = row[0]
    if result is None:
        return '{"type":"MultiLineString","coordinates":[]}'
    return row[0]  # type: ignore[no-any-return]
