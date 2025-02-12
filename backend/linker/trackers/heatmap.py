import re
import subprocess
import tempfile
from pathlib import Path
from shutil import rmtree

from django.db import connection

from linker.map.models import Tocht
from linker.tracing.constants import GEBIED_MAX_DISTANCE


def get_all_tracks() -> str:
    tocht_centroid = Tocht.centroid()
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
        AND NOT trackers_trackerlog.team_is_safe
        AND trackers_trackerlog.speed < 15
    )
    group by trackers_trackerlog.tracker_id
) as f;
            """,
            [tocht_centroid.hexewkb.decode('utf-8'), GEBIED_MAX_DISTANCE],
        )
        row = cursor.fetchone()
    return row[0]


def generate_heatmap_tiles(result_path: Path):
    # tracks = []
    # for tracker in Tracker.objects.filter(team__isnull=False):
    #     tracks.append(tracker.get_track_geojson())
    #
    # features = [f'{{"type": "Feature", "properties": {{}}, "geometry": {track}}}' for track in tracks]
    #
    # if len(tracks) == 0:
    #     return
    #
    # tmp_dir = Path(tempfile.mkdtemp())
    #
    # tracks_geojson = tmp_dir / 'tracks.geojson'
    # with open(tracks_geojson, 'w') as f:
    #     f.write('{"type": "FeatureCollection", "features": [')
    #     f.write(','.join(features))
    #     f.write(']}')

    tmp_dir = Path(tempfile.mkdtemp())
    tracks_geojson = tmp_dir / 'tracks.geojson'
    tracks_geojson.write_text(get_all_tracks())

    heatmap_tif = tmp_dir / 'heatmap.tif'
    subprocess.run(
        ['gdal_rasterize', '-add', '-ts', '5000', '5000', '-burn', '1', '-l', 'tracks', tracks_geojson, heatmap_tif]
    )

    gdalinfo_stats = subprocess.check_output(['gdalinfo', '-stats', heatmap_tif]).decode('utf-8')
    max_value = float(re.search(r'Maximum=(\d+\.?\d*)', gdalinfo_stats).group(1))

    color_file = tmp_dir / 'color_file'

    color_file.write_text(
        f'{max_value} 255 255 255 255\n'
        f'{0.6 * max_value} 255 255 0 255\n'
        f'{0.2 * max_value} 255 0 0 255\n'
        f'{0.02 * max_value} 255 0 0 230\n'
        '0 0 0 0 0'
    )

    heatmap_color_tif = tmp_dir / 'heatmap_color.tif'
    subprocess.run(['gdaldem', 'color-relief', '-alpha', heatmap_tif, color_file, heatmap_color_tif])

    for path in result_path.glob('*'):
        if path.is_file():
            path.unlink()
        elif path.is_dir():
            rmtree(path)

    subprocess.run(['gdal2tiles.py', '--xyz', '--zoom', '9-16', '-w', 'none', heatmap_color_tif, result_path])

    rmtree(tmp_dir)
