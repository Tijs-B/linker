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
FROM python:3.13-bullseye AS backend

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app
RUN apt-get update && apt-get install --no-install-recommends -y \
    # for geodjango
    binutils \
    libproj-dev \
    gdal-bin

ENV DJANGO_SETTINGS_MODULE=linker.settings

RUN --mount=type=cache,target=/root/.cache/uv \
    --mount=type=bind,source=backend/uv.lock,target=uv.lock \
    --mount=type=bind,source=backend/pyproject.toml,target=pyproject.toml \
    uv sync --frozen --no-install-project --compile-bytecode

ENV PATH="/app/.venv/bin:$PATH"

COPY --chmod=0755 backend/docker-entrypoint.sh ./docker-entrypoint.sh
ENTRYPOINT ["./docker-entrypoint.sh"]

COPY backend .

RUN SECRET_KEY=12345 python manage.py collectstatic --noinput

#############
### NGINX ###
#############
FROM nginx AS custom-nginx

RUN rm /etc/nginx/conf.d/default.conf
COPY deployment/nginx.conf /etc/nginx/conf.d

COPY --from=frontend /app/dist /app/serve
COPY --from=backend /app/static /app/serve/static
COPY map_data/belgium.pmtiles /app/serve/tiles/belgium.pmtiles
ADD map_data/fonts.tar.gz /app/serve/tiles/

####################
### FRONTEND DEV ###
####################
FROM frontend AS frontend-dev

COPY map_data/belgium.pmtiles /app/public/tiles/belgium.pmtiles
ADD map_data/fonts.tar.gz /app/public/tiles/
