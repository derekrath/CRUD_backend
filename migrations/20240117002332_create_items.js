/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema.createTable('items', table => {
      table.increments('id');
      table.integer('user_id').unsigned().references('id').inTable('users');
      table.string('name', 255).notNullable();
      table.text('description');
      table.integer('quantity').unsigned().notNullable();
      table.timestamps(true, true);
    })
  };
  
  /**
   * @param { import("knex").Knex } knex
   * @returns { Promise<void> }
   */
  exports.down = function(knex) {
    return knex.schema.dropTable('items');
  };
  