'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const options = {
    };

    if (process.env.NODE_ENV === 'production') {
      options.schema = process.env.SCHEMA; // Define your schema in options object
    }

    await queryInterface.createTable("Bookings", {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      spotId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Spots',
          key: 'id',
        },
      },
      userId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Users',
          key: 'id',
        },
      },
      startDate: {
        type: Sequelize.STRING,
      },
      endDate: {
        type: Sequelize.STRING,
      },
      createdAt: {
        type: Sequelize.DATE,
      },
      updatedAt: {
        type: Sequelize.DATE,
      },
    }, options);
  },

  down: async (queryInterface, Sequelize) => {
    const options = {
      tableName: 'Bookings',
    };

    await queryInterface.dropTable(options);
  },
};
