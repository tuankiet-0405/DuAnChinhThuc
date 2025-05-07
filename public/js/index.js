require('dotenv').config();
const express = require('express');
const passport = require('passport');
const session = require('express-session');
const path = require('path');

const GoogleStrategy = require('passport-google-oauth20').Strategy;

const app = express();
app.use(
    session({
        secret: "secret",
        resave: false,
        saveUninitialized: true,
    })
);
app.use(passport.initialize());
app.use(passport.session());
passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: "http://localhost:3000/auth/google/callback",
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                const { id, displayName, emails } = profile;
                const email = emails[0].value;

                // Kiểm tra xem người dùng đã tồn tại trong cơ sở dữ liệu chưa
                const [existingUsers] = await db.query(
                    "SELECT * FROM nguoi_dung WHERE email = ?",
                    [email]
                );

                let user;
                if (existingUsers.length > 0) {
                    user = existingUsers[0];
                } else {
                    // Nếu chưa tồn tại, thêm người dùng mới vào cơ sở dữ liệu
                    const [result] = await db.query(
                        "INSERT INTO nguoi_dung (ho_ten, email, mat_khau) VALUES (?, ?, ?)",
                        [displayName, email, id]
                    );
                    user = { id: result.insertId, ho_ten: displayName, email };
                }

                done(null, user);
            } catch (error) {
                console.error("Lỗi xác thực Google:", error);
                done(error);
            }
        }
    )
);
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));
app.get("/", (req, res) => {
    res.send("<a href='/auth/google'>Đăng nhập bằng Google</a>");

});
app.get(
    "/auth/google",passport.authenticate("google", { scope: ["profile", "email"] })
);
app.get("/auth/google/callback", passport.authenticate('google', { failureRedirect: "/views/login.html" }),(req, res) => {
    res.redirect("/views/account.html")
 }) // Redirect to your desired route after successful authentication
app.get("/profile", (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'account.html'));
});
app.get("/logout", (req, res) => {
    req.logOut();
    res.redirect("/views/login.html");
});
app.listen(3000, () => { 
    console.log("Server is running on port 3000");
});