import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
import mongoose, { model } from 'mongoose'
import crypto from 'crypto'
import bcrypt from 'bcrypt-nodejs'

//   PORT=9000 npm start
const port = process.env.PORT || 8080
const app = express()

const mongoUrl = process.env.MONGO_URL || "mongodb://localhost/haggle"
mongoose.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true })
mongoose.Promise = Promise

// Check validation for email https://stackoverflow.com/questions/18022365/mongoose-validate-email-syntax
const User = mongoose.model('User', {
  name: {
    type: String,
    minlength: [2, "Min length 2 characters"],
    maxlength: 40,
    required: [true, "Name is required"]
  },
  email: {
    type: String,
    unique: true,
    required: [true, "Email is required"]
  },
  password: {
    type: String,
    minlength: [8, "Min length 8 characters"],
    required: [true, "Password is required"]
  },
  adverts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Advert'
  }],
  accessToken: {
    type: String,
    default: () => crypto.randomBytes(128).toString('hex')
  }
})

/*   favourites: {
      type: [],
    }, */
/*   rating: {
    type: Number,
    default: 0
  }, */

const Advert = mongoose.model('Advert', {
  title: {
    type: String,
    required: [true, "Adds must have a title"],
    minlength: 5,
    maxlength: 50
  },
  description: {
    type: String,
    minlength: 4,
    maxlength: 400,
    required: [true, "Adds must have a description."]
  },
  publishedDate: {
    type: Date,
    default: Date.now
  },
  sold: {
    type: Boolean,
    default: false,
    required: true
  },
  price: {
    type: Number,
    min: 1,
    max: 10000,
    required: true
  },
  currency: {
    type: String,
    default: "SEK"
  },
  imageUrl: {
    type: String,
    required: [true, "Adds must have an image"]
  },
  condition: {
    type: Array,
    default: ["As new", "Good", "Used", "Needs alterations"],
    required: [true, "Specify the product's condition"]
  },
  delivery: {
    type: Array,
    default: ["Pick up", "Meet up", "Ship"],
    required: [true, "Specify how the product can be delivered"]
  },
  category: {
    type: Array,
    default: ["Textiles", "Lightning", "Decoration", "Rugs", "Furniture"],
    required: [true, "Specify category"]
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
})


// Add middlewares to enable cors and json body parsing
app.use(cors())
app.use(bodyParser.json())

// Start defining your routes here
app.get('/', (req, res) => {
  res.send('Hello world')
})

app.post('/users', async (req, res) => {
  const { name, email, password } = req.body
  try {
    const user = await new User({ name, email, password })
    user.save((err, user) => {
      if (user) {
        res.status(201).json({ message: 'Created user', user })
      } else {
        res.status(400).json({ message: 'Could not create user', errors: err.errors })
      }
    })
  } catch (err) {
    res.status(400).json({ message: 'Could not create user', errors: err.errors })
  }
})

app.post('/adverts', async (req, res) => {
  const { title, description, imageUrl, price, delivery } = req.body
  try {
    const advert = await new Advert({ title, description, imageUrl, price, delivery })
    advert.save((err, advert) => {
      if (advert) {
        res.status(201).json({ message: 'Created add', advert })
      } else {
        res.status(400).json({ message: 'Could not create add', errors: err.errors })
      }
    })
  } catch (err) {
    res.status(400).json({ message: 'Could not create add', errors: err.errors })
  }
})

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`)
})
