# backend/Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci --only=production
RUN npx prisma generate

COPY . .

RUN mkdir -p uploads

EXPOSE 5000

CMD ["node", "server.js"]