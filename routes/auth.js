const express = require('express');
const router = express.Router();
const { User } = require('../models');


const { asyncHandler } = require('../bin/helpers');

  // POST new user
  
  // GET currently authenticated user

  // check credentials 


  /* Create login form */
  router.get('/', asyncHandler(async (req, res) => {
    res.redirect('/auth/login')
  }));

  router.get('/login', asyncHandler(async (req, res) => {
    res.render('auth/login');
  }));

  router.get('/logout', asyncHandler(async (req, res) => {
    res.clearCookie('username');
    res.redirect('/messages');
  }))

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