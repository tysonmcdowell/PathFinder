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
      // Trip 1: West Coast Road Trip (6 stops, driving)
      {
        post_id: 1,
        order: 1,
        name: 'Santa Monica Pier',
        location: 'Santa Monica, CA',
        description: 'Starting the trip with beach vibes and the famous pier.',
        days: 3,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        post_id: 1,
        order: 2,
        name: 'Big Sur',
        location: 'Big Sur, CA',
        description: 'Driving along the scenic Highway 1 with stunning coastal views.',
        days: 2,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        post_id: 1,
        order: 3,
        name: 'San Francisco Golden Gate Bridge',
        location: 'San Francisco, CA',
        description: 'Stopping to see the iconic bridge and explore the city.',
        days: 3,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        post_id: 1,
        order: 4,
        name: 'Humboldt Redwoods State Park',
        location: 'Weott, CA',
        description: 'Driving through giant redwood forests.',
        days: 2,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        post_id: 1,
        order: 5,
        name: 'Crater Lake National Park',
        location: 'Crater Lake, OR',
        description: 'A detour to see the deepest lake in the U.S.',
        days: 3,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        post_id: 1,
        order: 6,
        name: 'Portland',
        location: 'Portland, OR',
        description: 'Ending with food trucks and urban exploration.',
        days: 2,
        created_at: new Date(),
        updated_at: new Date()
      },

      // Trip 2: Rockies Road Trip (5 stops, driving)
      {
        post_id: 2,
        order: 1,
        name: 'Rocky Mountain National Park',
        location: 'Estes Park, CO',
        description: 'Kicking off with a drive through stunning peaks.',
        days: 2,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        post_id: 2,
        order: 2,
        name: 'Boulder',
        location: 'Boulder, CO',
        description: 'Stopping for a scenic drive and some local brews.',
        days: 3,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        post_id: 2,
        order: 3,
        name: 'Aspen',
        location: 'Aspen, CO',
        description: 'Driving to this ski town for mountain views.',
        days: 2,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        post_id: 2,
        order: 4,
        name: 'Telluride',
        location: 'Telluride, CO',
        description: 'A picturesque drive to a historic mining town.',
        days: 3,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        post_id: 2,
        order: 5,
        name: 'Great Sand Dunes National Park',
        location: 'Mosca, CO',
        description: 'Ending with a drive to see massive sand dunes.',
        days: 3,
        created_at: new Date(),
        updated_at: new Date()
      },

      // Trip 3: Cross-State Road Trip (7 stops, driving)
      {
        post_id: 3,
        order: 1,
        name: 'Spokane',
        location: 'Spokane, WA',
        description: 'Starting with a drive through Eastern Washington.',
        days: 2,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        post_id: 3,
        order: 2,
        name: 'Coeur d’Alene',
        location: 'Coeur d’Alene, ID',
        description: 'A quick stop by the lake after a scenic drive.',
        days: 3,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        post_id: 3,
        order: 3,
        name: 'Missoula',
        location: 'Missoula, MT',
        description: 'Driving through Montana for some rural charm.',
        days: 2,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        post_id: 3,
        order: 4,
        name: 'Yellowstone National Park',
        location: 'Yellowstone, WY',
        description: 'A road trip highlight with geysers and wildlife.',
        days: 3,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        post_id: 3,
        order: 5,
        name: 'Grand Teton National Park',
        location: 'Moose, WY',
        description: 'Driving to see dramatic mountain landscapes.',
        days: 2,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        post_id: 3,
        order: 6,
        name: 'Jackson Hole',
        location: 'Jackson, WY',
        description: 'A stop for some cowboy culture after a long drive.',
        days: 2,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        post_id: 3,
        order: 7,
        name: 'Boise',
        location: 'Boise, ID',
        description: 'Ending the trip with a drive to Idaho’s capital.',
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