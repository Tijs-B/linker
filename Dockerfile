ARG DOMAIN

################
### FRONTEND ###
################
FROM node:22-bookworm-slim AS frontend

ARG DOMAIN
ENV VITE_DOMAIN=$DOMAIN

WORKDIR /app

RUN apt-get update && apt-get install --no-install-recommends -y brotli && rm -rf /var/lib/apt/lists/*

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend .

RUN npm run build \
    && find /app/dist -type f \( -name "*.js" -o -name "*.css" -o -name "*.html" -o -name "*.json" -o -name "*.svg" -o -name "*.woff2" \) \
       -exec brotli --best --keep {} \;

###################
### TIPPECANOE ####
###################
FROM debian:bookworm-slim AS tippecanoe

RUN apt-get update && apt-get install --no-install-recommends -y \
    build-essential \
    libsqlite3-dev \
    zlib1g-dev \
    git \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

RUN git clone --depth 1 --branch 2.79.0 https://github.com/felt/tippecanoe.git /tippecanoe \
    && cd /tippecanoe \
    && make -j"$(nproc)" \
    && make install PREFIX=/usr/local

###############
### BACKEND ###
###############
FROM ghcr.io/astral-sh/uv:python3.14-bookworm-slim AS backend

# Install the project into `/app`
WORKDIR /app

# Install geodjango dependencies + tippecanoe runtime deps
RUN apt-get update && apt-get install --no-install-recommends -y \
    binutils \
    libproj-dev \
    gdal-bin \
    libsqlite3-0 \
    zlib1g \
    && rm -rf /var/lib/apt/lists/*

COPY --from=tippecanoe /usr/local/bin/tippecanoe /usr/local/bin/tippecanoe
COPY --from=tippecanoe /usr/local/bin/tile-join /usr/local/bin/tile-join

# Enable bytecode compilation
ENV UV_COMPILE_BYTECODE=1

# Copy from the cache instead of linking since it's a mounted volume
ENV UV_LINK_MODE=copy

# Keep the venv outside of /app so bind-mounting the source over /app
# (as done in the dev docker-compose files) doesn't wipe it out
ENV UV_PROJECT_ENVIRONMENT=/venv

# Install the project's dependencies using the lockfile and settings
RUN --mount=type=cache,target=/root/.cache/uv \
    --mount=type=bind,source=backend/uv.lock,target=uv.lock \
    --mount=type=bind,source=backend/pyproject.toml,target=pyproject.toml \
    uv sync --frozen --no-install-project --no-dev

# Then, add the rest of the project source code and install it
# Installing separately from its dependencies allows optimal layer caching
COPY backend /app
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-dev

# Place executables in the environment at the front of the path
ENV PATH="/venv/bin:$PATH"

ENV DJANGO_SETTINGS_MODULE=linker.settings

COPY --chmod=0755 backend/docker-entrypoint.sh ./docker-entrypoint.sh
ENTRYPOINT ["./docker-entrypoint.sh"]

RUN SECRET_KEY=12345 python manage.py collectstatic --noinput

#############
### NGINX ###
#############
FROM fholzer/nginx-brotli AS custom-nginx

RUN rm /etc/nginx/conf.d/default.conf
COPY deployment/nginx.conf /etc/nginx/conf.d

COPY --from=frontend /app/dist /app/serve
COPY --from=backend /app/static /app/serve/static
