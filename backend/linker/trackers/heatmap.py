import os
import subprocess
import tempfile
from pathlib import Path

from django.conf import settings
from django.db import connection

from linker.map.models import Basis, Tocht
from linker.tracing.constants import GEBIED_MAX_DISTANCE

HEATMAP_SOURCE_LAYER = 'heatmap'
HEATMAP_MAXZOOM = 16


def get_all_tracks() -> str:
    tocht_centroid = Tocht.centroid()
    centroid_ewkb = tocht_centroid.hexewkb.decode('utf-8') if tocht_centroid else None
    basis = Basis.objects.get().point

    with connection.cursor() as cursor:
        cursor.execute(
            """
SELECT json_build_object(
    'type', 'FeatureCollection',
    'features', COALESCE(json_agg(
        json_build_object(
            'type', 'Feature',
            'geometry', ST_AsGeoJSON(f.line)::json,
            'properties', json_build_object()
        )
    ), '[]'::json)
)::text
FROM (
    SELECT
        ST_MakeLine(trackers_position.point ORDER BY trackers_position.timestamp) as line
    FROM trackers_position
    WHERE (
        trackers_position.team_id IS NOT NULL
        AND (%s IS NULL OR ST_DistanceSphere(trackers_position.point, %s::geometry) < %s)
        AND ST_DistanceSphere(trackers_position.point, %s::geometry) > %s
        AND COALESCE((
            SELECT location FROM people_teamsafetylog
            WHERE team_id = trackers_position.team_id
            AND created <= trackers_position.timestamp
            ORDER BY created DESC
            LIMIT 1
        ), '') = ''
    )
    GROUP BY trackers_position.team_id
) as f
WHERE f.line IS NOT NULL;
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
        return '{"type":"FeatureCollection","features":[]}'
    return row[0]  # type: ignore[no-any-return]


def generate_heatmap_mbtiles() -> None:
    geojson = get_all_tracks()

    mbtiles_path = Path(settings.HEATMAP_MBTILES_PATH)
    mbtiles_path.parent.mkdir(parents=True, exist_ok=True)

    with tempfile.TemporaryDirectory(dir=mbtiles_path.parent) as tmp_dir:
        geojson_path = Path(tmp_dir) / 'heatmap.geojson'
        geojson_path.write_text(geojson)

        tmp_mbtiles_path = Path(tmp_dir) / 'heatmap.mbtiles'
        subprocess.run(
            [
                'tippecanoe',
                '-o',
                tmp_mbtiles_path,
                '-l',
                HEATMAP_SOURCE_LAYER,
                '-Z',
                '0',
                '-z',
                str(HEATMAP_MAXZOOM),
                '-f',
                geojson_path,
            ],
            check=True,
        )

        os.replace(tmp_mbtiles_path, mbtiles_path)
