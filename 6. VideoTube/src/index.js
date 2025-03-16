import { app } from "./app.js";

const PORT = 7000;

app.get("/", (req, res) => {
  res.json({
    message: "hello",
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT} `);
});
