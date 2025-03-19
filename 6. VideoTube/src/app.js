import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);
// common middleware
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// import routes
import healthCheckRouter from "./routes/healthcheck.routes.js";
import userRouter from "./routes/user.routes.js";

// routes
app.use("/api/v1/healthcheck", healthCheckRouter);
app.use("/api/v1/users", userRouter);

// Global error response
app.use((err, req, res, next) => {
  // console.error("🚨 Error:", err); // Debugging
  const statusCode = err.statusCode || 500;
  if (err) {
    return res.status(statusCode).json({
      statusCode,
      data: err.data || null,
      message: err.message,
      success: false,
    });
  }
});

export { app };
