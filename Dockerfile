FROM node:latest

WORKDIR /server

COPY . .

RUN rm -f node_modules

# RUN npm install

RUN npm install -g nodemon

ENV PORT=8080

EXPOSE  ${PORT}

CMD ["npm", "run", "start"]