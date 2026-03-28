import express from "express";
import { Authenticated, Authorize } from "../Middlewares/Auth.js";
import { deleteReservation, getBooksForStudent, reserveBook, viewIssuedBook, viewReservation } from "../Controllers/Student.controller.js";

const router = express.Router();

//get book details for student
router.get("/books", Authenticated, Authorize(["Student"]), getBooksForStudent)

//reserve book for student
router.post("/reserve/:bookId",Authenticated, Authorize(["Student"]), reserveBook)

//view active reservation
router.get("/reservations", Authenticated, Authorize(["Student"]), viewReservation)

//delete reservation
router.delete("/reservations/:bookId", Authenticated, Authorize(["Student"]), deleteReservation)

//view all isseud book
router.get("/issuedBooks", Authenticated, Authorize(["Student"]), viewIssuedBook)
export default router;
