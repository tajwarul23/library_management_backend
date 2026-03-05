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

        status: false,
      });
    }

    //student with same studentId exists or not
    let student = await Student.findOne({ studentId });
    if (student) {
      return res.status(401).json({
        message: "Student Already Exists..!",

        status: false,
      });
    }
    student = await Student.create({ name, studentId, session, department });
    res.status(200).json({
      message: "Student Added Successfully..!",
      student: student,
      status: true,
    });
  } catch (error) {
    res.status(401).json({
      message: "Error in adding student",
      err: error.message,
      status: false,
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
        status: false,
      });
    }

    return res.status(200).json({
      message: "Student deleted successfully..!",
      status: true,
    });
  } catch (error) {
    res.status(401).json({
      message: "Error in deleting student..!",
      err: error.message,
      status: false,
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
        .json({ message: "All fields are required..!", status: false });
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
      status: true,
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
      return res.status(404).json({ message: "Invalid ID", status: false });
    }
    res.json({
      message: "Book Updated Successfully..!",
      status: true,
      book: book,
    });
  } catch (error) {
    res.status(401).json({
      message: "Error in updating book",
      err: error.message,
      status: false,
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
        .json({ message: "Book not found..!", status: false });
    }

    res
      .status(201)
      .json({ message: "Book deleted successfully..!", status: true });
  } catch (error) {
    res.status(401).json({
      message: "Error in deleting the book",
      err: error.message,
      status: false,
    });
  }
};

//admin will issue book
export const issueBook = async (req, res) => {
  try {

    const { bookId, userId, dueDate } = req.body;

    //validate input field
    if (!bookId || !userId || !dueDate) {
      return res.status(400).json({ message: "All fields are required..!", status: false })
    }

    //check if book exists
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ message: "Book not found..!", status: false })
    }

    //check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found..!", status: false })
    }

    //check if user has already borrowed the book or not returned
    const existingIssue = await IssuedBook.findOne({
      book: bookId,
      user: userId,
      status: { $in: ["borrowed", "overdue"] }
    })

    if(existingIssue){
      return res.status(400).json({
        success: false,
        message: "User already borrowed this book",
      });
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
    res.status(200).json({ message: "Book issued Successfully..!", status: true, data: issuedBook })
  } catch (error) {
    //handle invalid object id format
    if (error.name == "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid bookId or userId format",
      });
    }
    res.status(401).json({ message: "Error in issuing book", err: error.message, status: false })
  }
}