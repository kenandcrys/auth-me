const express = require('express');
const {
  Spot,
  SpotImage,
  Review,
  User,
  Booking,
  ReviewImage,
} = require('../../db/models');
const { restoreUser, requireAuth } = require('../../utils/auth');
const { Op } = require('sequelize');
const { Sequelize } = require('sequelize');
const router = express.Router();
const moment = require('moment');

// Helper function to convert strings to floats if needed
function parseFloatIfNeeded(value) {
  return typeof value === 'string' ? parseFloat(value) : value;
}

// Helper function to format dates using moment.js
function formatDate(date) {
  return moment(date).format('YYYY-MM-DD HH:mm:ss');
}

// ROUTE TO ADD AN IMAGE TO A SPOT BASED ON THE SPOT ID
router.post('/:spotId/images', restoreUser, requireAuth, async (req, res) => {
  const { url, preview } = req.body;
  const spotId = req.params.spotId;
  const userId = req.user.id;

  if (!url || typeof preview !== 'boolean') {
    return res.status(400).json({
      message: 'Bad Request',
      errors: {
        url: 'Url is required',
        preview: 'Preview should be true or false',
      },
    });
  }

  const spot = await Spot.findOne({
    where: { id: spotId },
  });

  if (!spot) {
    return res.status(404).json({ message: "Spot couldn't be found" });
  }

  if (spot.ownerId !== userId) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const newImage = await SpotImage.create({ spotId, url, preview });

  // Convert the Sequelize instance to plain JavaScript object
  let newImageDataValues = newImage.toJSON();

  // Remove unnecessary properties
  delete newImageDataValues.spotId;
  delete newImageDataValues.createdAt;
  delete newImageDataValues.updatedAt;
  delete newImageDataValues.avgRating;

  res.json(newImageDataValues);
});

// ROUTE TO CREATE A REVIEW FOR A SPOT BASED ON THE SPOT ID
router.post('/:spotId/reviews', restoreUser, requireAuth, async (req, res, next) => {
  try {
    const spotId = parseInt(req.params.spotId, 10);
    const { review, stars } = req.body;
    const userId = req.user.id;

    const spot = await Spot.findByPk(spotId);

    if (!spot) {
      return res.status(404).json({ message: "Spot couldn't be found" });
    }

    const userReview = await Review.findOne({
      where: { userId, spotId },
    });

    if (userReview) {
      return res
        .status(400)
        .json({ message: 'User already has a review for this spot' });
    }

    if (!review || review.trim() === '') {
      return res.status(400).json({
        message: 'Bad Request',
        errors: {
          review: 'Review text is required',
        },
      });
    }

    if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
      return res
        .status(400)
        .json({ message: 'Stars must be an integer from 1 to 5' });
    }

    const newReview = await Review.create({
      userId,
      spotId,
      review,
      stars,
    });

    const reviews = await Review.findAll({ where: { spotId } });

    let totalStars = 0;
    reviews.forEach((review) => {
      totalStars += review.stars;
    });
    const numReviews = reviews.length;
    const avgStarRating =
      numReviews > 0 ? totalStars / numReviews : 0;

    await spot.update({
      numReviews,
      avgRating: avgStarRating,
    });

    let reviewData = newReview.get({ plain: true });

    if (reviewData.User) {
      delete reviewData.User.username;
      delete reviewData.User.email;
    }

    return res.status(201).json(reviewData);
  } catch (error) {
    console.error(error);
    next(error);
  }
});

// ROUTE TO GET ALL SPOTS OWNED BY THE CURRENT USER
router.get('/current', restoreUser, requireAuth, async (req, res, next) => {
  const userId = req.user.id;

  const spots = await Spot.findAll({
    where: {
      ownerId: userId,
    },
    attributes: [
      'id',
      'ownerId',
      'address',
      'city',
      'state',
      'country',
      'lat',
      'lng',
      'name',
      'description',
      'price',
      'createdAt',
      'updatedAt',
      'previewImage',
    ],
    include: [
      {
        model: Review,
        as: 'reviews',
        attributes: ['stars', 'spotId'],
      },
    ],
  });

  const updatedSpots = await Promise.all(
    spots.map(async (spot) => {
      let spotData = spot.toJSON();
      const reviews = spotData.reviews || [];

      const totalStars = reviews.reduce((acc, review) => acc + review.stars, 0);
      const avgRating = reviews.length > 0 ? totalStars / reviews.length : 0;

      spotData.lat = parseFloatIfNeeded(spotData.lat);
      spotData.lng = parseFloatIfNeeded(spotData.lng);
      spotData.price = parseFloatIfNeeded(spotData.price);

      spotData.createdAt = formatDate(spotData.createdAt);
      spotData.updatedAt = formatDate(spotData.updatedAt);

      spotData.avgRating = parseFloat(avgRating.toFixed(1));

      return spotData;
    })
  );

  res.status(200).json({ Spots: updatedSpots });
});

