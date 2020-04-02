'use strict';
const Sequelize = require('sequelize');

module.exports = (sequelize) => {
  class User extends Sequelize.Model { }
  User.init({
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    authorId: Sequelize.INTEGER,
    username: {
      type: Sequelize.STRING,
      validate: {
        notEmpty: {
          msg: "'Username' is required"
        }
      }
    },
    password: {
      type: Sequelize.STRING,
      validate: {
        notEmpty: {
          msg: "'Password' is required"
        }
      }
    },
    fullname: {
      type: Sequelize.STRING,
      validate: {
        notEmpty: {
          msg: "'Name' is required"
        }
      }
    },
    adminPermissions: Sequelize.BOOLEAN,
  }, { sequelize });

  return User;
}