FROM node:16.15.1-alpine
COPY . /app

WORKDIR /app

RUN npm install

CMD ["npm", "start"]