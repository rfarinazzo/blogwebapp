import express from "express";
import bodyParser from "body-parser";
import fs from "fs";

const app = express();
const port = 3000;
const postsDir = "./posts/"

app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static("public"));

// Function to transform file names into objects with name and time
function transformFileName(dir) {
  return function(fileName) {
    return {
      name: fileName,
      time: fs.statSync(dir + '/' + fileName).mtime.getTime()
    };
  };
};

// Function to sort files by modified time
function sortFilesByTime(a, b) {
  return b.time - a.time;
};

// Function to extract file names from the objects
function extractFileName(f) {
  return f.name;
};

// Function to remove file extension from .txt posts
function removeFileExtension(f) {
  return f.replace(/\.[^/.]+$/, "")
};

// [to-d0] Figure out what happens to an empty blog
app.get("/", (req, res) => {
  fs.readdir(postsDir, (err, files) => {
    files = files.map(transformFileName(postsDir))
                 .sort(sortFilesByTime)
                 .map(extractFileName);
    const lastPostTitle = removeFileExtension(files[0]);
    fs.readFile(postsDir + files[0], (err, data) => {
      if (err) throw err;
      const lastPostContent = data;
      res.render("index.ejs",{
        title: lastPostTitle,
        content: lastPostContent
      });
    });
  });
});

app.get("/list", (req, res) => {
  let postList = [];
  fs.readdir(postsDir, (err, files) => {
    files.forEach(file => {
      postList.push(removeFileExtension(file));
    });
    res.render("list.ejs", {
      allPosts: postList,
    });
  });
});

//Figure out how to use a password for this
app.get("/create", (req, res) => {
  res.render("create.ejs");
});

//Figure out how to use a password for this
app.post("/create", (req, res) => {
    fs.writeFile(postsDir + req.body["posttitle"].trim() + ".txt", req.body["postcontent"], (err) => {
      if (err) throw err;
    })
  res.render("create.ejs",{
    response: "Success!"
  });
});

app.get('^/posts/:posttitle', (req, res) => {
    fs.readFile(postsDir + req.params.posttitle + ".txt", "utf8", (err, data) => {
      if (err) throw err;
      res.render("blogpost.ejs", {
        title: req.params.posttitle,
        content: data
      });
    });
});

// TODO: figure out a solution for when the title is updated.
app.get('^/edit/:posttitle', (req, res) => {
  fs.readFile(postsDir + req.params.posttitle + ".txt", "utf8", (err, data) => {
    if (err) throw err;
    res.render("create.ejs", {
      title: req.params.posttitle,
      content: data
    });
  });
});

//Figure out how to use a password for this
app.get('^/delete/:posttitle', (req, res) => {
  fs.unlink(postsDir + req.params.posttitle + ".txt", (err, data) => {
    if (err) throw err;
    let postList = [];
    fs.readdir(postsDir, (err, files) => {
      files.forEach(file => {
        postList.push(removeFileExtension(file));
      });
      res.render("list.ejs", {
        allPosts: postList,
        response: "Post deleted!"
      });
    });
  });
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});