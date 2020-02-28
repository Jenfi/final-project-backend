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
    minlength: 2,
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
    minlength: 8,
    required: [true, "Password is required"]
  },
  adds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  /*   favourites: {
      type: [],
    }, */
  /*   rating: {
      type: Number,
      default: 0
    }, */
  accessToken: {
    type: String,
    default: () => crypto.randomBytes(128).toString('hex')
  }
})

const Product = mongoose.model('Product', {
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

app.post('/adds', (req, res) => {

})
// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`)
})
