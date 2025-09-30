import express from 'express';
import { Request, Response } from 'express';

const router = express.Router();

// Home page
router.get('/', (req: Request, res: Response) => {
  res.render('index', {
    title: 'Home',
    message: 'Welcome to Express.js with EJS!',
    features: [
      'Template Engine: EJS',
      'Static File Serving',
      'Global Variables',
      'Helper Functions'
    ]
  });
});

// About page
router.get('/about', (req: Request, res: Response) => {
  res.render('about', {
    title: 'About',
    description: 'This is a sample Express.js application with EJS template engine.'
  });
});

// Contact page
router.get('/contact', (req: Request, res: Response) => {
  res.render('contact', {
    title: 'Contact',
    formData: {
      name: '',
      email: '',
      message: ''
    }
  });
});

// Handle contact form submission
router.post('/contact', (req: Request, res: Response) => {
  const { name, email, message } = req.body;
  
  // In a real app, you'd save this to a database
  console.log('Contact form submission:', { name, email, message });
  
  res.render('contact', {
    title: 'Contact',
    formData: { name, email, message },
    success: true,
    message: 'Thank you for your message!'
  });
});

// Error page
router.get('/error', (req: Request, res: Response) => {
  res.status(500).render('error', {
    title: 'Error',
    error: {
      message: 'Something went wrong!',
      status: 500
    }
  });
});

export default router;