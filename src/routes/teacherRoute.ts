import express from "express";
import teacherController from "../controller/teacherController";
import { upload } from "../config/multerConfig";

const router = express.Router();
router
  .route("/")
  .get(teacherController.getTeacher)
  .post(upload.single("profile"), teacherController.createTeacher)
  .put(teacherController.updateTeacher);
router.route("/:id").delete(teacherController.deleteTeacher);

export default router;
