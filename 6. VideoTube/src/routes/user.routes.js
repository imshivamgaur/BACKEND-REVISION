import { Router } from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  changeCurrentPassword,
  updateAccountDetails,
  getCurrentUserDetails,
  updateUserAvatar,
  updateUserCoverImage,
} from "../controllers/user.controller.js";
import { upload } from "../middleware/multer.middlewares.js";
import { verifyJwt } from "../middleware/auth.middleware.js";

const router = Router();

router.route("/register").post(
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  registerUser
);

router.route("/login").post(loginUser);

// secured routes
router.route("/logout").post(verifyJwt, logoutUser);
router.route("/change-password").post(verifyJwt, changeCurrentPassword);
router.route("/update-account-details").post(verifyJwt, updateAccountDetails);
router.route("/current-user-details").get(verifyJwt, getCurrentUserDetails);

router
  .route("/update-avatar")
  .post(verifyJwt, upload.single("avatar"), updateUserAvatar);

router
  .route("/update-cover-image")
  .post(verifyJwt, upload.single("coverImage"), updateUserCoverImage);

export default router;
