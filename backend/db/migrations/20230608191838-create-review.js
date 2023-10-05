'use strict';

let options = {};
if (process.env.NODE_ENV === 'production') {
  options.schema = process.env.SCHEMA;  // define your schema in options object
}

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("Reviews", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      userId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Users',
          key: 'id'
        }
      },
      spotId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Spots',
          key: 'id'
        }
      },
      review: {
        type: Sequelize.TEXT
      },
      stars: {
        type: Sequelize.INTEGER
      },
      createdAt: {
        type: Sequelize.DATE
      },
      updatedAt: {
        type: Sequelize.DATE
      }
    }, options);




  },
  down: async (queryInterface, Sequelize) => {
    options.tableName = "Reviews"
    await queryInterface.dropTable(options);
  }
};
