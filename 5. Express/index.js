import express from "express";
import logger from "./logger.js";
import morgan from "morgan";

const app = express();
const PORT = 3000;
app.use(express.json());

// custom logger
const morganFormat = ":method :url :status :response-time ms";
app.use(
  morgan(morganFormat, {
    stream: {
      write: (message) => {
        const logObject = {
          method: message.split(" ")[0],
          url: message.split(" ")[1],
          status: message.split(" ")[2],
          responseTime: message.split(" ")[3],
        };
        logger.info(JSON.stringify(logObject));
      },
    },
  })
);

let movieData = [];
let nextId = 1;

// Add movie
app.post("/add-movie", (req, res) => {
  logger.warn("A new requst is made on add tea route")
  let { name } = req.body;
  let newMovie = { id: nextId++, name: name };
  movieData.push(newMovie);
  res.status(200).json(newMovie);
});

// Get all movies
app.get("/movies", (req, res) => {
  res.status(200).send(movieData);
});

// Get movie with id
app.get("/movies/:id", (req, res) => {
  let { id } = req.params;
  const data = movieData.find((movie) => parseInt(id) === movie.id);
  // console.log(data);
  if (!data) {
    return res.status(404).send(`Movie Not Found`);
  }
  res.status(200).json(data);
});

// Update movie
app.put("/movies/:id", (req, res) => {
  let { id } = req.params;
  const data = movieData.find((movie) => parseInt(id) === movie.id);

  if (!data) {
    return res.status(404).send("Movie Not Found");
  }
  const { name } = req.body;
  data.name = name;
  res.status(200).send(data);
});

// Delete Route
app.delete("/movies/:id", (req, res) => {
  let { id } = req.params;
  const index = movieData.findIndex((movie) => parseInt(id) === movie.id);
  console.log(index);
  if (index === -1) {
    return res.status(404).send("Movie Not Found");
  }
  movieData.splice(index, 1);
  return res.status(200).send("Deleted!");
});

app.listen(PORT, () => {
  console.log(`Server is running at port ${PORT}`);
});
