import bcrypt from "bcryptjs";

const adminPass = await bcrypt.hash("admin123", 10);
console.log(adminPass);
