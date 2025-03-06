FROM node:22-alpine


WORKDIR /app
RUN chown -R node:node /app

# Switch to the non-root user
USER node

# Copy package files first for better caching
COPY --chown=node:node package.json package-lock.json* ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY --chown=node:node . .

# Expose the port the app runs on
EXPOSE 5173

# Command to run the app with host set to 0.0.0.0 to allow external connections
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
