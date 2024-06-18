FROM node:14-alpine3.11
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ENTRYPOINT ["node", "src/app.js"]
