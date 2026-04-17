FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx vite build
RUN npm install -g serve@14
EXPOSE 4173
CMD ["serve", "-s", "dist", "-l", "4173"]
