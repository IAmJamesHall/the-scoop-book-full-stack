'use strict';
const Sequelize = require('sequelize');

module.exports = (sequelize) => {
  class Phone extends Sequelize.Model {}
  Phone.init({
    name: {
      type: Sequelize.STRING,
      validate: {
        notEmpty: {
          msg: "'Name' is required"
        }
      }
    },
    phone: {
      type: Sequelize.STRING,
      validate: {
        notEmpty: {
          msg: "'Phone #' is required"
        }
      }
    }
  }, { sequelize });

  return Phone;
}