const express = require('express');
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const upload = multer({ dest: '/temp' });

const app = express();

// connect to MongoDB
mongoose.connect('mongodb+srv://yaseenfiroz:6skYUzIiVKOuiF0S@cluster0.dck99ey.mongodb.net/test', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
  console.log('connected to MongoDB');
});

// define form schema
const formSchema = new mongoose.Schema({
    name: String,
    email: String,
    imageUrl: {
      url: String,
      public_id: String
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  });
  
  formSchema.methods.remove = async function() {
    return await this.model('Form').deleteOne({ _id: this._id });
  }
  
  const Form = mongoose.model('Form', formSchema);
  

// configure Cloudinary
cloudinary.config({
  cloud_name: 'dczloc2h5',
  api_key: '825284985619822',
  api_secret: 'n1g99r-ZnfQcYMleOFwnPYPp5hs',
});

// define API endpoints
app.post('/form', upload.single('image'), async (req, res) => {
  try {
    const result = await cloudinary.uploader.upload(req.file.path);

    const form = new Form({
      name: req.body.name,
      email: req.body.email,
      imageUrl: {
        url: result.url,
        public_id: result.public_id,
        format: result.format,
        secure_url: result.secure_url,
        // other metadata
      },
    });

    const savedForm = await form.save();

    res.json(savedForm);
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
});

app.get('/form/:id', async (req, res) => {
  try {
    const form = await Form.findById(req.params.id);

    res.json(form);
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
});

app.get('/image/:id', async (req, res) => {
  try {
    const form = await Form.findById(req.params.id);

    res.redirect(form.imageUrl.secure_url);
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
});
app.get('/forms', async (req, res) => {
    try {
      const forms = await Form.find();
  
      res.json(forms);
    } catch (error) {
      console.error(error);
      res.status(500).send('Server Error');
    }
  });
  app.delete('/form/:id', async (req, res) => {
    try {
      const formObject = await Form.findById(req.params.id);
  
      if (!formObject) {
        return res.status(404).json({ message: 'Form not found' });
      }
  
      await cloudinary.uploader.destroy(formObject.imageUrl.public_id);
  
      const form = new Form({
        _id: req.params.id,
        name: formObject.name,
        email: formObject.email,
        imageUrl: formObject.imageUrl,
        createdAt: formObject.createdAt
      });
  
      await form.remove();
  
      res.json({ message: 'Form deleted successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).send('Server Error');
    }
  });
  
  
  

// start server
const PORT = 3000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
