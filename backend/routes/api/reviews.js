const express = require('express');
const router = express.Router();
const { Review, ReviewImage, Spot, User } = require('../../db/models');
const { restoreUser, requireAuth } = require('../../utils/auth');

// Middleware to load a review by ID
router.param('reviewId', async (req, res, next, reviewId) => {
    try {
        const review = await Review.findByPk(reviewId, { //switched to findByPk
            include: [
                { model: Spot, as: 'Spot' },
                { model: ReviewImage, as: 'ReviewImages' },
                { model: User, as: 'User' },
            ],
        });

        if (!review) {
            return res.status(404).json({ message: "Review couldn't be found" });
        }

        req.loadedReview = review;
        next();
    } catch (err) {
        next(err);
    }
});

// ROUTE FOR GETTING ALL REVIEWS BY A CURRENT USER
router.get('/current', restoreUser, async (req, res) => {
    const userId = req.user.id;

    const reviews = await Review.findAll({
        where: { userId },
        include: [
            { model: Spot, as: 'Spot', attributes: { exclude: ['createdAt', 'updatedAt', 'avgRating', 'description'] } },
            { model: ReviewImage, as: 'ReviewImages', attributes: { exclude: ['createdAt', 'updatedAt', 'reviewId'] } },
            { model: User, as: 'User', attributes: { exclude: ['username', 'email'] } },
        ],
    });

    const cleanedReviews = reviews.map((review) => {
        const { Spot, ReviewImages, User, ...reviewData } = review.toJSON();

        if (Spot) {
            Spot.lat = parseFloat(Spot.lat);
            Spot.lng = parseFloat(Spot.lng);
            Spot.price = parseFloat(Spot.price);
        }

        return { ...reviewData, Spot, ReviewImages, User };
    });

    res.json({ Reviews: cleanedReviews });
});

// ROUTE TO ADD AN IMAGE TO A REVIEW BASED ON THE REVIEW'S ID
router.post('/:reviewId/images', restoreUser, requireAuth, async (req, res, next) => {
    const { reviewId } = req.params;
    const { url } = req.body;
    const userId = req.user.id;

    const review = req.loadedReview;

    if (review.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
    }

    if (typeof url !== 'string') {
        return res.status(400).json({ message: "URL must be a string" });
    }

    const reviewImages = await ReviewImage.findAll({ where: { reviewId } });
    if (reviewImages.length >= 10) {
        return res.status(403).json({ message: "Maximum number of images for this review was reached" });
    }

    const newImage = await ReviewImage.create({
        reviewId: review.id,
        url,
    });

    const cleanedImage = {
        id: newImage.id,
        url: newImage.url,
    };

    res.status(200).json(cleanedImage);
});

// ROUTE FOR EDITING A REVIEW
// ROUTE FOR EDITING A REVIEW
router.put('/:reviewId', restoreUser, requireAuth, async (req, res, next) => {
    const { reviewId } = req.params;
    const { review, stars, spotId } = req.body;
    const userId = req.user.id;

    // Check if review is empty or only contains whitespace
    if (!review || review.trim() === "") {
        return res.status(400).json({
            message: "Bad Request",
            errors: {
                review: "Review text is required",
            }
        });
    }

    // Check if stars is an integer from 1 to 5
    if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
        return res.status(400).json({ message: "Stars must be an integer from 1 to 5" });
    }

    // Get the review
    const reviewToUpdate = await Review.findByPk(reviewId);

    // Check if the review couldn't be found
    if (!reviewToUpdate) {
        return res.status(404).json({ message: "Review couldn't be found" });
    }

    // Check if the review belongs to the currently authenticated user
    if (reviewToUpdate.userId !== userId) {
       return res.status(403).json({ message: "Forbidden" });
    }

    // Update the review
    await reviewToUpdate.update({
        review: review,
        stars: stars,
        userId: userId,
        spotId: spotId,
    },
    { fields: ['review', 'stars', 'userId', 'spotId', 'createdAt' ] }
    );

    // Fetch the updated review mmkay?
    const updatedReview = await Review.findByPk(reviewId);

    // Respond with the updated review
    res.status(200).json(updatedReview);
});
// ROUTE FOR DELETING A REVIEW
router.delete('/:reviewId', restoreUser, requireAuth, async (req, res, next) => {
    const { reviewId } = req.params;
    const currentUserId = req.user.id;

    const reviewToDelete = req.loadedReview;

    if (reviewToDelete.userId !== currentUserId) {
        return res.status(403).json({ message: "Forbidden" });
    }

    await reviewToDelete.destroy();

    res.status(200).json({ message: "Successfully deleted" });
});

module.exports = router;
