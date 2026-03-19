# ---- Base build stage ----
    FROM node:20-alpine AS builder

    # Set working directory
    WORKDIR /app
    
    # Copy package files
    COPY package*.json ./
    
    # Install dependencies (including dev)
    RUN npm install
    
    # Copy source code
    COPY . .
    
    # Build the application (if you have a build step, e.g. TypeScript or React)
    RUN npm run build
    
    # ---- Production stage ----
    FROM node:20-alpine AS production
    
    # Set working directory
    WORKDIR /app
    
    # Copy only necessary files from builder
    COPY --from=builder /app/package*.json ./
    COPY --from=builder /app/node_modules ./node_modules
    COPY --from=builder /app/dist ./dist
    
    # Expose application port
    EXPOSE 3000
    
    # Run the app
    CMD ["node", "dist/index.js"]