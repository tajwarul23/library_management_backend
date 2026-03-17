import { Book } from "../Models/Book.model.js";
import { IssuedBook } from "../Models/IssuedBook.model.js";
import { ReserveBook } from "../Models/ReserveBook.model.js";
import { Student } from "../Models/Student.model.js";
import { User } from "../Models/User.model.js";
import { reserveBook } from "./Student.controller.js";

//admin will add student
export const addStudent = async (req, res) => {
  const { name, studentId, session, department } = req.body;

  try {
    if (!name || !studentId || !session || !department) {
      return res.status(401).json({
        message: "All fields are required..!",

        success: false,
      });
    }

    //student with same studentId exists or not
    let student = await Student.findOne({ studentId });
    if (student) {
      return res.status(401).json({
        message: "Student Already Exists..!",

        success: false,
      });
    }
    student = await Student.create({ name, studentId, session, department });
    res.status(200).json({
      message: "Student Added Successfully..!",
      student: student,
      success: true,
    });
  } catch (error) {
    res.status(401).json({
      message: "Error in adding student",
      err: error.message,
      success: false,
    });
  }
};

//admin will delete student
export const deleteStudent = async (req, res) => {
  const studentId = req.params.id;
  try {
    let deletedStudent = await Student.findByIdAndDelete(studentId);
    //this studentId is MongoDB objectId

    if (!deletedStudent) {
      return res.status(404).json({
        message: "Student not found..!",
        success: false,
      });
    }

    return res.status(200).json({
      message: "Student deleted successfully..!",
      success: true,
    });
  } catch (error) {
    res.status(401).json({
      message: "Error in deleting student..!",
      err: error.message,
      success: false,
    });
  }
};

//admin will add book
export const addBook = async (req, res) => {
  const { title, author, isbn, totalCopies, availableCopies, category } =
    req.body;

  try {
    if (
      !title ||
      !author ||
      !isbn ||
      !totalCopies ||
      !availableCopies ||
      !category
    ) {
      return res
        .status(401)
        .json({ message: "All fields are required..!", success: false });
    }

    //if the book already exists on the db
    let book = await Book.findOne({ isbn });
    if (book) {
      return res
        .status(401)
        .json({ message: "Book already exists in Database..!" });
    }
    book = await Book.create({
      title,
      author,
      isbn,
      totalCopies,
      availableCopies,
      category,
    });
    res.status(200).json({
      message: "Book added successfully..!",
      success: true,
      book: book,
    });
  } catch (error) {
    res.status(404).json({
      message: "Error in adding book..!",
      err: error.message,
      success: false,
    });
  }
};

//admin will update  book
export const updateBook = async (req, res) => {
  const id = req.params.id;
  const { title, author, totalCopies, availableCopies, category } = req.body;
  try {
    let book = await Book.findByIdAndUpdate(
      id,
      { title, author, totalCopies, availableCopies, category },
      { new: true, runValidators: true },
    );
    if (!book) {
      return res.status(404).json({ message: "Invalid ID", success: false });
    }
    res.json({
      message: "Book Updated Successfully..!",
      success: true,
      book: book,
    });
  } catch (error) {
    res.status(401).json({
      message: "Error in updating book",
      err: error.message,
      success: false,
    });
  }
};

//admin will delete book
export const deleteBook = async (req, res) => {
  const id = req.params.id;
  try {
    let book = await Book.findByIdAndDelete(id);
    if (!book) {
      return res
        .status(404)
        .json({ message: "Book not found..!", success: false });
    }

    res
      .status(201)
      .json({ message: "Book deleted successfully..!", success: true });
  } catch (error) {
    res.status(401).json({
      message: "Error in deleting the book",
      err: error.message,
      success: false,
    });
  }
};

//admin will issue book
export const issueBook = async (req, res) => {
  try {

    const { bookId, studentId, dueDate, reservationId } = req.body;


 
    let finalBookId, finalUserId;
      //validate due date
    const parsedDate = new Date(dueDate);
    parsedDate.setUTCHours(23,59,59,999) //always end of the day in UTC
    if (parsedDate <= new Date()) {
      return res.status(400).json({
        success: false,
        message: "Due date must be in the future",
      });
    }

    //case-1 => Issue via reservation
    if(reservationId){
      const reservation = await ReserveBook.findById(reservationId).populate("book user");
      if(!reservation){
        return res.status(404).json({success:false, message:"Reservation Not Found..!"})
      }

      if(reservation.status !== "pending"){
        return res.status(400).json({success:false, message:`Cannot issue - reservation is already ${reservation.status}`})
      }
      finalBookId = reservation.book._id;
      finalUserId = reservation.user._id;

     //delete the reservation data (not needed anymore)
     await ReserveBook.findByIdAndDelete(reservationId);
    }
    //case-2 => issue directly (no reservation)
    else if(bookId && studentId){
      const book = await Book.findById(bookId);
      if (!book) {
        return res.status(404).json({ success: false, message: "Book not found" });
      }
      if (book.availableCopies <= 0) {
        return res.status(400).json({ success: false, message: "No available copies" });
      }
      const user = await User.findOne({studentId});
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }
       finalBookId = book._id,
      finalUserId = user._id;

      const existingIssue = await IssuedBook.findOne({
        book:finalBookId,
        user: finalUserId,
        status: {$in: ["borrowed", "overdue"]}
      })
      if(existingIssue){
        return res.status(400).json({success:false, message:"User already borrowed this book..!"})
      }
     
         const borrowedCount = await IssuedBook.countDocuments({
      user:finalUserId,
      status :{$in:["borrowed", "overdue"]}
    });

    if(borrowedCount > 3){
            return res.status(400).json({ success: false, message: "User has reached the borrowing limit of 3 books" });
    }
    
      await Book.findByIdAndUpdate(bookId, {$inc:{availableCopies:-1}})
    }
    else {
      return res.status(400).json({
        success:false,
        message:"Provide either reservationId or both bookdId and studentId"
      })
    }

 

  

    //create issued book record
    const issuedBook = await IssuedBook.create({
      book: finalBookId,
      user: finalUserId,
      dueDate: parsedDate
    });

 

    //populate book and user details for the response
    await issuedBook.populate([
      { path: "book", select: "title author _id" },
      { path: "user", select: "name email _id" }
    ])
    res.status(200).json({ message: "Book issued Successfully..!", success: true, data: issuedBook })
  } catch (error) {
    //handle invalid object id format
    if (error.name == "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid bookId or userId format",
      });
    }
    res.status(401).json({ message: "Error in issuing book", err: error.message, success: false })
  }
}

//admin will get details of book [title, category, author, totalCopies, availableCopies]
export const getBooksForAdmin = async (req, res) =>{
  try {
    const {category} = req.query;
    const books = await Book.find({category}).select("title author isbn totalCopies availableCopies category");
    if(!books){
      res.status(401).json({message:"No book found for this category..!", success:false});
    }
    res.status(201).json({message:"Book found..!", success:true, data:books})
  } catch (error) {
    res.status(401).json({message:"Error in getting books for admin", err:error.message, success:false})
  }
}

//admin will search book
export const searchBook = async(req, res)=>{
  try {
    const {query} = req.query;

    if(!query){
      return res.status(400).json({success:false, message:"Search Query is Required..!"})
    }
    const books = await Book.find({
      title:{$regex:query, $options:"i"}
    }).select("title author availableCopies category");

    res.status(200).json({success:true, data:books})
  } catch (error) {
    res.status(401).json({message:"error in searching book", success:false})
  }
}

//get all student
//return book
//get issued book
//get all reservations
//updateReservationStatus