import { Book } from "../Models/Book.model.js";
import { Waitlist } from "../Models/Waitlist.model.js";
import { transporter } from "./transporter.js";

export const notifyWaitlistUsers = async (bookId) => {
  const book = await Book.findById(bookId).select("title author");
  if (!book) {
    return { notifiedCount: 0, deletedCount: 0 };
  }

  const waitlistEntries = await Waitlist.find({ book: bookId })
    .populate("user", "name email")
    .sort({ createdAt: 1 });

  if (waitlistEntries.length === 0) {
    return { notifiedCount: 0, deletedCount: 0 };
  }

  const results = await Promise.allSettled(
    waitlistEntries.map((entry) =>
      transporter.sendMail({
        from: `"SEC Library" <${process.env.EMAIL_USER}>`,
        to: entry.user.email,
        subject: `Book Available: ${book.title}`,
        html: `
          <div style="font-family: monospace; max-width: 500px; margin: auto; padding: 32px; background: #0f1218; color: #e8eaf0; border-radius: 12px;">
            <h2 style="color: #C8F04B; margin-bottom: 4px;">Book Now Available</h2>
            <p style="color: #555; font-size: 13px; margin-bottom: 24px;">Sylhet Engineering College Library</p>
            <p>Hi <strong>${entry.user.name}</strong>, the book <strong>${book.title}</strong> by ${book.author} is now available.</p>
            <p style="font-size: 12px; color: #555;">This notification was sent automatically because you were on the waitlist.</p>
          </div>
        `,
      }),
    ),
  );

  const failed = results.filter((result) => result.status === "rejected");
  if (failed.length > 0) {
    return {
      notifiedCount: results.length - failed.length,
      deletedCount: 0,
      failedCount: failed.length,
    };
  }

  const deletedResult = await Waitlist.deleteMany({ book: bookId });
  return {
    notifiedCount: results.length,
    deletedCount: deletedResult.deletedCount ?? 0,
    failedCount: 0,
  };
};