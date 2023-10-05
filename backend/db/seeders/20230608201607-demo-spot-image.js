'use strict';

let options = {};
if (process.env.NODE_ENV === 'production') {
  options.schema = process.env.SCHEMA;  // define your schema in options object
}

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    options.tableName = "SpotImages";
    return queryInterface.bulkInsert(options, [
    {
      spotId: 1,
      url: 'http://placekitten.com/200/300',
      preview: true
    },
    {
      spotId: 1,
      url: 'https://www.google.com/',
      preview: false
    },
    {
      spotId: 2,
      url: 'http://placekitten.com/200/300',
      preview: true
    },
    {
      spotId: 3,
      url: 'https://www.twitter.com/',
      preview: true
    }
  ], {});
  },

  down: async (queryInterface, Sequelize) => {
    options.tableName = "SpotImages";
    return queryInterface.bulkDelete(options, null, {});
  }
};
