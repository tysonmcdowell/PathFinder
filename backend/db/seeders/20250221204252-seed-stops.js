// backend/db/seeders/YYYYMMDDHHMMSS-seed-stops.js
'use strict';

const { Stop } = require('../models');

let options = {};
options.tableName = 'Stops';
if (process.env.NODE_ENV === 'production') {
  options.schema = process.env.SCHEMA;
}

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert(options, [
      {
        post_id: 1,
        order: 1,
        name: 'Beach Stop',
        location: '123 Coastal Rd',
        description: 'A scenic stop by the beach.',
        days: null, // Optional: can set to 1 or leave null
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        post_id: 2,
        order: 1,
        name: 'Mountain Peak',
        location: '456 High Trail',
        description: 'Reached the summit!',
        days: null,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        post_id: 3,
        order: 1,
        name: 'City Square',
        location: '789 Urban St',
        description: 'Exploring downtown.',
        days: null,
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    const Op = Sequelize.Op;
    return queryInterface.bulkDelete(options, {
      post_id: { [Op.in]: [1, 2, 3] }
    }, {});
  }
};