/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = function(knex) {
  // Deletes ALL existing entries
  return knex('users').del()
  .then(function () {
    return knex('users').insert([
      {username: 'John', passwordHash: '$2a$12$h.RYShF4Vd16s3nu84xG4OeYwkd8Vjk5/RCRau6f8KlzmAzpWK1FG'}
    ])
  })
};