// ROUTE TO DELETE A SPOT
router.delete('/:spotId', restoreUser, requireAuth, async (req, res, next) => {
  const spotId = req.params.spotId;

  const spot = await Spot.findOne({
    where: { id: spotId },
    include: [
      { model: SpotImage, as: 'SpotImages' },
      { model: Review, as: 'reviews' },
      { model: Booking, as: 'bookings' },
    ],
  });

  if (!spot) {
    return res.status(404).json({ message: "Spot couldn't be found" });
  }

  if (spot.ownerId !== req.user.id) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  await spot.destroy();
  return res.status(200).json({ message: 'Successfully deleted' });
});

// ROUTE TO UPDATE AN EXISTING SPOT
router.put('/:spotId', restoreUser, requireAuth, async (req, res) => {
  const spotId = req.params.spotId;
  const userId = req.user.id;

  const {
    address,
    city,
    state,
    country,
    lat,
    lng,
    name,
    description,
    price,
  } = req.body;

  if (
    !address ||
    !city ||
    !state ||
    !country ||
    !lat ||
    !lng ||
    !name ||
    !description ||
    !price
  ) {
    return res.status(400).json({
      message: 'Bad Request',
      errors: {
        address: 'Street address is required',
        city: 'City is required',
        state: 'State is required',
        country: 'Country is required',
        lat: 'Latitude is not valid',
        lng: 'Longitude is not valid',
        name: 'Name must be less than 50 characters',
        description: 'Description is required',
        price: 'Price per day is required',
      },
    });
  }

  const spot = await Spot.findOne({
    where: {
      id: spotId,
    },
  });

  if (!spot) {
    return res.status(404).json({ message: "Spot couldn't be found" });
  }

  if (spot.ownerId !== userId) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const updatedSpot = await spot.update({
    address,
    city,
    state,
    country,
    lat,
    lng,
    name,
    description,
    price,
  });

  let spotData = updatedSpot.get({ plain: true });

  delete spotData.avgRating;
  delete spotData.previewImage;

  res.json(spotData);
});

// CREATE A BOOKING FROM A SPOT BASED ON THE SPOT ID
router.post('/:spotId/bookings', restoreUser, requireAuth, async (req, res) => {
  const spotId = req.params.spotId;
  const userId = req.user.id;
  const { startDate, endDate } = req.body;

  const spot = await Spot.findByPk(spotId);

  if (!spot) {
    return res.status(404).json({ message: "Spot couldn't be found" });
  }

  if (new Date(startDate) >= new Date(endDate)) {
    return res.status(400).json({
      message: 'Bad Request',
      errors: {
        endDate: 'endDate cannot be on or before startDate',
      },
    });
  }

  const conflict = await Booking.findOne({
    where: {
      spotId,
      [Op.or]: [
        {
          startDate: {
            [Op.between]: [startDate, endDate],
          },
        },
        {
          endDate: {
            [Op.between]: [startDate, endDate],
          },
        },
      ],
    },
  });

  if (conflict) {
    return res.status(403).json({
      message: 'Sorry, this spot is already booked for the specified dates',
      errors: {
        startDate: 'Start date conflicts with an existing booking',
        endDate: 'End date conflicts with an existing booking',
      },
    });
  }

  const booking = await Booking.create({
    spotId,
    userId,
    startDate,
    endDate,
  });

  res.status(200).json(booking);
});

