require("dotenv").config();
const connectionString = process.env.DATABASE_URL; //hosting service should use DATABASE_URL environment variable. Double check before production.
console.log(
  "connectionString:",
  connectionString,
  "env environment",
  process.env.NODE_ENV
); //should show the production or dev environment variables

module.exports = {
  development: {
    client: "pg",
    connection: connectionString, //might need to remove reject unauthorized ssl if connection doesnt work
    migrations: {
      directory: "./migrations",
    },
    seeds: {
      directory: "./seeds",
    },
  },

  staging: {
    client: "pg",
    connection: connectionString, //might need to remove reject unauthorized ssl if connection doesnt work
    migrations: {
      directory: "./migrations",
    },
    seeds: {
      directory: "./seeds",
    },
  },

  production: {
    client: "pg",
    connection: { connectionString, ssl: { rejectUnauthorized: false, }, },
    migrations: {
      directory: "./migrations",
    },
    seeds: {
      directory: "./seeds",
    },
  },
};
