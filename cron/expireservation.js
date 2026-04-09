import cron from "node-cron";
import { ReserveBook } from "../Models/ReserveBook.model.js";
import { Book } from "../Models/Book.model.js";
import { User } from "../Models/student_user.model.js";

export const startExpireReservationJob = () => {
  cron.schedule("* * * * *", async () => {
    try {
      const now = new Date();

      // Get all expired reservations
      const expiredReservations = await ReserveBook.find({
        status: "pending",
        expiresAt: { $lt: now }
      });

      if (!expiredReservations.length) return;

      for (let reservation of expiredReservations) {
        // Mark reservation as expired
        reservation.status = "expired";

        // Update user fine
        const user = await User.findByIdAndUpdate(reservation.user , {
            $inc : { fine : 20  }
        });
       

        // Save reservation
        await reservation.save();

        // Return book copy
        await Book.findByIdAndUpdate(reservation.book, {
          $inc: { availableCopies: 1 }
        });
      }

      console.log(`✅ Processed ${expiredReservations.length} expired reservations`);

    } catch (error) {
      console.error("Cron job error:", error.message);
    }
  });
};