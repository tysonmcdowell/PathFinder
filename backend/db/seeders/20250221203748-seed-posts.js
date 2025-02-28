'use strict';

const { Post } = require('../models');

let options = {};
options.tableName = 'Posts';
if (process.env.NODE_ENV === 'production') {
  options.schema = process.env.SCHEMA;
}

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert(options, [
      {
        owner_id: 1,
        body: 'Planning a road trip across the West Coast!',
        status: 'planned',
        trip_length: 15, // Sum of days: 3 + 2 + 3 + 2 + 3 + 2 = 15
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        owner_id: 2,
        body: 'Just finished a driving adventure through the Rockies.',
        status: 'completed',
        trip_length: 13, // Sum of days: 2 + 3 + 2 + 3 + 3 = 13
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        owner_id: 3,
        body: 'Currently on a cross-state road trip.',
        status: 'in_progress',
        trip_length: 16, // Sum of days: 2 + 3 + 2 + 3 + 2 + 2 + 2 = 16
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    const Op = Sequelize.Op;
    return queryInterface.bulkDelete(options, {
      owner_id: { [Op.in]: [1, 2, 3] }
    }, {});
  }
};