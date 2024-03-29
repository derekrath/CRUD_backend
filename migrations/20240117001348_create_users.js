/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('users', table => {
    table.increments('id');
    table.string('first_name', 255);
    table.string('last_name', 255);
    table.string('username', 255).unique().notNullable;
    table.string('hashedPassword', 255).notNullable();
    table.timestamps(true, true);
  })
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('users');
};
// exports.down = function(knex) {
//   return knex.schema
//     .table('items', function(table) {
//       table.dropForeign('user_id');
//     })
//     .then(function() {
//       return knex.schema.dropTableIfExists('users');
//     });
// };

