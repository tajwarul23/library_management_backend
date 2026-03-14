import { Book } from "../Models/Book.model.js";
import { IssuedBook } from "../Models/IssuedBook.model.js";
import { Student } from "../Models/Student.model.js";
import { User } from "../Models/User.model.js";

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

    const { bookId, userId, dueDate } = req.body;

    //we have to make some changes here => we have to find the user on the basis of the student id not on the basis of the userId

    //validate input field
    if (!bookId || !userId || !dueDate) {
      return res.status(400).json({ message: "All fields are required..!", success: false })
    }

    //check if book exists
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ message: "Book not found..!", success: false })
    }
    //check the available copies
    if(book.availableCopies <= 0){
      return res.status(400).json({ 
    message: "No available copies of this book", 
    success: false 
  });
    }
    //check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found..!", success: false })
    }

    //check if user has already borrowed the book or not returned
    const existingIssue = await IssuedBook.findOne({
      book: bookId,
      user: userId,
      success: { $in: ["borrowed", "overdue"] }
    })

    if(existingIssue){
      return res.status(400).json({
        success: false,
        message: "User already borrowed this book",
      });
    }

    //check borrowing limit
    const borrowedCount = await IssuedBook.countDocuments({
      user : userId,
      status : {$in : ["borrowed", "overdue"]}
    })
    if(borrowedCount > 3){
      return res.status(400).json({ message: "User has reached the borrowing limit of 3 books, retrun 1 or 2 previous borrowed book to borrow again", success: false });
    }

    //validate due date
    const parsedDate = new Date(dueDate);
    parsedDate.setUTCHours(23,59,59,999) //always end of the day in UTC
    if (parsedDate <= new Date()) {
      return res.status(400).json({
        success: false,
        message: "Due date must be in the future",
      });
    }

    //create issued book record
    const issuedBook = await IssuedBook.create({
      book: bookId,
      user: userId,
      dueDate: parsedDate
    });

    //decrement available copies on the book
    await Book.findByIdAndUpdate(bookId, { $inc: { availableCopies: -1 } });

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

//get all student
//return book
//get issued book
//get all reservations
//updateReservationStatus