const express = require("express");
const path = require("path");
const uniqid = require("uniqid");
const mediaRouter = express.Router();
const { writeMedia, getMedia } = require("../../lib/utils");
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
    check("rate").isFloat({min:5,max:5}).exists().withMessage("Review with a number 1-5"),
  ];

mediaRouter.get("/", async (req, res, next) => {
    try {
        const media = await getMedia();
        if (req.query && req.query.Title) {
          const filteredMedia = mdeia.filter(
            medium =>
            medium.hasOwnProperty("Title") &&
            medium.Title === req.query.Title
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
    console.log(req.body)
    try {
      const validationErrors = validationResult(req);
      const media = await getMedia();
  const mediumFound = media.find(medium => medium.imdbID = req.body.imdbID)
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
        console.log(req.body)
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


  mediaRouter.delete("/:imdbID", async (req, res, next) => {
    try {
      const media = await getMedia();
      const mediumFound = media.find(
        medium => medium.imdbID === req.params.imdbID
      );
      if (mediumFound) {
        const filteredMedia = media.filter(
            medium => medium.imdbID != mediumFound
        );
        await writeMedia(filteredMedia);
        res.status(201).send("ok");
      }
    } catch (error) {
      console.log(error);
      next(error);
    }
  });
  
  mediaRouter.put("/:imdbID", movieValidation, async (req, res, next) => {
    try {
  
      const validationErrors = validationResult(req);
  
      if (!validationErrors.isEmpty()) {
        const err = new Error();
        err.httpStatusCode = 400;
        err.message = validationErrors;
        next(err);
      } else {
        const books = await getMedia();
        const booksIndex = books.findIndex(
          book => book.asin === req.params.asin
        );
  
        if (booksIndex !== -1) {
          const updatedbooks = [
            ...books.slice(0, booksIndex),
            { ...books[booksIndex], ...req.body },
            ...books.slice(booksIndex + 1),
          ];
          await writeMedia(updatedbooks);
          res.send(updatedbooks);
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
  
  mediaRouter.get("/:imdbID/reviews", async (req, res, next) => {
    try {
      const books = await getMedia();
      const bookFound = books.find(
        book => book.asin === req.params.asin
      );
      if (bookFound) {
        res.send(bookFound.comments);
      } else {
        const error = new Error();
        error.httpStatusCode = 404;
        next(error);
      }
    } catch (error) {
      console.log(error);
      next(error);
    }
  });
  
  mediaRouter.get("/:imdbID/reviews/:reviewId", async (req, res, next) => {
    try {
      const books = await getMedia();
      const bookFound = books.find(
        book => book.asin === req.params.asin
      );
      if (bookFound) {
        const commentFound = bookFound.comments.find(
          comment => comment.asin === comment.params.commentId
        );
        if (commentFound) {
          res.status(201).send(commentFound);
        } else {
          const error = new Error();
          error.httpStatusCode = 404;
          next(error);
        }
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
  
  mediaRouter.post("/:imdbID/reviews/", reviewValidation, async (req, res, next) => {
    try {
      const books = await getMedia();
  
      const bookIndex = books.findIndex(
        book => book.asin === req.params.asin
      );
      if (bookIndex !== -1) {
        // book found
        const id = uniqid()
        books[bookIndex].comments= books[bookIndex].comments ? [... books[bookIndex].comments, {
          ...req.body,
          CommentID: id,
          Date: new Date(),
        }] : [{
          ...req.body,
          CommentID: id,
          Date: new Date(),
        }];
        await writeMedia(books);
        res.status(201).send(id);
      } else {
        // book not found
        const error = new Error();
        error.httpStatusCode = 404;
        next(error);
      }
    } catch (error) {
      console.log(error);
      next(error);
    }
  });
  
  mediaRouter.put(
    "/:asin/comments/:commentId",
    reviewValidation,
    async (req, res, next) => {
      try {
        const books = await getMedia();
  
        const bookIndex = books.findIndex(
          book => book.asin === req.params.asin
        );
  
        if (bookIndex !== -1) {
          const commentIndex = books[bookIndex].comments.findIndex(
            comment => comment.asin === req.params.commentId
          );
  
          if (commentIndex !== -1) {
            const previouscomment = books[bookIndex].comments[commentIndex];
  
            const updatecomments = [
              ...books[bookIndex].comments.slice(0, commentIndex),
              { ...previouscomment, ...req.body, updatedAt: new Date() },
              ...books[bookIndex].comments.slice(commentIndex + 1),
            ];
            books[bookIndex].comments = updatecomments;
  
            await writeMedia(books);
            res.send(books);
          } else {
            console.log("comment not found");
          }
        } else {
          console.log("book not found");
        }
      } catch (error) {
        console.log(error);
        next(error);
      }
    }
  );
  
  mediaRouter.delete("/:asin/comments/:commentId", async (req, res, next) => {
    try {
      const books = await getMedia();
      const bookIndex = books.findIndex(
        book => book.asin === req.params.asin
      );
      if (bookIndex !== -1) {
        books[bookIndex].comments = books[bookIndex].comments.filter(
          comment => comment.CommentID !== req.params.commentId
        );
        await writeMedia(books);
        res.send(books);
      } else {
      }
    } catch (error) {
      console.log(error);
      next(error);
    }
  });
  
  mediaRouter.delete("/:asin", async (req, res, next) => {
    try {
      const books = await getMedia();
      const filteredBooks = books.filter(book => book.asin != req.params.asin);
      await writeMedia(filteredBooks);
      res.send("book has been deleted");
    } catch (error) {
      console.log(error);
      next(error);
    }
  });
  
  mediaRouter
    .post("/:imdbID/upload", upload.single("image"), async (req, res, next) => {
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
                lastUpdated: new Date()
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
    });
  
  module.exports = mediaRouter;