import express from "express";
import { upload } from "../utils/upload.js";
import { authorization } from "../middleware/authorization.js";
import { authentication } from "../middleware/authentication.js";
import {
  _create,
  _delete,
  _read,
  _readSingle,
  _update,
} from "../controller/factoryController.js";

import {
  signupHandler,
  loginHandler,
  forgetPassword,
  resetPassword,
  updateProfileInfo,
  updateProfilePicture,
  readProfileInfo,
  updatePassword,
} from "../controller/userController.js";

const router = express.Router();

const files = upload.fields([{ name: "profilePicture", maxCount: 1 }]);

router.route("/signup").post(files, signupHandler);

router.route("/login").post(loginHandler);

router.route("/forgetPassword").post(forgetPassword);

router.route("/resetPassword").post(resetPassword);

router.route("/readProfileInfo").get(authentication, readProfileInfo);

router.route("/updateProfileInfo").put(authentication, updateProfileInfo);

router
  .route("/updateProfilePicture")
  .put(authentication, files, updateProfilePicture);

router.route("/updatePassword").put(authentication, updatePassword);

//factory endpoint
router.route("/create").post(authentication, authorization, _create);
router.route("/read").get(authentication, authorization, _read);
router.route("/update").put(authentication, authorization, _update);
router.route("/delete").delete(authentication, authorization, _delete);
router.route("/readSingle").delete(authentication, authorization, _readSingle);

export default router;
