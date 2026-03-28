import req from "express/lib/request.js";
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
    
    //dynamic filter
    let filter = {};
    if(category){
      filter.category = {$regex:category, $options:"i"}
    }
    const books = await Book.find(filter).select("title author totalCopies availableCopies category")
    res.status(200).json({message:"Book fetched successfully..!", count:books.length, data:books})

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

//get student [all student, department wise]
export const getAllStudent = async(req, res)=>{
  try {
    const {department} = req.query;
    //base filter
    let filter = {role:"Student"};
    if(department) {
      filter.department = department;
    }
    const students = await User.find(filter);
    res.status(200).json({message:"Fetched Students..!", success:true, filter:filter, students:students})
  } catch (error) {
    res.status(500).json({message:"Error in fetching students", success:false})
  }
}

//get issued book
export const getIssuedBook = async(req, res)=>{
  try {
    const validStatus = ["borrowed", "returned", "overdue"];
    const {status} = req.query;

    if (status && !validStatus.includes(status)) {
     return res.status(400).json({
    success: false,
    message: "Invalid status value"
  });
}
    let filter = {};
    if(status){

      filter.status = status;
    }
    const issuedBook = await IssuedBook.find(filter).select("book user status borrowedAt dueDate");
    return res.status(200).json({message:"Fetched Issued book..!",count:issuedBook.length, success:true, data:issuedBook})
    
  } catch (error) {
  return res.status(500).json({
    success: false,
    message: "Error fetching issued books",
    error: error.message
  });
}
}
//get all reservations
export const getAllReservation = async(req, res)=>{
  try {
    const reservation = await ReserveBook.find({}).select("book user status");
    res.status(200).json({message:"Reservation data fetched successfull..!", count:reservation.length, data:reservation, success:true

    })
  } catch (error) {
    return res.status(500).json({message:"Error in getAllReservation", err:error.message, success:false})
  }
} 

//search student and get information about issued book and reservation book
export const searchStudent = async(req, res)=>{
  try {
    const {studentId} = req.body;
    if(!studentId){return res.status(400).json({message:"Student ID is required..!", success:false})}
    const user = await User.findOne({studentId});
    const student = await Student.findOne({studentId});

    if(!user && !student){
      return res.status(400).json({message:"Invaild Student ID", success:false})
    }

    if(student && !user){
      return(res.status(200).json({message:"Student exists but not registered yet..!", data:student}))
    }
    if(user){
      //fetche  issued data
      const issuedData = await IssuedBook.find({user:user._id}).populate("book", "title author").populate("user", "name studentId department session");
      res.status(200).json({message:"Issued data fetched",count:issuedData.length, success:true, data:issuedData})

      //fetch reservation data
      const reservationData = await ReserveBook.find({user:user._id}).populate("book", "title author").populate("user", "name studentId department session");
      res.status(200).json({message:"Reserved data fetched", count:reservationData.length, success:true, data:reservationData})
    }

    
  } catch (error) {
    return res.status(400).json({message:"Error in searchStudent", success:false, err:error.message})
  }
}
//return book
export const returnBook = async(req, res)=>{
  try {
    const {issuedId, studentId} = req.body;
    if(!issuedId || !studentId){
      return res.status(401).json({message:"All fields are required..!", success:false})
    }
    const user = await User.findOne({studentId});
    if(!user){
      return res.status(401).json({message:"User not found", success:false})
    }
    const issuedBook = await IssuedBook.findOne({issuedId});
    if(!issuedBook){
       return res.status(401).json({message:"No issued book found..!", success:false})
    }

    if(issuedBook.status === "returned"){
      return res.status(401).json({message:"Book already returned..!", success:false})
    }

    issuedBook.status = "returned";
    issuedBook.returnedAt = new Date();
    await issuedBook.save();

    const bookId = issuedBook.book;
    await Book.findByIdAndUpdate(bookId, {$inc:{availableCopies:1}});

    await issuedBook.populate([{path:"book", select:"title author _id"}, {path:"user", select:"name email _id"}])

    res.status(200).json({message:"Book returend successfully..!", success:true, data: issuedBook});
  } catch (error) {
    return res.status(400).json({message:"Error in returning book", success:false, err:error.message})
  }
}