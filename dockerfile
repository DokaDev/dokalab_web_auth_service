FROM node:22.17.1-alpine

WORKDIR /usr/src/app

# Copy package files and prisma schema
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci --only=production

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY . .

# Build the application
# install nestjs
RUN npm install -g @nestjs/cli
RUN npm run build

# Run prisma migrate deploy and start production server
CMD npx prisma migrate deploy && npm run start:prod

EXPOSE 3000