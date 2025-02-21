'use strict';

let options = {};
options.tableName = 'Stops';
if (process.env.NODE_ENV === 'production') {
  options.schema = process.env.SCHEMA; // Define schema in production
}

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(options.tableName, {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      post_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Posts', // References the Posts table
          key: 'id'
        },
        onDelete: 'CASCADE' // Delete stops if the post is deleted
      },
      order: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      location: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true // Optional as per note
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    }, options);
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.dropTable(options.tableName);
  }
};