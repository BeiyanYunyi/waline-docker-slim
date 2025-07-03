FROM node:current-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
COPY . /app
WORKDIR /app

# FROM base AS build
# RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
# RUN pnpm run build

# FROM base AS prod-deps
# RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile

FROM base
# COPY --from=prod-deps /app/node_modules /app/node_modules
# COPY --from=build /app/packages/akismet-js/lib /app/packages/akismet-js/lib
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile
EXPOSE 8360
CMD [ "node", "index.js" ]