const express = require('express');
const router = express.Router();
const { User } = require('../models');


const { asyncHandler } = require('../bin/helpers');

  // POST new user
  
  // GET currently authenticated user
  router.get('/', asyncHandler( async(req, res) => {
    if (res.locals.user) {
      res.json(res.locals.user);
    } else {
      res.status(401).end();
    }
  }));

  // POST new user
  router.post('/', asyncHandler( async(req, res) => {
    if (res.locals.user.adminPermissions) { //must be admin
      const { username, password } = req.body;
      try {
        let user = User.create(req.body);
        res.status(204).end();
      } catch (error) {
        res.status(400).end();
      }
    } else { //unauthorized
      res.status(401).end();
    }
  }));


  router.post('/login', asyncHandler(async (req, res) => {
    // check if user logins match the database
    const { username, password } = req.body;
    let user = await User.findOne({
      where: {
        username,
        password
      }
    })
    if (user) {
      user = user.toJSON();
      res.cookie('username', username);
      res.redirect('/messages')
    } else {
      console.log('nothing found');
      res.render('auth/login', {err: "Username or password are incorrect"})
    }

  }));




  module.exports = router;