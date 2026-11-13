FROM node:22-slim

WORKDIR /app

# Install all dependencies because the TypeScript runtime (tsx) is used by the server start command.
COPY package.json ./
RUN npm install

COPY . .

# Build the Vite frontend. Cloud Run serves these files from dist/.
RUN npm run build

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

CMD ["npm", "start"]
