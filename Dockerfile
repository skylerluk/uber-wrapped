# Builds and runs the Express API (Code lives in ./server).
# Railway auto-detects this Dockerfile at the repo root — no Root Directory needed.
# Vercel ignores it and builds the Vite frontend from the repo root.
FROM node:22-slim
WORKDIR /app

# Install server deps (tsx is a runtime dependency, so --omit=dev is fine).
COPY server/package.json server/package-lock.json ./
RUN npm ci --omit=dev

# Copy the server source.
COPY server/ ./

ENV NODE_ENV=production
# Railway provides PORT; the server falls back to 8080 locally.
EXPOSE 8080
CMD ["npm", "start"]
