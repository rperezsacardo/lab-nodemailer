const { Router } = require('express');
const router = new Router();

const routeGuard = require('./../middleware/route-guard');

const User = require('./../models/user');

router.get('/:id', routeGuard, (req, res, next) => {
  const id = req.params.id;
  console.log(id);
  res.render('profile');
});

module.exports = router;
