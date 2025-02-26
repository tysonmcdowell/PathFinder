// backend/db/models/stop.js
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Stop extends Model {
    static associate(models) {
      Stop.belongsTo(models.Post, {
        foreignKey: 'post_id',
        as: 'post'
      });
    }
  }

  Stop.init({
    post_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Posts',
        key: 'id'
      }
    },
    order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        isInt: { msg: 'Order must be an integer' },
        min: { args: [1], msg: 'Order must be at least 1' }
      }
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Stop name cannot be empty' },
        len: [1, 100]
      }
    },
    location: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Location cannot be empty' },
        len: [1, 255]
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    days: { // New field
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        isInt: { msg: 'Days must be an integer' },
        min: { args: [1], msg: 'Days must be at least 1' }
      }
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'Stop',
    tableName: 'Stops',
    underscored: true
  });

  return Stop;
};