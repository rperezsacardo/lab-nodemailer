const { Router } = require('express');
const router = new Router();

const User = require('./../models/user');
const bcryptjs = require('bcryptjs');

const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  service: 'hotmail',
  auth: {
    user: process.env.NODEMAILER_EMAIL,
    pass: process.env.NODEMAILER_PASSWORD,
  },
});

const tokenGenerator = require('./../middleware/token');
const tokenLength = 5;

router.get('/', (req, res, next) => {
  res.render('index');
});

router.get('/sign-up', (req, res, next) => {
  res.render('sign-up');
});

router.post('/sign-up', (req, res, next) => {
  const { name, email, password } = req.body;
  bcryptjs
    .hash(password, 10)
    .then((hash) => {
      return User.create({
        name,
        email,
        confirmationCode: tokenGenerator(tokenLength),// How add a expirate date ??
        passwordHash: hash,
      });
    })
    .then((user) => {
      req.session.user = user._id;
      return transporter
        .sendMail({
          from: `teste <${process.env.NODEMAILER_EMAIL}>`,
          to: user.email,
          subject: 'Confirm',
          text: 'Hi, nice to meet you',
          html: `<a href="http://localhost:3000/authentication/confirmation/${user.confirmationCode}">Check</a>`,
        })
        .then((result) => {
          console.log('send');
        })
        .catch((error) => {
          console.log('fail', error);
        });
    })
    .then((user) => {
      res.redirect('/');
    })
    .catch((error) => {
      next(error);
    });
});

router.get(
  '/authentication/confirmation/:confirmationCode',
  (req, res, next) => {
    const confirmationCode = req.params.confirmationCode;
  
    User.findOne({ confirmationCode })
      .then((user) => {
        const originalCode = user.confirmationCode;
        if (confirmationCode === originalCode) { // This always will be true
          user.status = 'Active';
          console.log(user.status);
          res.render('confirmation');
        } else {
          res.render('error');
        }
      })
      .catch((error) => next(error));
  }
);

router.get('/sign-in', (req, res, next) => {
  res.render('sign-in');
});

router.post('/sign-in', (req, res, next) => {
  let userId;
  const { email, password } = req.body;
  User.findOne({ email })
    .then((user) => {
      if (!user) {
        return Promise.reject(new Error("There's no user with that email."));
      } else {
        userId = user._id;
        return bcryptjs.compare(password, user.passwordHash);
      }
    })
    .then((result) => {
      if (result) {
        req.session.user = userId;
        res.redirect('/');
      } else {
        return Promise.reject(new Error('Wrong password.'));
      }
    })
    .catch((error) => {
      next(error);
    });
});

router.post('/sign-out', (req, res, next) => {
  req.session.destroy();
  res.redirect('/');
});

const routeGuard = require('./../middleware/route-guard');

router.get('/private', routeGuard, (req, res, next) => {
  res.render('private');
});

module.exports = router;
