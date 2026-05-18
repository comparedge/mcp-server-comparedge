FROM node:18-alpine
WORKDIR /app
COPY . .
# CMD is provided by Glama via cmdArguments in glama.json
