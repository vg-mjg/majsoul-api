FROM node:12.18 AS base

FROM base AS build

COPY . /build
WORKDIR /build
RUN yarn
RUN yarn run tsc

FROM base
ENV MAJSOUL_ENV prod
COPY --from=build /build/dist /dist
WORKDIR /dist
COPY --from=build /build/package.json /build/yarn.lock ./
RUN yarn install --production
ENTRYPOINT node /dist/results.js