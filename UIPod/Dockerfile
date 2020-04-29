FROM node:13.13.0-alpine
# Create app directory
WORKDIR /usr/src/client
# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./
#ENV QUESTIONAIREPOD_URL=http://35.224.3.25:8002 FACEBOX_URL=http://34.68.46.217:8080
RUN npm install
# Bundle app source
COPY . .
EXPOSE 8001
CMD ["node", "index.js"]