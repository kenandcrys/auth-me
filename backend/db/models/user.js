'use strict';
const { Model} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    toSafeObject() {
      const { id, firstName, lastName, email, username } = this;
      return { id, firstName, lastName, email, username };
    }
    static associate(models) {
      this.hasMany(models.Spot, { foreignKey: 'ownerId', as: 'spots' });
      this.hasMany(models.Booking, { foreignKey: 'userId', as: 'bookings' });
      this.hasMany(models.Review, { foreignKey: 'userId', as: 'reviews' });
    }
  };

  User.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      username: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          len: [2, 30],
          notEmpty: true,
          // isNotEmail(value) {
          //   if (Validator.isEmail(value)) {
          //     throw new Error("Cannot be an email.");
          //   }
          // }
        }
      },
      firstName: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          len: [2, 60],
          is: ["^[a-z]+$",'i'], //only allows letters
          notEmpty: {
            args: true,
            msg: 'First Name cannot be empty or contain only whitespace'
          }
        }
      },
      lastName: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          len: [2, 60],
          is: ["^[a-z]+$",'i'], //only allows letters
          notEmpty: {
            args: true,
            msg: 'Last Name cannot be empty or contain only whitespace'
          }
        }
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          len: [3, 256],
          isEmail: true,
          notEmpty: true,
        }
      },
      hashedPassword: {
        type: DataTypes.STRING.BINARY,
        allowNull: false,
        validate: {
          len: [60, 60],
          notEmpty: true,
        }
      },
    },
    {
      sequelize,
      modelName: 'User',
      defaultScope: {
        attributes: {
          exclude: ['hashedPassword', 'createdAt', 'updatedAt']
        }
      },
      scopes: {
        withFullName: {
          attributes: ['id', 'firstName', 'lastName', 'email', 'username']
        }
      }
    }
  );
  return User;
};