// ROUTE TO CREATE A NEW SPOT
router.post('/', restoreUser, requireAuth, async (req, res) => {
  const { address, city, state, country, lat, lng, name, description, price } =
    req.body;

  const user = req.user;

  if (
    !address ||
    !city ||
    !state ||
    !country ||
    !lat ||
    !lng ||
    !name ||
    !description ||
    !price
  ) {
    return res.status(400).json({
      message: 'Bad Request',
      errors: {
        address: 'Street address is required',
        city: 'City is required',
        state: 'State is required',
        country: 'Country is required',
        lat: 'Latitude is not valid',
        lng: 'Longitude is not valid',
        name: 'Name must be less than 50 characters',
        description: 'Description is required',
        price: 'Price per day is required',
      },
    });
  }

  const newSpot = await Spot.create({
    ownerId: user.id,
    address,
    city,
    state,
    country,
    lat,
    lng,
    name,
    description,
    price,
  });

  let spotData = newSpot.get({ plain: true });

  delete spotData.numReviews;
  delete spotData.previewImage;
  delete spotData.avgRating;

  res.json(spotData);
});

// ROUTE FOR GETTING ALL REVIEWS BY A SPOT'S ID
router.get('/:spotId/reviews', restoreUser, async (req, res, next) => {
  const spotId = req.params.spotId;

  const spot = await Spot.findByPk(spotId);

  if (!spot) {
    res.status(404).json({ message: "Spot couldn't be found" });
    return;
  }

  const reviews = await Review.findAll({
    where: {
      spotId,
    },
    include: [{ model: User, as: 'User' }, { model: ReviewImage, as: 'ReviewImages' }],
  });

  for (let i in reviews) {
    let reviewDataValues = reviews[i].toJSON();

    if (reviewDataValues.User) {
      delete reviewDataValues.User.username;
      delete reviewDataValues.User.email;
    }

    for (let y in reviewDataValues.ReviewImages) {
      delete reviewDataValues.ReviewImages[y].createdAt;
      delete reviewDataValues.ReviewImages[y].reviewId;
      delete reviewDataValues.ReviewImages[y].updatedAt;
    }

    reviewDataValues.createdAt = moment(reviewDataValues.createdAt).format(
      'YYYY-MM-DD HH:mm:ss'
    );
    reviewDataValues.updatedAt = moment(reviewDataValues.updatedAt).format(
      'YYYY-MM-DD HH:mm:ss'
    );

    reviews[i] = reviewDataValues;
  }

  res.json({ Reviews: reviews });
});

// ROUTE TO GET ALL BOOKINGS FOR A SPOT BASED ON THE SPOT'S ID
router.get('/:spotId/bookings', restoreUser, requireAuth, async (req, res, next) => {
  const spotId = req.params.spotId;

  const spot = await Spot.findByPk(spotId);

  if (!spot) {
    return res.status(404).json({ message: "Spot couldn't be found" });
  }

  const bookings = await Booking.findAll({
    where: { spotId },
    include: [{ model: User, as: 'User' }],
  });

  const transformedBookings = [];
  const isOwner = req.user.id === spot.ownerId;
  for (let booking of bookings) {
    if (isOwner) {
      transformedBookings.push({
        User: {
          id: booking.User.id,
          firstName: booking.User.firstName,
          lastName: booking.User.lastName,
        },
        id: booking.id,
        spotId: booking.spotId,
        userId: booking.userId,
        startDate: booking.startDate,
        endDate: booking.endDate,
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt,
      });
    } else {
      transformedBookings.push({
        spotId: booking.spotId,
        startDate: booking.startDate,
        endDate: booking.endDate,
      });
    }
  }

  res.json({ Bookings: transformedBookings });
});

