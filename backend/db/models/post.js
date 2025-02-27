// backend/db/models/post.js
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Post extends Model {
    static associate(models) {
      Post.belongsTo(models.User, {
        foreignKey: 'owner_id',
        as: 'owner'
      });
      Post.hasMany(models.Stop, {
        foreignKey: 'post_id',
        as: 'stops'
      });
      Post.hasMany(models.Review, {
        foreignKey: 'post_id',
        as: 'reviews'
      });
    }
  }

  Post.init({
    owner_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    body: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Post content cannot be empty' }
      }
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: {
          args: [['planned', 'completed', 'in_progress']],
          msg: 'Status must be one of: planned, completed, in_progress'
        }
      }
    },
    trip_length: { // Added field
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        isInt: { msg: 'Trip length must be an integer' },
        min: { args: [1], msg: 'Trip length must be at least 1' }
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
    modelName: 'Post',
    tableName: 'Posts',
    underscored: true,
    defaultScope: {
      attributes: {
        exclude: ['updated_at']
      }
    }
  });

  return Post;
};