'use strict';

const moment = require('moment');

const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Spot extends Model {
    static associate(models) {
      this.belongsTo(models.User, { foreignKey: 'ownerId', as: 'Owner' });
      this.hasMany(models.SpotImage, { foreignKey: 'spotId', as: 'SpotImages', onDelete: 'CASCADE', hooks: true });
      this.hasMany(models.Review, { foreignKey: 'spotId', as: 'reviews', onDelete: 'CASCADE', hooks: true });
      this.hasMany(models.Booking, { foreignKey: 'spotId', as: 'bookings', onDelete: 'CASCADE', hooks: true });
    }
  }
  Spot.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      ownerId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      address: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      city: {
        type: DataTypes.STRING,
        validate: {
          notEmpty: true,
        },
      },
      state: {
        type: DataTypes.STRING,
        validate: {
          notEmpty: true,
        },
      },
      country: {
        type: DataTypes.STRING,
        validate: {
          notEmpty: true,
        },
      },
      lat: {
        type: DataTypes.DECIMAL,
        validate: {
          isDecimal: true,
          min: -90,
          max: 90,
        },
        get() {
          return parseFloat(this.getDataValue('lat'));
      }
      },
      lng: {
        type: DataTypes.DECIMAL,
        validate: {
          isDecimal: true,
          min: -180,
          max: 180,
        },
        get() {
          return parseFloat(this.getDataValue('lng'));
      }
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          len: [2, 50],
          notEmpty: true,
        },
      },
      description: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      price: {
        type: DataTypes.DECIMAL,
        allowNull: false,
        validate: {
          min: 0,
        },
        get() {
          return parseFloat(this.getDataValue('price'));
      }
      },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        get() {
          return moment(this.getDataValue('createdAt')).format('YYYY-MM-DD HH:mm:ss');
        },
      },
      updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        get() {
          return moment(this.getDataValue('updatedAt')).format('YYYY-MM-DD HH:mm:ss');
        },
      },
      avgRating: {
        type: DataTypes.DECIMAL,
        defaultValue: 0,
        get() {
          const value = this.getDataValue('avgRating');
          if (typeof value !== 'number' || isNaN(value)) {
            return 0;
          }
          return parseFloat(value.toFixed(1));
        },
        validate: {
          min: 0,
          max: 5,
        },
      },
      previewImage: {
        type: DataTypes.STRING,
        get() {
          const value = this.getDataValue('previewImage');
          return value ? value : 'image url';
        },
      },
      numReviews: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        validate: {
          min: 0,
        },
      },
    },
    {
      sequelize,
      modelName: 'Spot',
    }
  );
  return Spot;
};
