'use strict';

const { Review } = require('../models');

let options = {};
options.tableName = 'Reviews';
if (process.env.NODE_ENV === 'production') {
  options.schema = process.env.SCHEMA;
}

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert(options.tableName, [
      {
        post_id: 1, // Demo-lition's post
        user_id: 2, // FakeUser1 reviewing
        rating: 4,
        reviews: 'Great coastal trip plan, excited to see it happen!',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        post_id: 2, // FakeUser1's post
        user_id: 3, // FakeUser2 reviewing
        rating: 5,
        reviews: 'Amazing hike, highly recommend this route.',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        post_id: 3, // FakeUser2's post
        user_id: 1, // Demo-lition reviewing
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