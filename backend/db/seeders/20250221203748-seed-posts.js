'use strict';

const { Post } = require('../models');

let options = {};
options.tableName = 'Posts';
if (process.env.NODE_ENV === 'production') {
  options.schema = process.env.SCHEMA;
}

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert(options.tableName, [
      {
        ownerId: 1,
        body: 'Planning a road trip across the coast!',
        status: 'planned',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        ownerId: 2,
        body: 'Just finished a hiking adventure in the mountains.',
        status: 'completed',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        ownerId: 3,
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
      ownerId: { [Op.in]: [1, 2, 3] }
    }, {});
  }
};