import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import userRoutes from "./routes/userRoute";
import teacherRoutes from "./routes/teacherRoute";
import path from "path";
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors());
app.get("/health", (req, res) => {
  return res.send("health is ok!");
});
dotenv.config();
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/teacher", teacherRoutes);

app.listen(process.env.PORT || 3000, () => {
  console.log(
    `[server] is running on  http://localhost:${
      process.env.PORT || 3000
    }/health`
  );
});