// ROUTE TO GET DETAILS OF A SPOT FROM AN ID
router.get('/:spotId', async (req, res) => {
  const spotId = req.params.spotId;

  try {
    const spot = await Spot.findOne({
      where: { id: spotId },
      include: [
        {
          model: SpotImage,
          as: 'SpotImages',
          attributes: ['id', 'url', 'preview'],
        },
        {
          model: User,
          as: 'Owner',
          attributes: ['id', 'firstName', 'lastName'],
        },
        {
          model: Review,
          as: 'reviews',
          attributes: ['stars'],
        },
      ],
      attributes: [
        'id',
        'ownerId',
        'address',
        'city',
        'state',
        'country',
        'lat',
        'lng',
        'name',
        'description',
        'price',
        'createdAt',
        'updatedAt',
        'numReviews',
        ['avgRating', 'avgStarRating'],
      ],
    });

    if (!spot) {
      return res.status(404).json({ message: "Spot couldn't be found" });
    }

    const reviews = await Review.findAll({ where: { spotId: spot.id } });
    let totalStars = 0;
    reviews.forEach((review) => {
      totalStars += review.stars;
    });
    spot.dataValues.avgStarRating =
      reviews.length > 0 ? totalStars / reviews.length : 0;
    spot.dataValues.numReviews = reviews.length;

    let spotDataValues = spot.toJSON();

    for (let i in spotDataValues.SpotImages) {
      delete spotDataValues.SpotImages[i].avgRating;
    }

    delete spotDataValues.reviews;

    spotDataValues.avgStarRating = spot.dataValues.avgStarRating
      ? parseFloat(spot.dataValues.avgStarRating.toFixed(1))
      : 0;
    spotDataValues.numReviews = spotDataValues.numReviews || 0;

    res.status(200).json(spotDataValues);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ROUTE TO ADD QUERY FILTERS AND TO GET ALL SPOTS
router.get('/', restoreUser, async (req, res) => {
  let page, size, minLat, maxLat, minLng, maxLng, minPrice, maxPrice;
  const errors = {};

  if (req.query.page) {
    page = parseInt(req.query.page);
    if (isNaN(page) || page < 1 || page > 10) {
      page = 1;
    }
  } else {
    page = 1;
  }

  if (req.query.size) {
    size = parseInt(req.query.size);
    if (isNaN(size) || size < 1 || size > 20) {
      size = 20;
    }
  } else {
    size = 20;
  }

  if (req.query.minLat) {
    minLat = parseFloat(req.query.minLat);
    if (isNaN(minLat) || minLat < -90 || minLat > 90)
      errors.minLat = 'Minimum latitude is invalid';
  }

  if (req.query.maxLat) {
    maxLat = parseFloat(req.query.maxLat);
    if (isNaN(maxLat) || maxLat < -90 || maxLat > 90)
      errors.maxLat = 'Maximum latitude is invalid';
  }

  if (req.query.minLng) {
    minLng = parseFloat(req.query.minLng);
    if (isNaN(minLng) || minLng < -180 || minLng > 180)
      errors.minLng = 'Minimum longitude is invalid';
  }

  if (req.query.maxLng) {
    maxLng = parseFloat(req.query.maxLng);
    if (isNaN(maxLng) || maxLng < -180 || maxLng > 180)
      errors.maxLng = 'Maximum longitude is invalid';
  }

  if (req.query.minPrice) {
    minPrice = parseFloat(req.query.minPrice);
    if (isNaN(minPrice) || minPrice < 0)
      errors.minPrice = 'Minimum price must be greater than or equal to 0';
  }

  if (req.query.maxPrice) {
    maxPrice = parseFloat(req.query.maxPrice);
    if (isNaN(maxPrice) || maxPrice < 0)
      errors.maxPrice = 'Maximum price must be greater than or equal to 0';
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      message: 'Bad Request',
      errors,
    });
  }

  let where = {};

  if (minLat) where.lat = { [Sequelize.Op.gte]: minLat };
  if (maxLat) where.lat = { ...(where.lat || {}), [Sequelize.Op.lte]: maxLat };
  if (minLng) where.lng = { [Sequelize.Op.gte]: minLng };
  if (maxLng) where.lng = { ...(where.lng || {}), [Sequelize.Op.lte]: maxLng };
  if (minPrice) where.price = { [Sequelize.Op.gte]: minPrice };
  if (maxPrice) where.price = { ...(where.price || {}), [Sequelize.Op.lte]: maxPrice };

  try {
    const spots = await Spot.findAll({
      where,
      offset: (page - 1) * size,
      limit: size,
      attributes: [
        'id',
        'ownerId',
        'address',
        'city',
        'state',
        'country',
        'lat',
        'lng',
        'name',
        'description',
        'price',
        'createdAt',
        'updatedAt',
        'avgRating',
        'numReviews',
        'previewImage',
      ],
      include: [
        {
          model: Review,
          as: 'reviews',
          attributes: [],
        },
      ],
    });

    const totalSpots = await Spot.count({ where });

    const updatedSpots = spots.map((spot) => {
      let spotData = spot.toJSON();
      spotData.lat = parseFloatIfNeeded(spotData.lat);
      spotData.lng = parseFloatIfNeeded(spotData.lng);
      spotData.price = parseFloatIfNeeded(spotData.price);
      spotData.createdAt = formatDate(spotData.createdAt);
      spotData.updatedAt = formatDate(spotData.updatedAt);
      return spotData;
    });

    res.status(200).json({
      Spots: updatedSpots,
      page,
      size,
      totalSpots,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
