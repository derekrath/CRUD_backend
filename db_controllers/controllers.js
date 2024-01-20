const knex = require('./dbConnection');

// function getHashedPassword(username){
//     return knex.select('hashedPassword')
//     .from('users')
//     .where({ username })
//     .then( result => {
//         if (result.length < 1) {
//             return undefined
//         } else {
//             return result[0].hashedPassword
//         }
//     })
// }
function getUserByUsername(username){
    return knex('users')
    .where({ username })
    .first()
    .then( result => {
        if (!result) {
            return null; // in case user not found
        }
        return result;
    });
}

function createUser(username, hashedPassword){
    return knex('users')
    .where({ username })
    .then( result => {
        if (result.length > 0) {
        //     return []
        // if (result) {
            throw new Error('User already exists')
        } else {
            return knex('users')
            .insert( { username, hashedPassword })
            .returning(['id', 'username'])
        }
    })
    .catch( err => {
        throw new Error(err)
    })
}

module.exports = { getUserByUsername, createUser }