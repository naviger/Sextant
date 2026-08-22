# Development stage
FROM node:20-alpine

WORKDIR /app

# Install dependencies first
COPY package.json package-lock.json* yarn.lock* pnpm-lock.yaml* ./
RUN npm ci || npm install

# Copy application code
COPY . .

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=5 \
  CMD wget --quiet --tries=1 --spider http://localhost:3000/ || exit 1

# Start development server
CMD ["npm", "run", "dev"]
