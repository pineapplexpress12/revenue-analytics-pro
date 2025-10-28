import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Get database URL from environment variables
const connectionString = 
  process.env.POSTGRES_URL || 
  process.env.DATABASE_URL;

// Check if connection string is defined
if (!connectionString) {
  throw new Error("POSTGRES_URL or DATABASE_URL environment variable is not defined");
}

// For query purposes - use pooled connection for better performance
const queryClient = postgres(connectionString);

// Initialize Drizzle with schema
export const db = drizzle(queryClient, { schema });

// Export schema for convenience
export { schema };

// Export types for TypeScript
export type Database = typeof db;

