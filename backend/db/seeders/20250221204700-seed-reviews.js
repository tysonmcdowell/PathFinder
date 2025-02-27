'use strict';

const { Review } = require('../models');

let options = {};
options.tableName = 'Reviews';
if (process.env.NODE_ENV === 'production') {
  options.schema = process.env.SCHEMA;
}

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert(options, [
      {
        post_id: 1,
        user_id: 2, 
        rating: 4,
        reviews: 'Great coastal trip plan, excited to see it happen!',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        post_id: 2, 
        user_id: 3, 
        rating: 5,
        reviews: 'Amazing hike, highly recommend this route.',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        post_id: 3, 
        user_id: 1, 
        rating: 3,
        reviews: 'City tour was decent, but could use more stops.',
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