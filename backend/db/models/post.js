'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Post extends Model {
    static associate(models) {
      // Post belongs to User
      Post.belongsTo(models.User, {
        foreignKey: 'ownerId',
        as: 'owner'
      });
      // Post has many Stops
      Post.hasMany(models.Stop, {
        foreignKey: 'post_id',
        as: 'stops'
      });
      // Post has many Reviews
      Post.hasMany(models.Review, {
        foreignKey: 'post_id',
        as: 'reviews'
      });
    }
  }

  Post.init({
    ownerId: {
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