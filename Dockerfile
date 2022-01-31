# this is an answer file for the Assignment
# move it up a directory for it to work
FROM node:16-alpine

EXPOSE 3000

WORKDIR /src/node_container

COPY package*.json ./

# This requires a package.json to exist
RUN npm install && npm cache clean --force

# Put everything from local into WORKDIR
COPY . .

CMD ["node", "js/server.js"]
