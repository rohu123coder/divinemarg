FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY shared/package*.json ./shared/
RUN npm install --workspace=divinemarg-backend --workspace=divinemarg-shared
COPY backend ./backend
COPY shared ./shared
RUN cd backend && npx tsc
EXPOSE 4000
CMD ["node", "backend/dist/index.js"]
