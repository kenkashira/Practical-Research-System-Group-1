import { defineConfig } from "drizzle-kit";
import { defineConfig } from 'drizzle-kit';
import 'dotenv/config';

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set in .env');
}

export default defineConfig({
  dialect: 'postgresql',
  schema: './shared/schema.ts',  
  out: './drizzle/migrations',
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  verbose: true,
});

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
