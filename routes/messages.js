const express = require('express');
const router = express.Router();
const { Message, User, Phone } = require('../models');


/* Handler function to wrap each route. */
function asyncHandler(cb) {
  return async (req, res, next) => {
    try {
      await cb(req, res, next)
    } catch (error) {
      console.log(error);
      res.status(500).send(error);
    }
  }
}

/**
 * 
 * @param {object} req - HTTP request object
 * @return {object} 
 *       - username
 *       - loggedIn
*        -  adminPermission
 */
async function checkForLoggedInState(req) {
  const { username } = req.cookies;
  let user;
  let loggedIn = false;
  if (username) {
    user = await User.findOne({
      where: { username }
    });
  }
  if (user) {
    loggedIn = true;
    user = user.toJSON();;
    return {
      loggedIn,
      username: user.username,
      adminPermissions: user.adminPermissions
    }
  } else {
    return {
      loggedIn: false,
      username: null,
      adminPermission: false
    }
  }

}

async function getUser(req) {
  const { username } = req.cookies;
  let foundUser = await User.findOne({
    attributes: ['fullname'],
    where: { username }
  });
  foundUser = foundUser.toJSON();
  return foundUser.fullname;
}



async function getPhone(phone) {
  let foundPhone = await Phone.findOne({
    attributes: ['name'],
    where: { phone }
  })
  return (foundPhone ? foundPhone.toJSON().name : false)
}

/* GET messages listing. */
router.get('/', asyncHandler(async (req, res) => {
  const user = await checkForLoggedInState(req);
  let fullName;
  if (user.loggedIn) {
    fullName = await getUser(req);
    const messages = await Message.findAll({ order: [["createdAt", "DESC"]] });
    res.render("messages/index", { messages, title: "The Scoop Book", fullName, user });
  } else {
    res.redirect('/auth/login');
  }

}));

/* Create a new message form. */
router.get('/new', async (req, res) => {
  const user = await checkForLoggedInState(req);
  if (user.adminPermissions) {
    res.render("messages/new", { message: {}, title: "New Message", loggedIn: user.loggedIn });
  } else {
    res.redirect('/messages');
  }

});

/* POST create message. */
router.post('/', asyncHandler(async (req, res) => {
  const user = await checkForLoggedInState(req);
  if (user.adminPermissions) {
    let message;
    try {
      message = await Message.create(req.body);
      res.redirect("/messages");
    } catch (error) {
      if (error.name === "SequelizeValidationError") {
        message = await Message.build(req.body);
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
  console.log('phone: ', phone)
  console.log('author: ', author);
  if (author) {
    const message = await Message.create({
      content,
      author
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
  const user = await checkForLoggedInState(req);
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
  const loggedIn = await checkForLoggedInState(req);
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
  const loggedIn = await checkForLoggedInState(req);
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