// Import required modules
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

// Initialize app
const app = express();
app.use(bodyParser.json());

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/booking_system', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

// Define Booking Schema and Model
const bookingSchema = new mongoose.Schema({
  bookingId: { type: String, required: true, unique: true },
  customerName: { type: String, required: true },
  bookingDate: { type: Date, required: true },
  amount: { type: Number, required: true },
  vendor: { type: String, required: true },
});

const Booking = mongoose.model('Booking', bookingSchema);

// API Endpoints

// POST /bookings
app.post('/bookings', async (req, res) => {
  try {
    const { bookingId, customerName, bookingDate, amount, vendor } = req.body;

    // Validate input
    if (!bookingId || !customerName || !bookingDate || !amount || !vendor) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    const normalizedDate = new Date(bookingDate);

    // Create and save booking
    const newBooking = new Booking({
      bookingId,
      customerName,
      bookingDate: normalizedDate,
      amount,
      vendor,
    });

    await newBooking.save();
    res.status(201).json({ message: 'Booking created successfully.' });
  } catch (err) {
    if (err.code === 11000) {
      res.status(409).json({ message: 'Booking ID must be unique.' });
    } else {
      res.status(500).json({ message: 'Internal server error.' });
    }
  }
});

// GET /bookings
app.get('/bookings', async (req, res) => {
  try {
    const { date, vendor } = req.query;
    const filter = {};

    if (date) {
      filter.bookingDate = new Date(date);
    }

    if (vendor) {
      filter.vendor = vendor;
    }

    const bookings = await Booking.find(filter);
    res.status(200).json(bookings);
  } catch (err) {
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// GET /bookings/:id
app.get('/bookings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findOne({ bookingId: id });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    res.status(200).json(booking);
  } catch (err) {
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// DELETE /bookings/:id
app.delete('/bookings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await Booking.deleteOne({ bookingId: id });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    res.status(200).json({ message: 'Booking deleted successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// Start Server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
