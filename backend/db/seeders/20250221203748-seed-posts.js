// backend/db/seeders/YYYYMMDDHHMMSS-seed-posts.js
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
        owner_id: 1, // Changed to owner_id
        body: 'Planning a road trip across the coast!',
        status: 'planned',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        owner_id: 2, // Changed to owner_id
        body: 'Just finished a hiking adventure in the mountains.',
        status: 'completed',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        owner_id: 3, // Changed to owner_id
        body: 'Currently exploring the city sights.',
        status: 'in_progress',
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    const Op = Sequelize.Op;
    return queryInterface.bulkDelete(options, {
      owner_id: { [Op.in]: [1, 2, 3] } // Changed to owner_id
    }, {});
  }
};