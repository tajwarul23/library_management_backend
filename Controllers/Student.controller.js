import { Book } from "../Models/Book.model.js";
import { ReserveBook } from "../Models/ReserveBook.model.js";
import { IssuedBook } from "../Models/IssuedBook.model.js";
import { notifyWaitlistUsers } from "../Utils/notifyWaitlistUsers.js";

const getOffsetPagination = (query) => {
  const offset = Number.parseInt(query.offset ?? "0", 10);
  const limit = Number.parseInt(query.limit ?? "3", 10);

  if (Number.isNaN(offset) || offset < 0) {
    return { error: "offset must be a non-negative number" };
  }

  if (Number.isNaN(limit) || limit <= 0) {
    return { error: "limit must be a positive number" };
  }

  return { offset, limit };
};

//student will get details of book [title, category, author] by category
export const getBooksForStudent = async (req, res) => {
  try {
    const {category} = req.query;
    let filter = {};
    if(category){
      filter.category = {$regex:category, $options:"i"}
    }
    const books = await Book.find(filter).select("title author  category");
    if(!books){
      res.status(404).json({message:"No book found for this category..!", status:false});
    }
    res.status(201).json({message:"Book found..!", success:true, data:books})
  } catch (error) {
    res.status(500).json({message:"Error in getting books for admin", err:error.message, status:false})
  }
}

//Student will reserve book
export const reserveBook = async(req, res) => {
  try {
    const bookId = req.params.bookId;
    const userId = req.user._id;

    //check if book exists
    const book = await Book.findById(bookId);
    if(!book){
      return res.status(404).json({message:"Book not Found..!", success:false})
    }

    //check available copies
    if(book.availableCopies <= 0){
      return res.status(409).json({message:"No availabe copies right now..!", success:false})
    }

    //check if student already has a pending/issued reservation for this book
    const exisitingReservation = await ReserveBook.findOne({
      book:bookId,
      user: userId,
      status:"pending"
    })

    if(exisitingReservation){
      return res.status(409).json({success:false, message:"You already have an active reservation for this book..!"});
    }

    //check how many active reservation
    const activeReservation = await ReserveBook.countDocuments({
      user:userId,
      status:"pending"
    })

    if(activeReservation > 3){
      return res.status(409).json({
        message:"You already have 3 active reservation..!",
        success:false
      })
    }

    //check if student has already borrowed this book
    const borrowed = await IssuedBook.findOne({
      book:bookId,
      user:userId,
      status: {$in:["borrowed", "overdue"]}
    })
    if(borrowed){
      return res.status(409).json({message:"You already have borrowed this book", success:false})
    }
    const now = new Date();
    const expire = new Date(now);
    expire.setHours(now.getHours() + 2);

    const reservation = await ReserveBook.create({
      book: bookId,
      user: userId,
      reservedAt: now,
      expiresAt: expire,
    });


    //Hold one copy 
    await Book.findByIdAndUpdate(bookId, {$inc:{availableCopies:-1}});

    //populate reservation data
    await reservation.populate([
      {path:"book", select:"title author"},
      {path:"user", select:"name email studentId"}
    ])
    const formattedReservedAt = reservation.reservedAt.toLocaleString("en-US", {
  year: "numeric",
  month: "short",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: true,
});

const formattedExpiresAt = reservation.expiresAt.toLocaleString("en-US", {
  year: "numeric",
  month: "short",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: true,
});
    res.status(201).json({message:"Book reserved successfully..!", success:true,
       data:
       {
        ...reservation.toObject(),
        reservedAt : formattedReservedAt,
        expiresAt : formattedExpiresAt
       }
       
      
      })
  } catch (error) {
    res.status(500).json({message:"Error in reserving book", success:false, err:error.message})
  }
}

//view all active reservation
export const viewReservation = async (req, res) =>{
  try {
    const userId = req.user._id;
    const pagination = getOffsetPagination(req.query);

    if (pagination.error) {
      return res.status(400).json({
        success: false,
        message: pagination.error,
      });
    }

    const { offset, limit } = pagination;
    const filter = { user:userId };
    const totalCount = await ReserveBook.countDocuments(filter);
    const reservation = await ReserveBook.find(filter)
      .populate("book", "title author")
      .skip(offset)
      .limit(limit);
    if (reservation.length === 0) {
      return res.status(404).json({message:"No active reservation..!", success:false})
    }
    
    return res.status(200).json({
      message:"All of your reservation..!",
      success:true,
      totalCount,
      offset,
      limit,
      data:reservation,
    })
  } catch (error) {
    return res.status(500).json({message:"Error in viewReservation", err:error.message}) 
  }
}

//cancel a reservation
export const deleteReservation = async(req, res) =>{
  try {
    const bookId = req.params.bookId;
    const userId = req.user._id;
    let deleteReservation = await ReserveBook.findOneAndDelete({book:bookId, user:userId});
    if(!deleteReservation){
      return res.status(404).json({message:"No reservation found..!", success:false})
    }
    await Book.findByIdAndUpdate(bookId, {$inc:{availableCopies:1}});
    await notifyWaitlistUsers(bookId);
    res.status(200).json({message:"Reservation succefully deleted..!", success:true})
  } catch (error) {
    return res.status(500).json({message:"Error in viewReservation", err:error.message}) 
  }
}

//view all issued book
export const viewIssuedBook = async(req, res)=>{
  try {
    const userId = req.user._id;
    const pagination = getOffsetPagination(req.query);

    if (pagination.error) {
      return res.status(400).json({
        success: false,
        message: pagination.error,
      });
    }

    const { offset, limit } = pagination;
    const filter = { user:userId };
    const totalCount = await IssuedBook.countDocuments(filter);
    const issuedBook = await IssuedBook.find(filter)
      .populate("book", "title author")
      .skip(offset)
      .limit(limit);
    if(issuedBook.length === 0){
      return res.status(404).json({message:"No issued Book..!", success:false})
    }
    return res.status(200).json({
      message:"All the issued book..!",
      success:true,
      totalCount,
      offset,
      limit,
      data:issuedBook,
    })
  } catch (error) {
      return res.status(500).json({message:"Error in viewIssuedBook", err:error.message}) 
  }
}

//student will search book
export const searchBook = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res
        .status(400)
        .json({ success: false, message: "Search Query is Required..!" });
    }
    const books = await Book.find({
      title: { $regex: query, $options: "i" },
    }).select("title author  category");

    res.status(200).json({ success: true, data: books });
  } catch (error) {
    res
      .status(401)
      .json({ message: "error in searching book", success: false });
  }
};
