# ---- Base build stage ----
    FROM node:20-alpine AS builder

    WORKDIR /app
    
    # Copy package files
    COPY package*.json ./
    
    # Install dependencies
    RUN npm install
    
    # Copy source code
    COPY . .
    
    # ---- Production stage ----
    FROM node:20-alpine AS production
    
    WORKDIR /app
    
    # Copy only necessary files from builder
    COPY --from=builder /app/package*.json ./
    COPY --from=builder /app/node_modules ./node_modules
    COPY --from=builder /app ./
    
    # Expose application port
    EXPOSE 3000
    
    # Run the app
    CMD ["node", "server.js"]