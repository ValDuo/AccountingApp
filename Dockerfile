FROM node:16

WORKDIR /app

COPY package*.json ./

RUN npm install -g react-scripts

COPY . .

EXPOSE 3000

ENTRYPOINT ["npm", "start", "--", "--host=0.0.0.0", "--port=3000"]
