FROM node:carbon

# Create app directory
WORKDIR /app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

# RUN npm install
# If you are building your code for production
RUN npm install --only=production

# Bundle app source
COPY . .

#代码bug,生产环境找config路径不对
COPY config /config

# Define environment variable
ENV NODE_ENV development

EXPOSE 3000
CMD [ "npm", "start" ]