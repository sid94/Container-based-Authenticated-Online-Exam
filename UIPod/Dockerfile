FROM ubuntu:16.04

COPY index.js package-lock.json package.json UI.html ./

# Install Node.js
RUN apt-get install --yes curl
RUN curl --silent --location https://deb.nodesource.com/setup_12.x | sudo -E bash -
RUN apt-get install --yes nodejs
RUN apt-get install --yes build-essential

RUN npm install

CMD [ "node", "index.js" ]