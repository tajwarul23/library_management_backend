import cron from "node-cron";
import { IssuedBook } from "../Models/IssuedBook.model.js";
import { User } from "../Models/student_user.model.js";
import { sendOverdueReminderEmail } from "../Utils/sendBookIssuedEmail.js";


export const startExpireReturnBookJob = () => {
  // Run every hour
  cron.schedule("0 * * * *", async () => {
    try {
      const now = new Date();

      // Find all borrowed books that are now overdue
      const overdueBooks = await IssuedBook.find({
        status: "borrowed",
        dueDate: { $lt: now },
      }).populate([
        { path: "book", select: "title author" },
        { path: "user", select: "name email" },
      ]);

      if (!overdueBooks.length) return;

      for (const issuedBook of overdueBooks) {
        issuedBook.status = "overdue";
        await issuedBook.save();

        await User.findByIdAndUpdate(issuedBook.user._id, {
          $inc: { fine: 20 },
        });

        await sendOverdueReminderEmail({
          name: issuedBook.user.name,
          email: issuedBook.user.email,
          bookTitle: issuedBook.book.title,
          issueId: issuedBook.issuedId,
          dueDate: issuedBook.dueDate,
        });
      }

      console.log(`✅ Processed ${overdueBooks.length} overdue issued books`);
    } catch (err) {
      console.error("Cron job error:", err.message);
    }
  });
};

export const ExpireReturnbook = startExpireReturnBookJob;