const express = require('express');
const router = express.Router();
const { Review, ReviewImage } = require('../../db/models');
const { restoreUser, requireAuth } = require('../../utils/auth');

// Middleware to load the image by ID
router.param('imageId', async (req, res, next, imageId) => {
    try {
        const image = await ReviewImage.findOne({
            where: { id: imageId },
            include: { model: Review, as: 'review' },
        });

        if (!image) {
            return res.status(404).json({ message: "Review Image couldn't be found" });
        }

        req.image = image;
        next();
    } catch (err) {
        next(err);
    }
});

// DELETE A REVIEW IMAGE ROUTE
router.delete('/:imageId', restoreUser, requireAuth, async (req, res) => {
    const image = req.image;

    // Check if the review image belongs to the user
    if (image.review.userId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
    }

    // Delete the image
    await image.destroy();

    return res.status(200).json({ message: "Successfully deleted" });
});

module.exports = router;

