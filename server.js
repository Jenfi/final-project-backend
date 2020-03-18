import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
import mongoose, { model } from 'mongoose'
import crypto from 'crypto'
import bcrypt from 'bcrypt-nodejs'
import dotenv from 'dotenv'
import cloudinary from 'cloudinary'
import multer from 'multer'
import cloudinaryStorage from 'multer-storage-cloudinary'

dotenv.config()

//   PORT=9000 npm start
const port = process.env.PORT || 8080
const app = express()

const mongoUrl = process.env.MONGO_URL || "mongodb://localhost/haggle"
mongoose.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false })
mongoose.Promise = Promise

cloudinary.config({
  cloud_name: 'dja4i0ann',
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
})

const storage = cloudinaryStorage({
  cloudinary,
  folder: 'ads',
  allowedFormats: ['jpg', 'jpeg', 'png'],
  transformation: [{ width: 600, height: 400, crop: "limit" }]
})

const parser = multer({ storage })

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

const Advert = mongoose.model('Advert', {
  title: {
    type: String,
    required: [true, "Adds must have a title"],
    minlength: 4,
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
  imageId: {
    type: String,
    required: true
  },
  condition: {
    type: String,
    required: [true, "Specify the product's condition"]
  },
  delivery: {
    type: Array,
    required: [true, "Specify how the product can be delivered"]
  },
  category: {
    type: String,
    required: [true, "Specify category"]
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
})


// Add middlewares to enable cors and json body parsing
app.use(cors())
app.use(bodyParser.json())

const authenticateUser = async (req, res, next) => {
  const user = await User.findOne({ accessToken: req.header('Authorization') })
  if (user) {
    req.user = user
    next()
  } else {
    res.status(401).json({ authorized: false, message: "User not authorized" })
  }
}


// Routes
app.post('/users', async (req, res) => {
  const { name, email, password } = req.body
  const encryptedPassword = password.length >= 8 ? bcrypt.hashSync(password) : password

  try {
    const user = await new User({ name, email, password: encryptedPassword })
    user.save((err, user) => {
      if (user) {
        res.status(201).json({ message: 'Created user', userId: user._id, accessToken: user.accessToken })
      } else {
        err.code === 11000
          ? res.status(400).json({ message: 'User already exists' })
          : res.status(400).json({ error: err })
      }
    })
  } catch (err) {
    res.status(400).json({ message: 'Could not create user 2', errors: err.errors })
  }
})

app.get('/users/current', authenticateUser)
app.get('/users/current', async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.user._id })
    res.status(200).json({ name: user.name, email: user.email })
  } catch (err) {
    res.status(403).json({ authorized: false, message: "User not authorized", errors: err.errors })
  }
})



app.post('/sessions', async (req, res) => {
  const { email, password } = req.body
  const user = await User.findOne({ email: email })
  if (user && bcrypt.compareSync(password, user.password)) {
    res.json({ userId: user._id, accessToken: user.accessToken })
  } else {
    res.status(404).json({ notFound: true })
  }
})


app.get('/adverts', async (req, res) => {

  try {
    const adverts = await Advert.find()
    res.status(200).json(adverts)
  } catch (err) {
    res.status(400).json({ message: 'Could not get', errors: err.errors })
  }
})

app.get('/adverts/:advertId', async (req, res) => {
  const { advertId } = req.params
  try {
    const advert = await Advert.findOne({ _id: advertId })
    res.status(200).json(advert)
  } catch (err) {
    res.status(400).json({ message: 'Could not get', errors: err.errors })
  }
})

app.post('/adverts', authenticateUser)
app.post('/adverts', parser.single('image'), async (req, res) => {
  const { title, description, price, delivery, category, condition } = req.body
  const user = req.user._id
  const imageUrl = req.file.secure_url
  const imageId = req.file.public_id
  const sellerId = await User.findOne({ _id: user })

  try {
    const advert = await new Advert({
      title, description, imageUrl, imageId, price, delivery, category, condition, seller: sellerId
    })
    advert.save((err, advert) => {
      if (advert) {
        res.status(201).json({ message: 'Created add', adId: advert._id, created: true })
      } else {
        res.status(400).json({ message: 'Could not create add', errors: err.errors, created: false })
      }
    })
    await User.findOneAndUpdate({ _id: sellerId }, { $push: { adverts: advert._id } })
  } catch (err) {
    res.status(400).json({ message: 'Could not create add', errors: err.errors })
  }
})

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`)
})
