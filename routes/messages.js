const express = require('express');
const router = express.Router();
const moment = require('moment');
const { Op } = require('sequelize');
const { Message, Phone } = require('../models');
const {
        asyncHandler, 
        getUser, 
        getPhone, 
        deleteOutdatedMessages,
        replaceLineBreaks
      } = require('../bin/helpers');



// GET messages listing (with optional search)
router.get('/', asyncHandler(async (req, res) => {
  await deleteOutdatedMessages();
  let query;
  if (req.body.query) { //if search query is present
    const messages = await Message.findAll({
      order: [["createdAt", "DESC"]],
      include: Phone,
      where: {
        content: {
          [Op.like]: query
        }
      }
    });
  } else {
    const messages = await Message.findAll({
      order: [["createdAt", "DESC"]],
      include: Phone,
    });
  }

  // if no messages found
  if (!messages) {
    res.json({
      messages: null,
      user: res.locals.user
    })
  }
  

  // replace line break characters
  messages.forEach(message => {
    message.content = replaceLineBreaks(message.content)
  });

  res.json({
    messages,
    user: res.locals.user
  });
}))

/* POST create message. */
router.post('/', asyncHandler(async (req, res) => {
  const user = res.locals.user;
  if (user.adminPermissions) {
    let message;
    let date = req.body.time.split('.');
    let deleteAt;
    if (date === null) {
      deleteAt = null; 
    } else {
      deleteAt = moment().add(date[0], date[1]).endOf('day').toString();
    }
    
    try {
      messageObject = {
        content: req.body.content,
        author: req.body.author,
        deleteAt
      }

      message = await Message.create(messageObject);
      res.status(204).end();

    } catch (error) {
      if (error.name === "SequelizeValidationError") {
        res.status(400).json({message: "SequelizeValidationError"});
      } else {
        throw error; //error caught in the asyncHandler's catch block
      }
    }
  } else {
    res.status(401).end(); //unauthorized
  }
}));

// POST a message by SMS
router.post('/sms', asyncHandler( async (req, res) => {
  // Example of SMS POST request
    // [Object: null prototype] {
    //   ToCountry: 'US',
    //   ToState: 'WA',
    //   SmsMessageSid: 'SM9e8a82921251b5f955d47f2696c08bd4',
    //   NumMedia: '0',
    //   ToCity: 'SEATTLE',
    //   FromZip: '13904',
    //   SmsSid: 'SM9e8a82921251b5f955d47f2696c08bd4',
    //   FromState: 'NY',
    //   SmsStatus: 'received',
    //   FromCity: 'BINGHAMTON',
    //   Body: 'Hi',
    //   FromCountry: 'US',
    //   To: '+12064660257',
    //   ToZip: '98154',
    //   NumSegments: '1',
    //   MessageSid: 'SM9e8a82921251b5f955d47f2696c08bd4',
    //   AccountSid: 'ACe19bd49157b65c8babd9ad0becb58cdc',
    //   From: '+16072329039',
    //   ApiVersion: '2010-04-01'
    // }
  const content = req.body.Body;
  const phone = req.body.From;
  const author = await getPhone(phone);
  const deleteAt = moment().add(2, 'days').format();
  console.log('phone: ', phone)
  console.log('author: ', author);
  console.log('deleteAt: ', deleteAt);
  if (author) {
    const message = await Message.create({
      content,
      author,
      deleteAt
    });
    res.status(200).send('Message added to the database');
  }
}));

/* Delete individual message. */
router.delete('/:id', asyncHandler(async (req, res) => {
  if (res.locals.user.adminPermissions) {
    const message = await Message.findByPk(req.params.id);
    if (message) {
      await message.destroy();
      res.status(204).end();
    } else { //message does not exist
      res.sendStatus(404);
    }
  } else { //no admin permissions
    res.json(401).end();
  }
}));




module.exports = router;