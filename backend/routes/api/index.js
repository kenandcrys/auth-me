// backend/routes/api/index.js
const router = require('express').Router();
const sessionRouter = require('./session.js');
const { restoreUser } = require("../../utils/auth.js");

// Connect restoreUser middleware to the API router
router.use(restoreUser);

//const routes = require('./routes');
const userRoutes = require('./users');

const spotRoutes = require('./spots');
const spotImagesRouter = require('./spotimages');
const reviewsRouter = require('./reviews');
const bookingsRouter = require('./bookings');
const reviewImagesRouter = require('./reviewimages');

// Register your API routes
router.use('/users', userRoutes);
router.use('/session', sessionRouter);
router.use('/spots', spotRoutes);
router.use('/spotimages', spotImagesRouter);
router.use('/reviews', reviewsRouter);
router.use('/bookings', bookingsRouter);
router.use('/reviewimages', reviewImagesRouter);
//app.use(routes);


router.post('/test', (req, res) => {
  res.json({ requestBody: req.body });
});

module.exports = router;
