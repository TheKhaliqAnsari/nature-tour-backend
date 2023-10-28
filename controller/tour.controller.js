const { query } = require("express");
const Tour = require("../model/tour.model");

// Alias middle ware

const aliasTour = (req, res, next) => {
  req.query.limit = "5";
  req.query.sort = "-ratingAverage,price";
  req.query.fields = "name,price,ratingsAverage,summary,difficulty";
  next();
};

const getTourById = async (req, res) => {
  const result = await Tour.findById(req.params.id);
  res.status(200).send(result);
};

const getAllTours = async (req, res) => {
  const { difficulty, duration } = req.query;
  // const query = {};
  // if(duration) query.duration = duration;
  // if(difficulty) query.difficulty = difficulty;
  // const allTours = await Tour.find(query);

  // const allTours = await Tour.find()
  //   .where("duration")
  //   .equals(duration)
  //   .where('difficulty')
  //   .equals(difficulty);

  // Building the query
  const queryObj = { ...req.query };
  const excludedField = ["page", "sort", "limit", "fields"];
  excludedField.forEach((ele) => delete queryObj[ele]);

  if (duration) queryObj.duration = duration;
  if (difficulty) queryObj.difficulty = difficulty;

  // Advanced Filtering
  let queryStr = JSON.stringify(queryObj);
  queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
  let query = Tour.find(JSON.parse(queryStr));

  // Sorting
  if (req.query.sort) {
    const sortBy = req.query.sort.split(",").join(" ");
    query = query.sort(sortBy);
  } else {
    query = query.sort("-createdAt");
  }

  // Field Limiting
  if (req.query.fields) {
    const fields = req.query.fields.split(",").join(" ");
    query = query.select(fields);
  } else {
    query = query.select("-__v");
  }

  // Pagination
  const page = req.query.page * 1 || 1;
  const limit = req.query.limit * 1 || 100;
  const skip = (page - 1) * limit;

  query = query.skip(skip).limit(limit);

  if (req.query.page) {
    const numTours = await Tour.countDocuments();
    if (skip > numTours) throw new Error("This page does not exists ");
  }

  // Executing the query

  const allTours = await query;

  res.status(200).send({
    Length: allTours?.length ? allTours.length : 0,
    allTours,
  });
};

const createTour = async (req, res) => {
  // const { name, price, rating } = req.body;
  const newTour = new Tour(req.body);
  const savedDocument = await newTour.save();
  res.status(201).send({ message: "New tour is creaetd", savedDocument });
};

const getAllTourNames = async (req, res) => {
  const result = await Tour.find({}, { name: 1, _id: 0 });
  res.status(200).send(result);
};

// Updating the tour
const updateTour = async (req, res) => {
  try {
    const result = await Tour.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    res.send(result);
  } catch (err) {
    // Handle validation errors or other errors here
    res.status(400).send(err);
  }
};

// deleting a tour

const deleteTour = async (req, res) => {
  await Tour.findByIdAndDelete(req.params.id);
  res.send({ message: "Tour deleted" });
};

module.exports = {
  aliasTour,
  getAllTours,
  createTour,
  getTourById,
  getAllTourNames,
  updateTour,
  deleteTour,
};
