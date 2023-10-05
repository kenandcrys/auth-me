'use strict';

const moment = require('moment');

const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Review extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      this.belongsTo(models.Spot, { foreignKey: 'spotId', as: 'Spot' });
      this.hasMany(models.ReviewImage, { foreignKey: 'reviewId', as: 'ReviewImages', onDelete: 'CASCADE' });
      this.belongsTo(models.User, { foreignKey: 'userId', as: 'User' });
    }
  }
  Review.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'User',
        key: 'id',
      },
    },
    spotId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Spot',
        key: 'id',
      },
    },
    review: {
      type: DataTypes.STRING,
      validate: {
        notEmpty: true,
      },
    },
    stars: {
      type: DataTypes.INTEGER,
      validate: {
        min: 1,
        max: 5,
      },
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      get() {
        const value = this.getDataValue('createdAt');
        return value ? moment(value).format('YYYY-MM-DD HH:mm:ss') : moment().format('YYYY-MM-DD HH:mm:ss');
      },
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      get() {
        const value = this.getDataValue('updatedAt');
        return value ? moment(value).format('YYYY-MM-DD HH:mm:ss') : moment().format('YYYY-MM-DD HH:mm:ss');
      },
    },
  },
  {
    sequelize,
    modelName: 'Review',
  });
  return Review;
};
