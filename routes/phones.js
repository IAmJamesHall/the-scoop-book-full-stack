const express = require('express');
const router = express.Router();
const { Phone } = require('../models');


const { asyncHandler } = require('../bin/helpers');


  // POST new phone
  router.post('/', asyncHandler( async(req, res) => {
    if (res.locals.user.adminPermissions) { //must be admin
      try {
        Phone.create(req.body);
        res.status(204).end();
      } catch (error) {
        res.status(400).end();
      }
    } else { //unauthorized
      res.status(401).end();
    }
  }));


  module.exports = router;