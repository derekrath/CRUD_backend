/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = function (knex) {
  // Deletes ALL existing entries
  return knex('items')
    .del()
    .then(function () {
      return knex('items').insert([
        { user_id: 1, name: 'Item1', description: 'Really cool description for Item 1', quantity: 10 },
        { user_id: 1, name: 'Item1', description: 'Really cool description for Item 1', quantity: 10 },
        { user_id: 1, name: 'Item1', description: 'Really cool description for Item 1', quantity: 10 },
      ]);
    });
};
