FROM node:18-alpine

# Install NATS CLI for bucket creation
RUN wget https://github.com/nats-io/natscli/releases/download/v0.1.4/nats-0.1.4-linux-amd64.zip && \
    unzip nats-0.1.4-linux-amd64.zip && \
    mv nats-0.1.4-linux-amd64/nats /usr/local/bin/ && \
    rm -rf nats-0.1.4-linux-amd64*

# Install PostgreSQL client for DB initialization
RUN apk add --no-cache postgresql-client

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

# Create startup script
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'echo "Waiting for services..."' >> /app/start.sh && \
    echo 'sleep 5' >> /app/start.sh && \
    echo 'echo "Initializing database..."' >> /app/start.sh && \
    echo 'PGPASSWORD=$PG_PASSWORD psql -h $PG_HOST -U $PG_USER -d $PG_DATABASE -f /app/sql/init.sql || true' >> /app/start.sh && \
    echo 'echo "Creating KV bucket..."' >> /app/start.sh && \
    echo 'nats kv add permissions_cache --server=$NATS_URL || true' >> /app/start.sh && \
    echo 'echo "Starting service..."' >> /app/start.sh && \
    echo 'npm start' >> /app/start.sh && \
    chmod +x /app/start.sh

EXPOSE 4222

CMD ["/app/start.sh"]