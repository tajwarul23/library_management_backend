import express from "express";
import {
  addBook,
  addStudent,
  deleteBook,
  deleteStudent,
  getAllReservation,
  getAllStudent,
  getBooksForAdmin,
  getIssuedBook,
  issueBook,
  returnBook,
  searchBook,
  searchStudent,
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

//update the  book
router.put("/updateBook/:id", Authenticated, Authorize(["Admin"]), updateBook);

//delete book
router.delete(
  "/deleteBook/:id",
  Authenticated,
  Authorize(["Admin"]),
  deleteBook,
);

//issue book
router.post("/issueBook", Authenticated, Authorize(["Admin"]), issueBook)

//get book details
router.get("/books", Authenticated, Authorize(["Admin"]), getBooksForAdmin)

//search book 
router.get("/books/search", Authenticated, Authorize(["Admin"]), searchBook)

//get all students
router.get("/get/Student", Authenticated, Authorize(["Admin"]), getAllStudent)

//get all issued book
router.get("/get/issuedBook", Authenticated, Authorize(["Admin"]), getIssuedBook)

//get all reserved book
router.get("/get/reservation", Authenticated, Authorize(["Admin"]), getAllReservation)

//search student
router.post("/student/search", Authenticated, Authorize(["Admin"]), searchStudent)

//return book
router.post("/book/return", Authenticated, Authorize(["Admin"]), returnBook);



export default router;
