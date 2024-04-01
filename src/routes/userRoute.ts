import express from "express";
import userController from "../controller/userController";
import { upload } from "../config/multerConfig";
const router = express.Router();
router
  .route("/")
  .get(userController.getUser)
  .post(upload.single("profile"), userController.createUser)
  .put(userController.updateStudent);
router.route("/rate").post(userController.giveRate);
router.route("/:id").delete(userController.deleteUser);

export default router;
