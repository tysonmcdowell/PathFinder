'use strict';

let options = {};
options.tableName = 'Reviews';
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
        onDelete: 'CASCADE' // Delete reviews if the post is deleted
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users', // References the Users table
          key: 'id'
        },
        onDelete: 'CASCADE' // Delete reviews if the user is deleted
      },
      rating: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      reviews: {
        type: Sequelize.TEXT,
        allowNull: false
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