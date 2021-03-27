FROM node:12.18 AS base

FROM base AS build

WORKDIR /build/api
COPY ./api/package.json ./api/yarn.lock ./
RUN yarn --frozen-lockfile
RUN yarn link
COPY ./api/ ./
RUN yarn run tsc

WORKDIR /build/frontend
COPY ./frontend/package.json ./frontend/yarn.lock ./
RUN yarn --frozen-lockfile
RUN yarn link majsoul-api

COPY ./frontend ./
RUN yarn run webpack --mode=production

FROM nginx
COPY --from=build /build/frontend/dist /dist
COPY ./nginx.conf /etc/nginx/nginx.conf
