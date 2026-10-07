# API de correo e invitaciones (Node 20 + Fastify). Imagen final solo con dependencias de producción.
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist
COPY templates ./templates
USER node
EXPOSE 8787
CMD ["node", "dist/server.js"]
