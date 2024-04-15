const http = require("http")
const mongoose = require("mongoose")
const headers = require("./headers")
const Post = require('./modals/posts')
const handleSuccess = require('./handleSuccess')
const handleError = require('./handleError')
const dotenv = require("dotenv")

dotenv.config({path:"./config.env"})
const DB = process.env.DATABASE.replace('<password>',
process.env.DATABASE_PASSWORD
)

mongoose
  .connect(DB)
  .then(() => console.log("資料庫連線成功"))


const requestListener = async (req, res) => {
  let body = "";
  req.on("data", (chunk) => {
    body += chunk;
  });

  if (req.url == "/posts" && req.method == "GET") {
    const post = await Post.find();
    handleSuccess(res,post)
  } else if (req.url == "/posts" && req.method == "POST") {
    req.on("end", async () => {
      try {
        const data = JSON.parse(body);
        if (data.content !== undefined) {
          const newPost = await Post.create({
            name: data.name,
            content: data.content,
          });
          handleSuccess(res,newPost)
        } else {
          handleError(res)
        }
      } catch (error) {
        handleError(res,error)
      }
    });
  } else if (req.url.startsWith("/posts/") && req.method == "DELETE") {
    const id = req.url.split("/").pop();
    try{
      await Post.findByIdAndDelete(id);
      const message =
        {
          delete: "yes"
        }
        handleSuccess(res,message)
    }catch(error){
      handleError(res,error)
    }
  } else if (req.method == "OPTIONS") {
    res.writeHead(200, headers);
    res.end();
  } else if (req.url.startsWith("/posts/") && req.method == "PATCH") {
    req.on("end", async () => {
        try {
          const data = JSON.parse(body);
          console.log(data)
          const id = req.url.split("/").pop();
          if (data.content !== undefined) {
            const updatePost = await Post.findByIdAndUpdate(id,{
              name: data.name,
              content: data.content,
            });
            handleSuccess(res,updatePost)
          } else {
            handleError(res)
          }
        } catch (error) {
            handleError(res,error)
        }
      });
  } else if(req.url.startsWith("/posts") && req.method == "DELETE") {
    await Post.deleteMany({})
    const message =
    {
      delete: "yes"
    }
    handleSuccess(res,message)
  } else {
    res.writeHead(404, headers);
    res.write(
      JSON.stringify({
        status: "false",
        message: "無此網站路由",
      })
    );
    res.end();
  }
};
const server = http.createServer(requestListener);
server.listen(process.env.PORT || 3005);
