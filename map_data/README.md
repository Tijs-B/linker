Run the following commands to generate the needed tiles:

```bash
wget https://github.com/onthegomap/planetiler/releases/latest/download/planetiler.jar
java -Xmx1g -jar planetiler.jar --only-download --area=belgium
java -Xmx1g -jar planetiler.jar --area=belgium --output=openmaptiles.mbtiles --transportation-z13-paths --tile-format=mlt
java -Xmx1g -jar planetiler.jar generate-custom --schema=outdoor.yml --area=belgium --output=outdoor.mbtiles --tile-format=mlt
```
