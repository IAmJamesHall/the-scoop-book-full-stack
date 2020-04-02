const { User } = require('../models');
const bcrypt = require('bcryptjs');

function authenticateUser() {
  return async (req, res, next) => {
    console.log('AUTHENTICATING')
    const auth = require('basic-auth');
    const authUser = auth(req);
    // normalize attributes 
    if (authUser) {
      authUser.username = authUser.name;
      authUser.password = authUser.pass;
      // check if email address is present in auth headers
      if (authUser.username) {
        // if so, look for the User record w/ that username
        const foundUser = await User.findOne({
          where: {
            username: authUser.username
          }
        });

        // if User record found
        if (foundUser) {
          // compare given password w/ stored hash
          await bcrypt.compare(authUser.password, foundUser.password, (err, result) => {
            if (result) { // if password is correct
              res.locals.user = {
                username: foundUser.username,
                fullName: foundUser.fullName,
                userId: foundUser.id,
                adminPermissions: foundUser.adminPermissions
              };
              next();
            } else { //password is incorrect
              res.status(401).end();
            }
          });
        } else { //user was not found
          res.status(401).end()
        }
      } else { //email address not present in auth headers
        res.locals.user = false;
        res.status(401).end();
      }
    } else { //auth headers not present
      res.status(401).end();
    }
  }
}


module.exports = authenticateUser;