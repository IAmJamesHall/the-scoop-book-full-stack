const express = require('express');
const router = express.Router();
const moment = require('moment');
const { Message} = require('../models');
const {
        asyncHandler, 
        getUser, 
        getPhone, 
        deleteOutdatedMessages,
        replaceLineBreaks
      } = require('../bin/helpers');




/* GET messages listing. */
router.get('/', asyncHandler(async (req, res) => {
  await deleteOutdatedMessages();
  const user = await getUser(req);
  let fullName;
  if (user.loggedIn) {
    fullName = user.username; // TODO: replace with fullname
    const messages = await Message.findAll({ order: [["createdAt", "DESC"]] });
    messages.forEach((message) => {
      message.content = replaceLineBreaks(message.content);
    })
    console.log(messages);

    res.render("messages/index", { messages, title: "The Scoop Book", fullName, user });
  } else {
    res.redirect('/auth/login');
  }

}));

/* Create a new message form. */
router.get('/new', async (req, res) => {
  const user = await getUser(req);
  if (user.adminPermissions) {
    res.render("messages/new", { message: {}, title: "New Message", loggedIn: user.loggedIn });
  } else {
    res.redirect('/messages');
  }

});

/* POST create message. */
router.post('/', asyncHandler(async (req, res) => {
  const user = await getUser(req);
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
      res.redirect("/messages");
    } catch (error) {
      if (error.name === "SequelizeValidationError") {
        message = await Message.build(messageObject);
        res.render("messages/new", { message, errors: error.errors, title: "New Message", loggedIn })
      } else {
        throw error; //error caught in the asyncHandler's catch block
      }
    }
  } else {
    res.redirect('/messages');
  }
}));



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

// POST a message by SMS
router.post('/sms', asyncHandler( async (req, res) => {
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


// /* Edit message form. */
// router.get("/:id/edit", asyncHandler(async (req, res) => {
//   const loggedIn = await checkForLoggedInState(req);
//   if (loggedIn) {
//     const message = await Message.findByPk(req.params.id);
//     if (message) {
//       res.render("messages/edit", { message, title: "Edit message", loggedIn });
//     } else {
//       res.sendStatus(404);
//     }
//   } else {
//     res.redirect('/messages');
//   }
// }));


// /* GET individual message. */
// router.get("/:id", asyncHandler(async (req, res) => {
//   const loggedIn = await checkForLoggedInState(req);
//   const message = await Message.findByPk(req.params.id);
//   if (message) {
//     res.render("messages/show", { message, title: message.title, loggedIn});
//   } else {
//     res.sendStatus(404);
//   }
// }));

/* Update an message. */
router.post('/:id/edit', asyncHandler(async (req, res) => {
  const user = await getUser(req);
  if (user.adminPermissions) {
    let message;
    try {
      message = await Message.findByPk(req.params.id);
      if (message) {
        await message.update(req.body);
        res.redirect("/messages/" + message.id);
      } else {
        res.sendStatus(404);
      }
    } catch (error) {
      if (error.name === "SequelizeValidationError") {
        message = await Message.build(req.body);
        message.id = req.params.id; //make sure correct message gets id
        res.render("messages/edit", { message, errors: error.errors, title: "Edit message" });
      } else {
        throw error;
      }
    }
    if (message) {
      await message.update(req.body);
      res.redirect("/messages/" + message.id);
    } else {
      res.sendStatus(404);
    }
  } else {
    res.redirect('/messages');
  }
}));

/* Delete message form. */
router.get("/:id/delete", asyncHandler(async (req, res) => {
  const loggedIn = await getUser(req);
  if (loggedIn) {
    const message = await Message.findByPk(req.params.id);
    if (message) {
      res.render("messages/delete", { message, title: "Delete message" });
    } else {
      res.sendStatus(404);
    }
  } else {
    res.redirect('/messages');
  }
}));

/* Delete individual message. */
router.post('/:id/delete', asyncHandler(async (req, res) => {
  const loggedIn = await getUser(req);
  if (loggedIn) {
    const message = await Message.findByPk(req.params.id);
    if (message) {
      await message.destroy();
      res.redirect("/messages");
    } else {
      res.sendStatus(404);
    }
  } else {
    res.redirect('/messages');
  }
}));

module.exports = router;