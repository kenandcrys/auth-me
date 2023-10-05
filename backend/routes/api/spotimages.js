const express = require('express');
const { Spot, SpotImage } = require('../../db/models');
const { restoreUser, requireAuth } = require('../../utils/auth');
const { Op } = require('sequelize');
const router = express.Router();

// ROUTE TO DELETE A SPOT IMAGE
router.delete('/:imageId', restoreUser, requireAuth, async (req, res, next) => {
    const imageId = req.params.imageId;

    try {
        const spotImage = await SpotImage.findOne({
            where: { id: imageId },
            include: { model: Spot, as: 'spot' }
        });

        if (!spotImage) {
            return res.status(404).json({ message: "Spot Image couldn't be found" });
        }

        const spot = spotImage.spot;

        // Check if the spot image belongs to the user
        if (spot.ownerId !== req.user.id) {
            return res.status(403).json({ message: "Forbidden" });
        }

        // Delete the image
        await spotImage.destroy();

        return res.status(200).json({ message: "Successfully deleted" });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
