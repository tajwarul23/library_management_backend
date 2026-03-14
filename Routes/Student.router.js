import express from "express";
import { Authenticated, Authorize } from "../Middlewares/Auth.js";
import { deleteReservation, getBooksForStudent, reserveBook, viewReservation } from "../Controllers/Student.controller.js";

const router = express.Router();

//get book details for student
router.get("/books", Authenticated, Authorize(["Student"]), getBooksForStudent)

//reserve book for student
router.post("/reserve/:bookId",Authenticated, Authorize(["Student"]), reserveBook)

//view active reservation
router.get("/reservations", Authenticated, Authorize(["Student"]), viewReservation)

//delete reservation
router.delete("/reservations/:bookId", Authenticated, Authorize(["Student"]), deleteReservation)
export default router;
