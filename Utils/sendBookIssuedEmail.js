import { transporter } from "./transporter.js"
import dotenv from "dotenv";
dotenv.config();

export const sendBookIssuedEmail = async ({name, email, bookTitle, bookAuthor, issueId, dueDate}) =>{
    await transporter.sendMail({
 from: `"SEC Library" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Book Issued — ${bookTitle}`,
    html: `
      <div style="font-family: monospace; max-width: 500px; margin: auto; padding: 32px; background: #0f1218; color: #e8eaf0; border-radius: 12px;">
        
        <h2 style="color: #C8F04B; margin-bottom: 4px;">Book Issued Successfully</h2>
        <p style="color: #555; font-size: 13px; margin-bottom: 24px;">Sylhet Engineering College Library</p>

        <p style="margin-bottom: 20px;">Hi <strong>${name}</strong>, a book has been issued to you.</p>

        <div style="background: #1a1d24; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
          <table style="width: 100%; font-size: 13px;">
            <tr>
              <td style="color: #555; padding: 6px 0;">Issue ID</td>
              <td style="color: #C8F04B; font-weight: bold;">${issueId}</td>
            </tr>
            <tr>
              <td style="color: #555; padding: 6px 0;">Book</td>
              <td>${bookTitle}</td>
            </tr>
            <tr>
              <td style="color: #555; padding: 6px 0;">Author</td>
              <td>${bookAuthor}</td>
            </tr>
            <tr>
              <td style="color: #555; padding: 6px 0;">Issued On</td>
              <td>${new Date().toDateString()}</td>
            </tr>
            <tr>
              <td style="color: #555; padding: 6px 0;">Due Date</td>
              <td style="color: #F04B4B; font-weight: bold;">${new Date(dueDate).toDateString()}</td>
            </tr>
          </table>
        </div>

        <p style="font-size: 12px; color: #555;">
          Please return the book before the due date to avoid overdue status.<br/>
          Keep your <strong style="color: #C8F04B;">Issue ID</strong> safe — it is required for returning the book.
        </p>

      </div>
    `,
    })
}

export const sendOverdueReminderEmail = async ({ name, email, bookTitle, issueId, dueDate }) => {
  await transporter.sendMail({
    from: `"SEC Library" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Overdue Notice — ${bookTitle}`,
    html: `
      <div style="font-family: monospace; max-width: 500px; margin: auto; padding: 32px; background: #0f1218; color: #e8eaf0; border-radius: 12px;">
        <h2 style="color: #F04B4B;">Overdue Book Notice</h2>
        <p style="color: #555; font-size: 13px; margin-bottom: 24px;">Sylhet Engineering College Library</p>
        <p>Hi <strong>${name}</strong>, your borrowed book is overdue.</p>
        <div style="background: #1a1d24; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <table style="width: 100%; font-size: 13px;">
            <tr>
              <td style="color: #555; padding: 6px 0;">Issue ID</td>
              <td style="color: #C8F04B;">${issueId}</td>
            </tr>
            <tr>
              <td style="color: #555; padding: 6px 0;">Book</td>
              <td>${bookTitle}</td>
            </tr>
            <tr>
              <td style="color: #555; padding: 6px 0;">Due Date</td>
              <td style="color: #F04B4B;">${new Date(dueDate).toDateString()}</td>
            </tr>
          </table>
        </div>
        <p style="font-size: 12px; color: #555;">Please return the book to the library as soon as possible.</p>
      </div>
    `,
  });
};