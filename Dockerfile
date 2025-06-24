FROM node:18-alpine

WORKDIR /app

# install dependencies
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

CMD ["npm", "start"]