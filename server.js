const http = require('http')
const express = require('express')
const es6Renderer = require('express-es6-template-engine')
const pgPromise = require('pg-promise')();
const bodyParser = require('body-parser')

const hostname = 'localhost'
const port = 3000
const config = {
  host:'localhost',
  port:5432,
  database: 'blog',
  user:'postgres',
}

const app = express()
const server = http.createServer(app)
const db = pgPromise(config)

app.engine('html', es6Renderer)
app.set('views', 'templates')
app.set('view engine', 'html')

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

app.get('/',(req,res)=>{
  res.render('layout',{
    partials:{
      body:'partials/home'
    },
    locals:{
      title: 'Home'
    }
  })
})

app.get('/blogs', (req, res) => {
  db.query('SELECT * FROM posts;')
    .then((results) => {
      res.render('layout', {
        partials: {
          body: 'partials/blogs-list'
        },
        locals: {
          title: 'Blogs',
          posts: results
        }
      })
    })
})

app.get('/blogs/new',(req,res)=>{
  res.render('layout',{
    partials:{
      body: 'partials/blogs-form'
    },
    locals:{
      title: 'Add a blog post'
    }
  })
})

app.post('/blogs/new',(req,res)=>{
  const title = req.body.title
  db.query('INSERT INTO posts (title) VALUES ($1)',[title])
    .then(()=>{
      res.send('created!')
    })
    .catch((e)=>{
      console.log(e)
      res.send('nope!')
    })
})

app.get('/blogs/:id', (req, res) => {
  const id = req.params.id
  db.oneOrNone('SELECT * FROM posts WHERE id = $1', [id])
    .then(posts => {
      if (!posts) {
        res.status(404).json({ error: 'blog not found' })
        return
      }
      res.render('layout',{
        partials:{
          body: 'partials/blogs-single'
        },
        locals:{
          title:posts.title,
          posts
        }
      })
    })
    .catch((e) => {
      console.log(e)
      res.status(400).json({ error: 'invalid id' })
    })
})


app.get('*', (req, res) => {
  res.status(404).send('404 Not Found')
})

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`)
})
