################
### FRONTEND ###
################
FROM node:22-bullseye AS frontend

WORKDIR /app

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend .

RUN npm run build

###############
### BACKEND ###
###############
FROM python:3.12-bullseye AS backend

WORKDIR /app
RUN apt-get update && apt-get install --no-install-recommends -y \
    # for geodjango
    binutils \
    libproj-dev \
    gdal-bin

ENV PYTHONBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    DJANGO_SETTINGS_MODULE=linker.settings


COPY backend/requirements.lock .

RUN pip install -r requirements.lock

COPY --chmod=0755 backend/docker-entrypoint.sh ./docker-entrypoint.sh
ENTRYPOINT ["./docker-entrypoint.sh"]

COPY backend .

RUN SECRET_KEY=12345 python manage.py collectstatic --noinput

###########################
### MAP DATA DOWNLOADER ###
###########################
FROM eclipse-temurin:23-jre-noble AS map-data-downloader

WORKDIR /app

RUN apt-get update \
    && apt-get install -y wget gcc g++ make libsqlite3-dev zlib1g-dev git \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Build tippecanoe
RUN git clone https://github.com/felt/tippecanoe.git --depth 1 \
    && cd tippecanoe \
    && make \
    && make install \
    && cd .. \
    && rm -rf tippecanoe

RUN wget "https://github.com/onthegomap/planetiler/releases/latest/download/planetiler.jar" -O planetiler.jar

# First, download only
RUN java -jar planetiler.jar --only-download --area=belgium

# Generate openmaptiles.pmtiles
RUN java -Xmx1g -jar planetiler.jar --area=belgium --output=openmaptiles.pmtiles --transportation-z13-paths

# Generate custom outdoor.pmtiles
COPY map_data/outdoor.yml ./outdoor.yml
RUN java -Xmx1g -jar planetiler.jar generate-custom \
    --schema=outdoor.yml --output=outdoor.pmtiles \
    --area=belgium

# Join both pmtiles into one pmtiles
RUN tile-join -o belgium.pmtiles openmaptiles.pmtiles outdoor.pmtiles

#############
### NGINX ###
#############
FROM nginx AS custom-nginx

RUN rm /etc/nginx/conf.d/default.conf
COPY deployment/nginx.conf /etc/nginx/conf.d

COPY --from=frontend /app/dist /app/serve
COPY --from=backend /app/static /app/serve/static
COPY --from=map-data-downloader /app/belgium.pmtiles /app/serve/tiles/belgium.pmtiles
ADD map_data/fonts.tar.gz /app/serve/tiles/

####################
### FRONTEND DEV ###
####################
FROM frontend AS frontend-dev

COPY --from=map-data-downloader /app/belgium.pmtiles /app/public/tiles/belgium.pmtiles
ADD map_data/fonts.tar.gz /app/public/tiles/
