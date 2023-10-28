const router = require("express").Router();
const tourController = require("../controller/tour.controller");

router.get('/top-5-cheap', tourController.aliasTour, tourController.getAllTours)

// Get all tour names
router.get("/tour-names", tourController.getAllTourNames);
router.get("/:id", tourController.getTourById);
router.get("/", tourController.getAllTours);
router.post("/", tourController.createTour);

// Updating the Tour
router.patch("/updateTour/:id", tourController.updateTour);

// Deleting the tour
router.delete("/deleteTour/:id", tourController.deleteTour)

module.exports = router;
