import express from "express";
import bodyParser from "body-parser";
import axios from "axios";
import pg from "pg";
import fs from "fs";
import env from "dotenv";
import bcrypt from "bcrypt";
import session from "express-session";
import passport from "passport";
import { Strategy } from "passport-local";
import multer from "multer";
import path from "path";
const app = express();
const port = 3001;
const saltRounds = 10;
env.config();

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true, // confusion
    cookie: {
      maxAge: 1000 * 60 * 60 * 24,
    },
  })
);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(passport.initialize());
app.use(passport.session());

const db = new pg.Client({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
  ssl: {
    rejectUnauthorized: false, // Use true if you have a verified certificate
  },
});
db.connect();
const maxSize = 100 * 1024;
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/usersUploads");
  },
  filename: function (req, file, cb) {
    // const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, `${req.body.isbn}` + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage, limits: { fileSize: maxSize } });

let data;

//routs to index , login , signup page
app.get("/", async (req, res) => {
  await fetchData();
  res.render("index.ejs", { data: data });
});

app.get("/login", (req, res) => {
  const message = req.query.message || "";
  res.render("login.ejs", { message });
});

app.get("/signup", (req, res) => {
  res.render("signup.ejs");
});

//user home page
app.get("/home", async (req, res) => {
  if (req.isAuthenticated()) {
    // console.log(req.user.id);
    const result = await db.query(
      `SELECT notebook.*, users.first_name ,users.last_name , TO_CHAR(notebook.date, 'YYYY-MM-DD') AS date
       FROM notebook
       JOIN users ON notebook.user_id = users.id
       WHERE users.id = $1`,
      [req.user.id]
    );
    const userData = result.rows;
    res.render("home.ejs", { data: userData, user: req.user });
  } else {
    res.redirect("/login");
  }
});
//handle login request
app.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/home",
    failureRedirect:
      "/login?message=username or password is incorrect , try again",
  })
);

app.get("/logout", (req, res) => {
  req.logout((err) => {
    if (err) console.log(err); //its one line if else statement
    res.redirect("/");
  });
});
//handle sign up request
app.post("/signup", async (req, res) => {
  const first_name = req.body.first_name;
  const last_name = req.body.last_name;
  const email = req.body.email;
  const password = req.body.password;
  const confirm_password = req.body.password;
  try {
    if (password === confirm_password) {
      const result = await db.query("SELECT * FROM users WHERE email = $1", [
        email,
      ]);
      if (result.rows.length === 0) {
        bcrypt.hash(password, saltRounds, async (err, hash) => {
          if (err) {
            console.log("error generating hash:", err);
          } else {
            const result = await db.query(
              "INSERT INTO users (first_name ,last_name , email, passworD) VALUES ($1,$2,$3,$4) RETURNING *",
              [first_name, last_name, email, hash]
            );
            const user = result.rows[0];
            req.login(user, (err) => {
              console.log("success");
              res.redirect("/home");
            });
          }
        });
      } else {
        res.render("signup.ejs", { message: "email already exists" });
      }
    } else {
      res.render("signup.ejs", { message: "password does not match" });
    }
  } catch (error) {
    console.log(error);
  }
});

app.get("/new", (req, res) => {
  res.render("new.ejs");
});

//we need to define middle where which verify password
passport.use(
  "local",
  new Strategy(async function verify(username, password, cb) {
    try {
      const result = await db.query("SELECT * FROM users WHERE email = $1", [
        username,
      ]);
      if (result.rows.length == 0) {
        return cb("user not found");
      } else {
        const user = result.rows[0];
        const storedHashedPassword = user.password;
        bcrypt.compare(password, storedHashedPassword, (err, result) => {
          if (err) {
            return cb(err);
          } else {
            if (result) {
              return cb(null, user);
            } else {
              return cb(null, false);
            }
          }
        });
      }
    } catch (err) {
      return cb(null, false);
    }
  })
);

app.post("/add", upload.single("coverImage"), async (req, res) => {
  const book_name = req.body.name;
  const isbn_code = req.body.isbn;
  const rating = req.body.rating;
  const summary = req.body.summary;
  const note = req.body.note;
  const book_url = req.body.URL;
  const user_id = req.user.id;
  const date = currentDate();

  try {
    await db.query(
      "INSERT INTO notebook (book_title, isbn_code , rating, book_url, note, summary, date, user_id) VALUES ($1,$2,$3,$4, $5, $6, $7, $8)",
      [book_name, isbn_code, rating, book_url, note, summary, date, user_id]
    );
    console.log(req.file);
    if (!req.file) {
      await download(
        `https://covers.openlibrary.org/b/isbn/${isbn_code}-L.jpg`,
        `./public/usersUploads/${isbn_code}.jpg`
      );
    }
    res.redirect("/home");
  } catch (error) {
    console.log(error.message);
    res.redirect("/new");
  }
});

