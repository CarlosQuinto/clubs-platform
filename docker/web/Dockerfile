# Frontend: compila la SPA con Vite y la sirve con nginx.
# Contexto de build: la raíz del repo (ver docker/docker-compose.yml). Las VITE_* se fijan al compilar.
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_API_URL
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL \
    VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY \
    VITE_API_URL=$VITE_API_URL
RUN npm run build

FROM nginx:1.27-alpine
# Plantilla con envsubst (API_UPSTREAM): nginx reenvía /api/* al gateway
COPY docker/web/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
ENV API_UPSTREAM=http://kong:8000
EXPOSE 80
