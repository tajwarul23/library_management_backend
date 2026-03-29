import cron from "node-cron";
import { ReserveBook } from "../Models/ReserveBook.model.js";
import { Book } from "../Models/Book.model.js";
import { IssuedBook } from "../Models/IssuedBook.model.js";

const expireReservations = async (req, res) => {
  try {
    const expiredReservations = await ReserveBook.find({
      status: "pending",
      expiresAt: { $lt: new Date() },
    });

    if (expiredReservations.length === 0) {
      console.log("[CRON] No expired reservations");
      return;
    }

    const reservationIds = expiredReservations.map((r) => r._id);
    const bookIds = expiredReservations.map((r) => r.book);

    await ReserveBook.updateMany(
      { _id: { $in: reservationIds } },
      { status: "expired" },
    );

    await Book.bulkWrite(
      bookIds.map((bookId) => ({
        updateOne: {
          filter: { _id: bookId },
          update: { $inc: { availableCopies: 1 } },
        },
      })),
    );
    console.log(`[CRON] ${expiredReservations.length} reservations expired`);
  } catch (error) {
    console.error("Error in expireReservations", error.message);
  }
};

const markOverDueBooks = async (req, res) => {
  try {
    const result = await IssuedBook.updateMany(
      { status: "borrowed", dueDate: { $lt: new Date() } },
      { status: "overdue" },
    );
    console.log(`[CRON] ${result.modifiedCount} books marked overdue`);
  } catch (error) {
    console.error("Error in markOverDueBooks", error.message);
  }
};


const cleanupOldData = async () =>{
    try {
        //setting the date 180 earlier from today 
        const cutOffDate = new Date();
        cutOffDate.setDate(cutOffDate.getDate() - 180);

        const [res1, res2] = await Promise.all([
            ReserveBook.deleteMany({
                status:"expired", updatedAt:{$lt:cutOffDate}
            }),
            IssuedBook.deleteMany({
                status:"returned",
                returnedAt:{$lt:cutOffDate}
            })
        ])
        console.log(`[CRON] Cleanup done → reservations: ${res1.deletedCount}, issued: ${res2.deletedCount}`);

    } catch (error) {
        console.error("[CRON ERROR - cleanupOldData]", error.message);
    }
}
export const startCronJobs = () => {
  //at the 0th minute of every hour
  cron.schedule("0 * * * *", async () => {
    try {
      await expireReservations();
      await markOverDueBooks();
      await cleanupOldData();
    } catch (error) {
      console.error("[CRON ERROR]", error.message);
    }
  });
  console.log("[CRON] Jobs started");
};
