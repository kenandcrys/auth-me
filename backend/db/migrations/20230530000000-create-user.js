"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const options = {
      
    };

    if (process.env.NODE_ENV === "production") {
      options.schema = process.env.SCHEMA; // Define your schema in options object
    }

    await queryInterface.createTable("Users", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      firstName: {
        type: Sequelize.STRING,
        allowNull: false,
        validate: {
          len: [1, 60], // Updated the length validation
        },
      },
      lastName: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      username: {
        type: Sequelize.STRING(30),
        allowNull: false,
        unique: true,
      },
      email: {
        type: Sequelize.STRING(256),
        allowNull: false,
        unique: true,
      },
      hashedPassword: {
        type: Sequelize.STRING.BINARY,
        allowNull: false,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    }, options);
  },

  down: async (queryInterface, Sequelize) => {
    const options = {
      tableName: "Users",
    };

    await queryInterface.dropTable("Users", options);
  },
};
