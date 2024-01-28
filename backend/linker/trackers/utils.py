import json
import re
import shutil
import subprocess
import tempfile
from pathlib import Path

from linker.trackers.models import Tracker


def generate_heatmap_tiles(result_path: Path):
    if result_path.is_dir():
        shutil.rmtree(result_path)

    result_path.mkdir()

    line_strings = []
    for tracker in Tracker.objects.all():
        if not hasattr(tracker, "team"):
            continue
        line_strings.extend(l for l in tracker.get_track(skip_jumps=True, skip_basis=True))

    if len(line_strings) == 0:
        return

    tmp_dir = Path(tempfile.mkdtemp())

    collection = {
        "type": "FeatureCollection",
        "features": [{"type": "Feature", "properties": {}, "geometry": json.loads(line_string.json)}
                     for line_string in line_strings]
    }

    tracks_geojson = tmp_dir / "tracks.geojson"
    tracks_geojson.write_text(json.dumps(collection))

    buffer_tracks_shp = tmp_dir / "buffer_tracks.shp"

    subprocess.run(['ogr2ogr', '-dialect', 'SQLite', '-sql', 'SELECT ST_Buffer(geometry, 0.00002) FROM tracks',
                    buffer_tracks_shp, tracks_geojson])

    heatmap_tif = tmp_dir / "heatmap.tif"
    subprocess.run(['gdal_rasterize', '-add', '-ts', '5000', '5000', '-burn', '1', '-l', 'buffer_tracks',
                    buffer_tracks_shp, heatmap_tif])

    gdalinfo_stats = subprocess.check_output(['gdalinfo', '-stats', heatmap_tif]).decode('utf-8')
    max_value = str(float(re.search(r"Maximum=(\d+\.?\d*)", gdalinfo_stats).group(1)))

    heatmap_translate_tif = tmp_dir / "heatmap_translate.tif"
    subprocess.run(['gdal_translate', '-scale', '0', max_value, '0', '1', heatmap_tif, heatmap_translate_tif])

    color_file = tmp_dir / "color_file"

    color_file.write_text("""1.0 255 255 255 255
    0.746032 255 255 0 255
    0.365079 255 0 0 255
    0.05 255 0 0 200
    0 0 0 0 0""")

    heatmap_color_tif = tmp_dir / 'heatmap_color.tif'
    subprocess.run(['gdaldem', 'color-relief', '-alpha', heatmap_translate_tif, color_file, heatmap_color_tif])

    subprocess.run(['gdal2tiles.py', '--xyz', '--zoom', '9-16', heatmap_color_tif, result_path])

    shutil.rmtree(tmp_dir)

