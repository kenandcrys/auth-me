'use strict';


let options = {};
if (process.env.NODE_ENV === 'production') {
  options.schema = process.env.SCHEMA;  // define your schema in options object
}

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    options.tableName = "Reviews";
    return queryInterface.bulkInsert(options, [
      {
        userId: 1,
        spotId: 1,
        review: 'This spot is amazing!',
        stars: 5,
      },
      {
        userId: 2,
        spotId: 1,
        review: 'Great experience at this spot.',
        stars: 4,
      },
      {
        userId: 1,
        spotId: 2,
        review: 'The spot was okay, nothing special.',
        stars: 3,
      },
      {
        userId: 3,
        spotId: 3,
        review: 'I highly recommend this spot!',
        stars: 5,
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    options.tableName = "Reviews";
    return queryInterface.bulkDelete(options, null, {});
  }
};
