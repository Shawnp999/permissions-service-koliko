import dotenv from 'dotenv';

dotenv.config();

export const config = {
    natsUrl: process.env.NATS_URL || 'nats://localhost:4222',
    postgres: {
        user: process.env.PG_USER || 'postgres',
        host: process.env.PG_HOST || 'localhost',
        database: process.env.PG_DATABASE || 'permissions_db',
        password: process.env.PG_PASSWORD || 'password',
        port: parseInt(process.env.PG_PORT || '5432'),
    },
};