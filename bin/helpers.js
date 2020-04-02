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



async function getPhone(phone) {
  let foundPhone = await Phone.findOne({
    attributes: ['name'],
    where: { phone }
  })
  return (foundPhone ? foundPhone.toJSON().name : false)
}


async function deleteOutdatedMessages() {
  const messages = await Message.findAll();
  const messagesJSON = messages.map(message => message.toJSON());
  for (let i = 0; i < messagesJSON.length; i++) {
    const messageDeleteTime = new Date(messages[i].deleteAt);
    const now = new Date();
    if (messages[i].deleteAt != null) {
      if (messageDeleteTime < now) {
        await messages[i].destroy();
      }
    }
  }
}

function replaceLineBreaks(message) {
  return message.replace(/\r\n/g, '<br />');

}



exports.asyncHandler = asyncHandler;
exports.deleteOutdatedMessages = deleteOutdatedMessages;
exports.getPhone = getPhone;
exports.replaceLineBreaks = replaceLineBreaks;