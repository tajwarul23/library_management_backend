import { Book } from "../Models/Book.model.js";
import { Student } from "../Models/Student.model.js";

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
    res
      .status(200)
      .json({
        message: "Book added successfully..!",
        status: true,
        book: book,
      });
  } catch (error) {
    res
      .status(404)
      .json({
        message: "Error in adding book..!",
        err: error.message,
        success: false,
      });
  }
};
