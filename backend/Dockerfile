FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# We do not hardcode ENV here. We inject them at runtime.
EXPOSE 3000
CMD ["node", "server.js"]