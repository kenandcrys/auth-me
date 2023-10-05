const express = require('express');
const router = express.Router();
const { Booking, Spot, User } = require('../../db/models');
const { restoreUser, requireAuth } = require('../../utils/auth');
const { Op } = require('sequelize');

// Helper function to convert strings to numbers
const parseNumber = (str) => parseFloat(str);

// Helper function to remove unnecessary properties from Spot
const cleanSpot = (spot) => {
  if (spot) {
    delete spot.createdAt;
    delete spot.updatedAt;
    delete spot.avgRating;
    delete spot.description;
    spot.lat = parseNumber(spot.lat);
    spot.lng = parseNumber(spot.lng);
    spot.price = parseNumber(spot.price);
  }
  return spot;
};

// ROUTE TO GET ALL OF THE CURRENT USERS BOOKINGS
router.get('/current', restoreUser, requireAuth, async (req, res, next) => {
  const userId = req.user.id;

  try {
    const bookings = await Booking.findAll({
      where: {
        userId: userId,
      },
      include: [{ model: Spot, as: 'Spot' }],
    });

    const cleanedBookings = bookings.map((booking) => {
      const bookingDataValues = booking.toJSON();
      bookingDataValues.Spot = cleanSpot(bookingDataValues.Spot);
      return bookingDataValues;
    });

    res.json({ Bookings: cleanedBookings });
  } catch (error) {
    next(error);
  }
});

// CREATE A BOOKING FROM A SPOT BASED ON THE SPOT'S ID
router.post('/spot/:spotId', restoreUser, requireAuth, async (req, res, next) => {
  const spotId = req.params.spotId;
  const userId = req.user.id;
  const { startDate, endDate } = req.body;

  try {
    const spot = await Spot.findByPk(spotId);

    if (!spot) {
      return res.status(404).json({ message: "Spot couldn't be found" });
    }

    if (new Date(startDate) >= new Date(endDate)) {
      return res.status(400).json({
        message: "Bad Request",
        errors: {
          endDate: "endDate cannot be on or before startDate",
        },
      });
    }

    const conflict = await Booking.findOne({
      where: {
        spotId: spotId,
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
        message: "Sorry, this spot is already booked for the specified dates",
        errors: {
          startDate: "Start date conflicts with an existing booking",
          endDate: "End date conflicts with an existing booking",
        },
      });
    }

    const booking = await Booking.create({
      spotId: spotId,
      userId: userId,
      startDate: startDate,
      endDate: endDate,
    });

    res.status(200).json(booking);
  } catch (error) {
    next(error);
  }
});

// ROUTE FOR EDITING A BOOKING
router.put('/:bookingId', restoreUser, requireAuth, async (req, res, next) => {
  const bookingId = req.params.bookingId;
  const userId = req.user.id;
  const { startDate, endDate } = req.body;

  try {
    const booking = await Booking.findOne({
      where: {
        id: bookingId,
      },
      include: { model: User, as: 'User' },
    });

    if (!booking) {
      return res.status(404).json({ message: "Booking couldn't be found" });
    }

    if (booking.User.id !== userId) {
      return res.status(403).json({ message: "Forbidden" });
    }

    if (new Date(booking.endDate) < new Date()) {
      return res.status(403).json({ message: "Past bookings can't be modified" });
    }

    if (new Date(startDate) >= new Date(endDate)) {
      return res.status(400).json({
        message: "Bad Request",
        errors: {
          endDate: "endDate cannot come before startDate",
        },
      });
    }

    const conflict = await Booking.findOne({
      where: {
        id: {
          [Op.ne]: bookingId,
        },
        spotId: booking.spotId,
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
        message: "Sorry, this spot is already booked for the specified dates",
        errors: {
          startDate: "Start date conflicts with an existing booking",
          endDate: "End date conflicts with an existing booking",
        },
      });
    }

    booking.startDate = startDate;
    booking.endDate = endDate;
    await booking.save();
    delete booking.dataValues.User;
    res.status(200).json(booking);
  } catch (error) {
    next(error);
  }
});

// ROUTE TO DELETE A BOOKING
router.delete('/:bookingId', restoreUser, requireAuth, async (req, res, next) => {
  const bookingId = req.params.bookingId;

  try {
    const booking = await Booking.findOne({
      where: {
        id: bookingId,
      },
      include: { model: Spot, as: 'Spot' },
    });

    if (!booking) {
      return res.status(404).json({ message: "Booking couldn't be found" });
    }

    const startDate = new Date(booking.startDate);

    if (startDate <= new Date()) {
      return res.status(403).json({ message: "Bookings that have been started can't be deleted" });
    }

    const isOwnerOrUser = booking.userId === req.user.id || booking.Spot.ownerId === req.user.id;

    if (!isOwnerOrUser) {
      return res.status(403).json({ message: "Forbidden: Booking does not belong to the current user or the spot owner" });
    }

    await booking.destroy();
    return res.status(200).json({ message: "Successfully deleted" });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

