import bcrypt from "bcrypt";

const hash = await bcrypt.hash("mypassword123", 10);
console.log("Hashed:", hash);
console.log("Match test:", await bcrypt.compare("mypassword123", hash));
console.log("Wrong password test:", await bcrypt.compare("wrongpassword", hash));