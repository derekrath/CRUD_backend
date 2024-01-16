require('dotenv').config();
const connectionString = process.env.DATABASE_URL; //hosting service should use DATABASE_URL environment variable. Double check before production.
console.log('connectionString:', connectionString, 'env environment', process.env.NODE_ENV); //should show the production or dev environment variables

module.exports = {
    development: {

    },

    staging: {

    },

    production: {

    }
}