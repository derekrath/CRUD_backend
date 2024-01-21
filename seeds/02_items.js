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
        { user_id: 1, name: 'Item1', description: 'Really cool description for User 1 Item 1', quantity: 10 },
        { user_id: 1, name: 'Item2', description: 'Really cool description for User 1 Item 2', quantity: 10 },
        { user_id: 1, name: 'Item3', description: 'Really cool description for User 1 Item 3', quantity: 10 },
      ]);
    });
};
