
FROM node:18-alpine as development

WORKDIR /usr/src/app

COPY . .

RUN npm install

ENV NODE_ENV development
