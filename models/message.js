'use strict';
const Sequelize = require('sequelize');
const moment = require('moment');

module.exports = (sequelize) => {
    class Message extends Sequelize.Model {
        publishedAt() {
            const date = moment(this.createdAt).format('MMMM D, YYYY, h:mma');
            return date;
        }
    }
    Message.init({
        content: {
            type: Sequelize.STRING,
            validate: {
                notEmpty: {
                    msg: '"Content" is required'
                }
            }
        },
        phoneId: Sequelize.INTEGER,
        deleteAt: Sequelize.DATE
    }, { 
          sequelize,
          paranoid: true,
          timestamps: true
      });

    return Message;
}