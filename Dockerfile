################
### FRONTEND ###
################
FROM node:22-bookworm-slim AS frontend

WORKDIR /app

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend .

RUN npm run build

###############
### BACKEND ###
###############
FROM ghcr.io/astral-sh/uv:python3.13-bookworm-slim AS backend

# Install the project into `/app`
WORKDIR /app

# Install geodjango dependencies
RUN apt-get update && apt-get install --no-install-recommends -y \
    binutils \
    libproj-dev \
    gdal-bin \
    && rm -rf /var/lib/apt/lists/*

# Enable bytecode compilation
ENV UV_COMPILE_BYTECODE=1

# Copy from the cache instead of linking since it's a mounted volume
ENV UV_LINK_MODE=copy

# Install the project's dependencies using the lockfile and settings
RUN --mount=type=cache,target=/root/.cache/uv \
    --mount=type=bind,source=backend/uv.lock,target=uv.lock \
    --mount=type=bind,source=backend/pyproject.toml,target=pyproject.toml \
    uv sync --frozen --no-install-project --no-dev

# Then, add the rest of the project source code and install it
# Installing separately from its dependencies allows optimal layer caching
ADD backend /app
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-dev

# Place executables in the environment at the front of the path
ENV PATH="/app/.venv/bin:$PATH"

ENV DJANGO_SETTINGS_MODULE=linker.settings

COPY --chmod=0755 backend/docker-entrypoint.sh ./docker-entrypoint.sh
ENTRYPOINT ["./docker-entrypoint.sh"]

RUN SECRET_KEY=12345 python manage.py collectstatic --noinput

#############
### NGINX ###
#############
FROM nginx AS custom-nginx

RUN rm /etc/nginx/conf.d/default.conf
COPY deployment/nginx.conf /etc/nginx/conf.d

COPY --from=frontend /app/dist /app/serve
COPY --from=backend /app/static /app/serve/static
