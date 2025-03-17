Run the following commands to generate `belgium.pmtiles`:

```bash
wget https://github.com/onthegomap/planetiler/releases/latest/download/planetiler.jar
java -Xmx1g -jar planetiler.jar --only-download --area=belgium
java -Xmx1g -jar planetiler.jar --area=belgium --output=openmaptiles.pmtiles --transportation-z13-paths
java -Xmx1g -jar planetiler.jar generate-custom --schema=outdoor.yml --output=outdoor.pmtiles --area=belgium
tile-join -o belgium.pmtiles openmaptiles.pmtiles outdoor.pmtiles
```
