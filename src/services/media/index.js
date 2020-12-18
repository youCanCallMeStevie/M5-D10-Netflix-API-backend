const express = require("express");
const path = require("path");
const uniqid = require("uniqid");
const mediaRouter = express.Router();
const { writeMedia, getMedia, getReviews } = require("../../lib/utils");
const axios = require("axios"); //library to create http request (similar to browser's fetch). Can be used in FE & BE
const multer = require("multer");
const { writeFile } = require("fs-extra");
const upload = multer({});
const { check, validationResult } = require("express-validator");
const movieValidation = [
  check("Title").exists().withMessage("The media's title is required"),
  check("Year").isInt().exists().withMessage("A year is required: YYYY"),
  check("Type").exists().withMessage("Let us know what type of media this is"),
];
const reviewValidation = [
  check("comment").exists().withMessage("A review with text is required"),
  check("rate")
    .isFloat({ min: 5, max: 5 })
    .exists()
    .withMessage("Review with a number 1-5"),
];

mediaRouter.get("/", async (req, res, next) => {
  try {
    const media = await getMedia();
    if (req.query && req.query.Title) {
      const filteredMedia = mdeia.filter(
        medium =>
          medium.hasOwnProperty("Title") && medium.Title === req.query.Title
      );
      res.send(filteredMedia);
    } else {
      res.send(media);
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
});

mediaRouter.get("/:imdbID", async (req, res, next) => {
  try {
    const media = await getMedia();
    const mediumFound = media.find(
      medium => medium.imdbID === req.params.imdbID
    );
    if (mediumFound) {
      res.send(mediumFound);
    } else {
      const err = new Error();
      err.httpStatusCode = 404;
      next(err);
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
});

mediaRouter.post("/", movieValidation, async (req, res, next) => {
  console.log(req.body);
  try {
    const validationErrors = validationResult(req);
    const media = await getMedia();
    const mediumFound = media.find(medium => (medium.imdbID = req.body.imdbID));
    console.log(req.body);
    if (!validationErrors.isEmpty() && mediumFound) {
      const err = new Error();
      err.httpStatusCode = 400;
      err.message = validationErrors;
      next(err);
    } else {
      const media = await getMedia();
      media.push({
        ...req.body,
        createdAt: new Date(),
        reviews: [],
      });
      console.log(req.body);
      await writeMedia(media);
      res.status(201).send("ok");
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
});

//   const response = await axios({
//     method: "get",
//     url: `http://www.omdbapi.com/?apikey=${process.env.API_KEY_OMDB}&s=`,
//     data: xmlBody,
//     headers: { "Content-Type": "application/json" },
//   })

mediaRouter.put("/:imdbID", async (req, res, next) => {
  try {
    const validationErrors = validationResult(req);

    if (!validationErrors.isEmpty()) {
      const err = new Error();
      err.httpStatusCode = 400;
      err.message = validationErrors;
      next(err);
    } else {
      const media = await getMedia();
      const mediaIndex = media.findIndex(
        medium => medium.imdbID === req.params.imdbID
      );

      if (mediaIndex !== -1) {
        const updatedMedia = [
          ...media.slice(0, mediaIndex),
          { ...media[mediaIndex], ...req.body },
          ...media.slice(mediaIndex + 1),
        ];
        await writeMedia(updatedMedia);
        res.send(updatedMedia);
      } else {
        const err = new Error();
        err.httpStatusCode = 404;
        next(error);
      }
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
});

mediaRouter.delete("/:imdbID", async (req, res, next) => {
  try {
    const media = await getMedia();
    const filteredMedia = media.filter(
      medium => medium.imdbID !== req.params.imdbID
    );
    writeMedia(filteredMedia);
    res.send("This listing has been deleted");
  } catch (error) {
    console.log();
    next(error);
  }
});

mediaRouter.get("/:imdbID/reviews", async (req, res, next) => {
  try {
    const media = await getMedia();
    const medium = media.filter(medium => medium.imdbID === req.params.imdbID);
    if (medium.length > 0) {
      const reviews = await getReviews();
      const reviewArray = reviews.filter(
        review => medium.imdbID === review.elementId
      );
      console.log(medium, reviewArray);
      if (reviewArray.length > 0) {
        res.send(medium, reviewArray);
      } else {
        const err = new Error();
        err.httpStatusCode = 404;
        next(err);
      }
    }
  } catch (error) {
    next(error);
  }
});


mediaRouter.delete("/:imdbID/reviews/:reviewId", async (req, res, next) => {
  try {
    const media = await getMedia();
    const mediumIndex = media.findIndex(
      review => review._id === req.params.reviewId
    );
    if (mediumIndex !== -1) {
      media[mediumIndex].reviews = media[mediumIndex].reviews.filter(
        review => review._id !== req.params.reviewId
      );
      await writeMedia(media);
      res.send(media);
    } else {
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
});

mediaRouter.delete("/:imdbID", async (req, res, next) => {
  try {
    const media = await getMedia();
    const mediumFound = media.find(
      medium => medium.imdbID === req.params.imdbID
    );
    console.log("mediumFound", mediumFound);
    if (mediumFound) {
      const filteredMedia = media.filter(
        medium => medium.imdbID !== req.params.movieId
      );
      await writeMedia(filteredMedia);
      res.status(201).send("Listing has been deleted");
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
});

mediaRouter.post(
  "/:imdbID/upload",
  upload.single("image"),
  async (req, res, next) => {
    const [name, extention] = req.file.mimetype.split("/");
    try {
      await writeFile(
        path.join(
          __dirname,
          `../../../public/img/movies/${req.params.imdbID}.${extention}`
        ),
        req.file.buffer
      );
      const media = await getMedia();
      const updatedDb = media.map(medium =>
        medium.imdbID === req.params.imdbID
          ? {
              ...medium,
              Poster: `http://localhost:${process.env.PORT}/movies/${req.params.imdbID}.${extention}`,
              lastUpdated: new Date(),
            }
          : medium
      );
      await writeMedia(updatedDb);
      // console.log(updatedDb)
      res.status(201).send("ok");
    } catch (error) {
      console.log(error);
      next(error);
    }
  }
);

module.exports = mediaRouter;
