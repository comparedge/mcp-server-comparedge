FROM node:26.1.0-alpine
WORKDIR /app
COPY . .
# CMD is provided by Glama via cmdArguments in glama.json
