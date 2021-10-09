FROM node:12.18 AS base

FROM base AS build

WORKDIR /build
COPY ./package.json ./yarn.lock ./
RUN yarn --frozen-lockfile
COPY . ./
RUN yarn run proto:fetch
RUN yarn run proto:generate
RUN yarn run proto:admin:generate
RUN yarn run tsc

FROM base
ENV NODE_ENV production
COPY --from=build /build/dist /dist
WORKDIR /dist
COPY --from=build /build/package.json /build/yarn.lock ./
RUN yarn install --production --frozen-lockfile
