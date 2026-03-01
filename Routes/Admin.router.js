import express from "express";
import {
  addBook,
  addStudent,
  deleteBook,
  deleteStudent,
  updateBook,
} from "../Controllers/Admin.controller.js";
import { Authenticated, Authorize } from "../Middlewares/Auth.js";

const router = express.Router();

//add student
router.post("/addStudent", Authenticated, Authorize(["Admin"]), addStudent);

//delete student
router.delete(
  "/deleteStudent/:id",
  Authenticated,
  Authorize(["Admin"]),
  deleteStudent,
);

//add book
router.post("/addBook", Authenticated, Authorize(["Admin"]), addBook);

//add book
router.put("/updateBook/:id", Authenticated, Authorize(["Admin"]), updateBook);

//delete book
router.delete(
  "/deleteBook/:id",
  Authenticated,
  Authorize(["Admin"]),
  deleteBook,
);
export default router;
