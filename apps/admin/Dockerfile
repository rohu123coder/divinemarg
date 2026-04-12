FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY apps/admin/package*.json ./apps/admin/
COPY shared/package*.json ./shared/
RUN npm install --workspace=divinemarg-admin --workspace=divinemarg-shared
COPY apps/admin ./apps/admin
COPY shared ./shared
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_WEB_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_WEB_URL=${NEXT_PUBLIC_WEB_URL}
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build --workspace=divinemarg-admin
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001
COPY --from=builder /app/apps/admin/.next/standalone ./
COPY --from=builder /app/apps/admin/.next/static ./apps/admin/.next/static
COPY --from=builder /app/apps/admin/public ./apps/admin/public
EXPOSE 3001
CMD ["node", "apps/admin/server.js"]
