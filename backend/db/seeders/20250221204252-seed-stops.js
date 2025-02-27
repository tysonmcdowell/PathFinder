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
        name: 'Santa Monica Pier',
        location: 'Santa Monica, CA',
        description: 'Enjoying the beach and the famous pier.',
        days: 3,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        post_id: 1,
        order: 2,
        name: 'San Diego Zoo',
        location: 'San Diego, CA',
        description: 'Exploring one of the best zoos in the country.',
        days: 4, 
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        post_id: 2,
        order: 1,
        name: 'Rocky Mountain National Park',
        location: 'Estes Park, CO',
        description: 'Hiking to a stunning mountain peak.',
        days: 2,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        post_id: 2,
        order: 2,
        name: 'Great Sand Dunes National Park',
        location: 'Mosca, CO',
        description: 'Camping among towering sand dunes.',
        days: 3,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        post_id: 3,
        order: 1,
        name: 'Museum  of Illusions',
        location: 'Seattle, WA',
        description: 'Checking out the historic downtown area.',
        days: 1,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        post_id: 3,
        order: 2,
        name: 'Pike Place Market',
        location: 'Seattle, WA',
        description: 'Visiting the famous market and local artisans.',
        days: 2, 
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