app.post("/update", async (req, res) => {
  const rating = req.body.rating;
  const summary = req.body.summary;
  const note = req.body.note;
  const book_url = req.body.URL;
  const user_id = req.user.id;
  const note_id = req.body.id;
  const date = currentDate();
  try {
    await db.query(
      "UPDATE notebook SET  rating = $1, book_url = $2, note = $3, summary = $4, date = $5, user_id = $6 WHERE id = $7",
      [rating, book_url, note, summary, date, user_id, note_id]
    );
    res.redirect("/home");
  } catch (error) {
    console.log(error.message);
    res.redirect("/new");
  }
});

app.get("/view", async (req, res) => {
  const id = req.query.id;
  await fetchIdData(id);
  res.render("view.ejs", { data: data });
});

app.get("/sort", async (req, res) => {
  const query = req.query.by;
  // console.log(query);
  if (query == "title") {
    await fetchSortedData("book_title", "ASC");
  } else if (query == "newest") {
    await fetchSortedData("date", "DESC");
  } else if (query == "best") {
    await fetchSortedData("rating", "DESC");
  }
  res.render("index.ejs", { data: data });
});

app.get("/sortuser", async (req, res) => {
  const query = req.query.by;
  const userId = req.user.id;
  // console.log(query);
  if (query == "title") {
    await fetchSortedDataUser("book_title", "ASC", userId);
  } else if (query == "newest") {
    await fetchSortedDataUser("date", "DESC", userId);
  } else if (query == "best") {
    download;
    await fetchSortedDataUser("rating", "DESC", userId);
  }
  res.render("home.ejs", { data: data, user: req.user });
});

app.post("/edit", async (req, res) => {
  const id = req.body.id;
  const action = req.body.action;
  if (req.isAuthenticated()) {
    switch (action) {
      case "edit":
        const result = await db.query("SELECT * FROM notebook WHERE id = $1", [
          id,
        ]);
        res.render("edit.ejs", { data: result.rows });
        break;
      case "delete":
        await db.query("DELETE FROM notebook where id = $1", [id]);
        res.redirect("/home");
        break;
    }
  } else {
    res.redirect("/login");
  }
});

//this are used to move user data
passport.serializeUser((user, cb) => {
  cb(null, user);
});
passport.deserializeUser((user, cb) => {
  cb(null, user);
});

app.listen(port, (req, res) => {
  console.log("server is running on http://localhost:" + port);
});

// ------------------------------function declaration-------------------------------------------
function currentDate() {
  const date = new Date();
  let currentDate = `${date.getDate()}-${
    date.getMonth() + 1
  }-${date.getFullYear()}`;
  return currentDate;
}
//fetch all data
async function fetchData() {
  try {
    const result = await db.query(
      "SELECT notebook.* ,users.first_name , users.last_name, TO_CHAR(date, 'YYYY-MM-DD') AS date FROM notebook Join users ON notebook.user_id = users.id ORDER BY rating desc"
    );
    data = result.rows;
  } catch (error) {
    console.log(error.message);
  }
}
//fetch data using id
async function fetchIdData(id) {
  try {
    const result = await db.query(
      "SELECT notebook.*, users.first_Name ,users.last_name , TO_CHAR(date, 'YYYY-MM-DD') AS date FROM notebook  join users on users.id = notebook.user_id WHERE notebook.id = $1",
      [id]
    );
    data = result.rows;
  } catch (error) {
    console.log(error.message);
  }
}

//fetch sorted all data
async function fetchSortedData(query, sort) {
  try {
    const result = await db.query(
      `SELECT id , book_title ,isbn_code, rating, book_url, note , summary , TO_CHAR(date, 'YYYY-MM-DD') AS date FROM notebook ORDER BY ${query} ${sort}`
    );
    data = result.rows;
  } catch (error) {
    console.log(error.message);
  }
}
//fetch sorted for specific user
async function fetchSortedDataUser(query, sort, user_id) {
  try {
    const result = await db.query(
      `SELECT id , book_title ,isbn_code, rating, book_url, note , summary , TO_CHAR(date, 'YYYY-MM-DD') AS date, user_id FROM notebook  WHERE user_id = ${user_id} ORDER BY ${query} ${sort}`
    );
    data = result.rows;
  } catch (error) {
    console.log(error.message);
  }
}
//used to store book cover image
async function download(url, filepath) {
  const response = await axios({
    url,
    method: "GET",
    responseType: "stream",
  });
  return new Promise((resolve, reject) => {
    response.data
      .pipe(fs.createWriteStream(filepath))
      .on("error", reject)
      .once("close", () => resolve(filepath));
  });
}
