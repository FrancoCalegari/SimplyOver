import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';

// Config
dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Template Engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Basic Frontend Routes
app.get('/', (req, res) => {
  res.render('index', { title: 'SimplyOver Marketplace' });
});

app.get('/login', (req, res) => {
  res.render('login', { title: 'SimplyOver - Login / Register' });
});

app.get('/dashboard/library', (req, res) => {
  res.render('dashboard_library', { title: 'My Library | SimplyOver' });
});

app.get('/dashboard/boards', (req, res) => {
  res.render('dashboard_boards', { title: 'My Boards | SimplyOver' });
});

app.get('/artist/:username', (req, res) => {
  res.render('artist_profile', { title: 'Artist Profile | SimplyOver' });
});

app.get('/overlay/:id', (req, res) => {
  res.render('overlay_details', { title: 'Overlay Details | SimplyOver' });
});

app.get('/studio', (req, res) => {
  res.render('studio_canvas', { title: 'Studio Canvas | SimplyOver' });
});

// Dummy Auth routes
app.post('/auth/login', (req, res) => {
  console.log('Login attempt:', req.body);
  res.redirect('/');
});

app.post('/auth/register', (req, res) => {
  console.log('Register attempt:', req.body);
  res.redirect('/login');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
