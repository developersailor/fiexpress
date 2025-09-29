import path from "path";
import { writeFileSafe } from "./utils.js";

export async function generateWeatherDemo(targetRoot, ext) {
  console.log("🌤️ Generating Weather demo app...");
  
  // Weather service
  const weatherServiceContent = ext === "ts" ? 
    `export interface WeatherData {
  city: string;
  temperature: number;
  description: string;
  humidity: number;
  windSpeed: number;
}

export class WeatherService {
  private weatherData: WeatherData[] = [
    { city: "Istanbul", temperature: 22, description: "Partly Cloudy", humidity: 65, windSpeed: 12 },
    { city: "Ankara", temperature: 18, description: "Sunny", humidity: 45, windSpeed: 8 },
    { city: "Izmir", temperature: 25, description: "Clear", humidity: 55, windSpeed: 15 },
    { city: "Antalya", temperature: 28, description: "Sunny", humidity: 60, windSpeed: 10 }
  ];

  async getWeatherByCity(city: string): Promise<WeatherData | null> {
    const weather = this.weatherData.find(w => 
      w.city.toLowerCase() === city.toLowerCase()
    );
    return weather || null;
  }

  async getAllCities(): Promise<WeatherData[]> {
    return [...this.weatherData];
  }
}` :
    `class WeatherService {
  constructor() {
    this.weatherData = [
      { city: "Istanbul", temperature: 22, description: "Partly Cloudy", humidity: 65, windSpeed: 12 },
      { city: "Ankara", temperature: 18, description: "Sunny", humidity: 45, windSpeed: 8 },
      { city: "Izmir", temperature: 25, description: "Clear", humidity: 55, windSpeed: 15 },
      { city: "Antalya", temperature: 28, description: "Sunny", humidity: 60, windSpeed: 10 }
    ];
  }

  async getWeatherByCity(city) {
    const weather = this.weatherData.find(w => 
      w.city.toLowerCase() === city.toLowerCase()
    );
    return weather || null;
  }

  async getAllCities() {
    return [...this.weatherData];
  }
}

module.exports = { WeatherService };`;

  writeFileSafe(
    path.join(targetRoot, "src", "services", "WeatherService.ts"),
    weatherServiceContent
  );

  // Weather controller
  const weatherControllerContent = ext === "ts" ?
    `import { Request, Response } from 'express';
import { WeatherService } from '../services/WeatherService';

export class WeatherController {
  private weatherService: WeatherService;

  constructor() {
    this.weatherService = new WeatherService();
  }

  async getWeatherByCity(req: Request, res: Response) {
    try {
      const { city } = req.params;
      const weather = await this.weatherService.getWeatherByCity(city);
      
      if (!weather) {
        return res.status(404).json({
          success: false,
          message: 'City not found'
        });
      }

      res.json({
        success: true,
        data: weather
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch weather data'
      });
    }
  }

  async getAllCities(req: Request, res: Response) {
    try {
      const cities = await this.weatherService.getAllCities();
      res.json({
        success: true,
        data: cities
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch cities'
      });
    }
  }
}` :
    `const { WeatherService } = require('../services/WeatherService');

class WeatherController {
  constructor() {
    this.weatherService = new WeatherService();
  }

  async getWeatherByCity(req, res) {
    try {
      const { city } = req.params;
      const weather = await this.weatherService.getWeatherByCity(city);
      
      if (!weather) {
        return res.status(404).json({
          success: false,
          message: 'City not found'
        });
      }

      res.json({
        success: true,
        data: weather
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch weather data'
      });
    }
  }

  async getAllCities(req, res) {
    try {
      const cities = await this.weatherService.getAllCities();
      res.json({
        success: true,
        data: cities
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch cities'
      });
    }
  }
}

module.exports = { WeatherController };`;

  writeFileSafe(
    path.join(targetRoot, "src", "controllers", "WeatherController.ts"),
    weatherControllerContent
  );

  // Weather routes
  const weatherRoutesContent = ext === "ts" ?
    `import express from 'express';
import { WeatherController } from '../controllers/WeatherController';

const router = express.Router();
const weatherController = new WeatherController();

router.get('/city/:city', weatherController.getWeatherByCity);
router.get('/cities', weatherController.getAllCities);

export default router;` :
    `const express = require('express');
const { WeatherController } = require('../controllers/WeatherController');

const router = express.Router();
const weatherController = new WeatherController();

router.get('/city/:city', weatherController.getWeatherByCity);
router.get('/cities', weatherController.getAllCities);

module.exports = router;`;

  writeFileSafe(
    path.join(targetRoot, "src", "routes", "weather.ts"),
    weatherRoutesContent
  );

  console.log("✅ Weather demo app generated");
}

export async function generateTodoDemo(targetRoot, ext) {
  console.log("📝 Generating Todo demo app...");
  
  // Todo service
  const todoServiceContent = ext === "ts" ?
    `export interface Todo {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class TodoService {
  private todos: Todo[] = [];

  constructor() {
    // Initialize with sample todos
    this.todos = [
      {
        id: '1',
        title: 'Learn Express.js',
        description: 'Master the fundamentals of Express.js framework',
        completed: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '2',
        title: 'Build a Todo App',
        description: 'Create a simple todo application with CRUD operations',
        completed: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  }

  async getAllTodos(): Promise<Todo[]> {
    return [...this.todos];
  }

  async getTodoById(id: string): Promise<Todo | null> {
    return this.todos.find(todo => todo.id === id) || null;
  }

  async createTodo(title: string, description?: string): Promise<Todo> {
    const newTodo: Todo = {
      id: Date.now().toString(),
      title,
      description,
      completed: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.todos.push(newTodo);
    return newTodo;
  }

  async updateTodo(id: string, updates: Partial<Omit<Todo, 'id' | 'createdAt'>>): Promise<Todo | null> {
    const todoIndex = this.todos.findIndex(todo => todo.id === id);
    if (todoIndex === -1) return null;
    
    this.todos[todoIndex] = {
      ...this.todos[todoIndex],
      ...updates,
      updatedAt: new Date()
    };
    return this.todos[todoIndex];
  }

  async deleteTodo(id: string): Promise<boolean> {
    const todoIndex = this.todos.findIndex(todo => todo.id === id);
    if (todoIndex === -1) return false;
    
    this.todos.splice(todoIndex, 1);
    return true;
  }

  async toggleTodo(id: string): Promise<Todo | null> {
    const todo = await this.getTodoById(id);
    if (!todo) return null;
    
    return this.updateTodo(id, { completed: !todo.completed });
  }
}` :
    `class TodoService {
  constructor() {
    this.todos = [];
    
    // Initialize with sample todos
    this.todos = [
      {
        id: '1',
        title: 'Learn Express.js',
        description: 'Master the fundamentals of Express.js framework',
        completed: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '2',
        title: 'Build a Todo App',
        description: 'Create a simple todo application with CRUD operations',
        completed: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  }

  async getAllTodos() {
    return [...this.todos];
  }

  async getTodoById(id) {
    return this.todos.find(todo => todo.id === id) || null;
  }

  async createTodo(title, description) {
    const newTodo = {
      id: Date.now().toString(),
      title,
      description,
      completed: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.todos.push(newTodo);
    return newTodo;
  }

  async updateTodo(id, updates) {
    const todoIndex = this.todos.findIndex(todo => todo.id === id);
    if (todoIndex === -1) return null;
    
    this.todos[todoIndex] = {
      ...this.todos[todoIndex],
      ...updates,
      updatedAt: new Date()
    };
    return this.todos[todoIndex];
  }

  async deleteTodo(id) {
    const todoIndex = this.todos.findIndex(todo => todo.id === id);
    if (todoIndex === -1) return false;
    
    this.todos.splice(todoIndex, 1);
    return true;
  }

  async toggleTodo(id) {
    const todo = await this.getTodoById(id);
    if (!todo) return null;
    
    return this.updateTodo(id, { completed: !todo.completed });
  }
}

module.exports = { TodoService };`;

  writeFileSafe(
    path.join(targetRoot, "src", "services", "TodoService.ts"),
    todoServiceContent
  );

  // Todo controller
  const todoControllerContent = ext === "ts" ?
    `import { Request, Response } from 'express';
import { TodoService } from '../services/TodoService';

export class TodoController {
  private todoService: TodoService;

  constructor() {
    this.todoService = new TodoService();
  }

  async getAllTodos(req: Request, res: Response) {
    try {
      const todos = await this.todoService.getAllTodos();
      res.json({
        success: true,
        data: todos
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch todos'
      });
    }
  }

  async getTodoById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const todo = await this.todoService.getTodoById(id);
      if (!todo) {
        return res.status(404).json({
          success: false,
          message: 'Todo not found'
        });
      }
      res.json({
        success: true,
        data: todo
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch todo'
      });
    }
  }

  async createTodo(req: Request, res: Response) {
    try {
      const { title, description } = req.body;
      if (!title) {
        return res.status(400).json({
          success: false,
          message: 'Title is required'
        });
      }
      
      const todo = await this.todoService.createTodo(title, description);
      res.status(201).json({
        success: true,
        data: todo
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to create todo'
      });
    }
  }

  async updateTodo(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const todo = await this.todoService.updateTodo(id, updates);
      if (!todo) {
        return res.status(404).json({
          success: false,
          message: 'Todo not found'
        });
      }
      
      res.json({
        success: true,
        data: todo
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to update todo'
      });
    }
  }

  async deleteTodo(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const deleted = await this.todoService.deleteTodo(id);
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Todo not found'
        });
      }
      res.json({
        success: true,
        message: 'Todo deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to delete todo'
      });
    }
  }

  async toggleTodo(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const todo = await this.todoService.toggleTodo(id);
      if (!todo) {
        return res.status(404).json({
          success: false,
          message: 'Todo not found'
        });
      }
      res.json({
        success: true,
        data: todo
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to toggle todo'
      });
    }
  }
}` :
    `const { TodoService } = require('../services/TodoService');

class TodoController {
  constructor() {
    this.todoService = new TodoService();
  }

  async getAllTodos(req, res) {
    try {
      const todos = await this.todoService.getAllTodos();
      res.json({
        success: true,
        data: todos
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch todos'
      });
    }
  }

  async getTodoById(req, res) {
    try {
      const { id } = req.params;
      const todo = await this.todoService.getTodoById(id);
      if (!todo) {
        return res.status(404).json({
          success: false,
          message: 'Todo not found'
        });
      }
      res.json({
        success: true,
        data: todo
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch todo'
      });
    }
  }

  async createTodo(req, res) {
    try {
      const { title, description } = req.body;
      if (!title) {
        return res.status(400).json({
          success: false,
          message: 'Title is required'
        });
      }
      
      const todo = await this.todoService.createTodo(title, description);
      res.status(201).json({
        success: true,
        data: todo
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to create todo'
      });
    }
  }

  async updateTodo(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const todo = await this.todoService.updateTodo(id, updates);
      if (!todo) {
        return res.status(404).json({
          success: false,
          message: 'Todo not found'
        });
      }
      
      res.json({
        success: true,
        data: todo
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to update todo'
      });
    }
  }

  async deleteTodo(req, res) {
    try {
      const { id } = req.params;
      const deleted = await this.todoService.deleteTodo(id);
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Todo not found'
        });
      }
      res.json({
        success: true,
        message: 'Todo deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to delete todo'
      });
    }
  }

  async toggleTodo(req, res) {
    try {
      const { id } = req.params;
      const todo = await this.todoService.toggleTodo(id);
      if (!todo) {
        return res.status(404).json({
          success: false,
          message: 'Todo not found'
        });
      }
      res.json({
        success: true,
        data: todo
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to toggle todo'
      });
    }
  }
}

module.exports = { TodoController };`;

  writeFileSafe(
    path.join(targetRoot, "src", "controllers", "TodoController.ts"),
    todoControllerContent
  );

  // Todo routes
  const todoRoutesContent = ext === "ts" ?
    `import express from 'express';
import { TodoController } from '../controllers/TodoController';

const router = express.Router();
const todoController = new TodoController();

router.get('/', todoController.getAllTodos);
router.get('/:id', todoController.getTodoById);
router.post('/', todoController.createTodo);
router.put('/:id', todoController.updateTodo);
router.delete('/:id', todoController.deleteTodo);
router.patch('/:id/toggle', todoController.toggleTodo);

export default router;` :
    `const express = require('express');
const { TodoController } = require('../controllers/TodoController');

const router = express.Router();
const todoController = new TodoController();

router.get('/', todoController.getAllTodos);
router.get('/:id', todoController.getTodoById);
router.post('/', todoController.createTodo);
router.put('/:id', todoController.updateTodo);
router.delete('/:id', todoController.deleteTodo);
router.patch('/:id/toggle', todoController.toggleTodo);

module.exports = router;`;

  writeFileSafe(
    path.join(targetRoot, "src", "routes", "todo.ts"),
    todoRoutesContent
  );

  console.log("✅ Todo demo app generated");
}

export async function generateBlogDemo(targetRoot, ext) {
  console.log("📝 Generating Blog demo app...");
  
  // Blog service
  const blogServiceContent = ext === "ts" ?
    `export interface Post {
  id: string;
  title: string;
  content: string;
  author: string;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Comment {
  id: string;
  postId: string;
  author: string;
  content: string;
  createdAt: Date;
}

export class BlogService {
  private posts: Post[] = [];
  private comments: Comment[] = [];

  constructor() {
    // Initialize with sample data
    this.posts = [
      {
        id: '1',
        title: 'Getting Started with Express.js',
        content: 'Express.js is a minimal and flexible Node.js web application framework...',
        author: 'John Doe',
        published: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '2',
        title: 'Building RESTful APIs',
        content: 'RESTful APIs are a way of providing interoperability between computer systems...',
        author: 'Jane Smith',
        published: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    this.comments = [
      {
        id: '1',
        postId: '1',
        author: 'Alice',
        content: 'Great article! Very helpful.',
        createdAt: new Date()
      }
    ];
  }

  async getAllPosts(): Promise<Post[]> {
    return [...this.posts];
  }

  async getPostById(id: string): Promise<Post | null> {
    return this.posts.find(post => post.id === id) || null;
  }

  async createPost(title: string, content: string, author: string): Promise<Post> {
    const newPost: Post = {
      id: Date.now().toString(),
      title,
      content,
      author,
      published: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.posts.push(newPost);
    return newPost;
  }

  async updatePost(id: string, updates: Partial<Omit<Post, 'id' | 'createdAt'>>): Promise<Post | null> {
    const postIndex = this.posts.findIndex(post => post.id === id);
    if (postIndex === -1) return null;
    
    this.posts[postIndex] = {
      ...this.posts[postIndex],
      ...updates,
      updatedAt: new Date()
    };
    return this.posts[postIndex];
  }

  async deletePost(id: string): Promise<boolean> {
    const postIndex = this.posts.findIndex(post => post.id === id);
    if (postIndex === -1) return false;
    
    this.posts.splice(postIndex, 1);
    // Also delete related comments
    this.comments = this.comments.filter(comment => comment.postId !== id);
    return true;
  }

  async publishPost(id: string): Promise<Post | null> {
    return this.updatePost(id, { published: true });
  }

  async getCommentsByPostId(postId: string): Promise<Comment[]> {
    return this.comments.filter(comment => comment.postId === postId);
  }

  async addComment(postId: string, author: string, content: string): Promise<Comment> {
    const newComment: Comment = {
      id: Date.now().toString(),
      postId,
      author,
      content,
      createdAt: new Date()
    };
    this.comments.push(newComment);
    return newComment;
  }
}` :
    `class BlogService {
  constructor() {
    this.posts = [];
    this.comments = [];
    
    // Initialize with sample data
    this.posts = [
      {
        id: '1',
        title: 'Getting Started with Express.js',
        content: 'Express.js is a minimal and flexible Node.js web application framework...',
        author: 'John Doe',
        published: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '2',
        title: 'Building RESTful APIs',
        content: 'RESTful APIs are a way of providing interoperability between computer systems...',
        author: 'Jane Smith',
        published: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    this.comments = [
      {
        id: '1',
        postId: '1',
        author: 'Alice',
        content: 'Great article! Very helpful.',
        createdAt: new Date()
      }
    ];
  }

  async getAllPosts() {
    return [...this.posts];
  }

  async getPostById(id) {
    return this.posts.find(post => post.id === id) || null;
  }

  async createPost(title, content, author) {
    const newPost = {
      id: Date.now().toString(),
      title,
      content,
      author,
      published: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.posts.push(newPost);
    return newPost;
  }

  async updatePost(id, updates) {
    const postIndex = this.posts.findIndex(post => post.id === id);
    if (postIndex === -1) return null;
    
    this.posts[postIndex] = {
      ...this.posts[postIndex],
      ...updates,
      updatedAt: new Date()
    };
    return this.posts[postIndex];
  }

  async deletePost(id) {
    const postIndex = this.posts.findIndex(post => post.id === id);
    if (postIndex === -1) return false;
    
    this.posts.splice(postIndex, 1);
    // Also delete related comments
    this.comments = this.comments.filter(comment => comment.postId !== id);
    return true;
  }

  async publishPost(id) {
    return this.updatePost(id, { published: true });
  }

  async getCommentsByPostId(postId) {
    return this.comments.filter(comment => comment.postId === postId);
  }

  async addComment(postId, author, content) {
    const newComment = {
      id: Date.now().toString(),
      postId,
      author,
      content,
      createdAt: new Date()
    };
    this.comments.push(newComment);
    return newComment;
  }
}

module.exports = { BlogService };`;

  writeFileSafe(
    path.join(targetRoot, "src", "services", "BlogService.ts"),
    blogServiceContent
  );

  // Blog controller
  const blogControllerContent = ext === "ts" ?
    `import { Request, Response } from 'express';
import { BlogService } from '../services/BlogService';

export class BlogController {
  private blogService: BlogService;

  constructor() {
    this.blogService = new BlogService();
  }

  async getAllPosts(req: Request, res: Response) {
    try {
      const posts = await this.blogService.getAllPosts();
      res.json({
        success: true,
        data: posts
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch posts'
      });
    }
  }

  async getPostById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const post = await this.blogService.getPostById(id);
      if (!post) {
        return res.status(404).json({
          success: false,
          message: 'Post not found'
        });
      }
      res.json({
        success: true,
        data: post
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch post'
      });
    }
  }

  async createPost(req: Request, res: Response) {
    try {
      const { title, content, author } = req.body;
      if (!title || !content || !author) {
        return res.status(400).json({
          success: false,
          message: 'Title, content, and author are required'
        });
      }
      
      const post = await this.blogService.createPost(title, content, author);
      res.status(201).json({
        success: true,
        data: post
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to create post'
      });
    }
  }

  async updatePost(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const post = await this.blogService.updatePost(id, updates);
      if (!post) {
        return res.status(404).json({
          success: false,
          message: 'Post not found'
        });
      }
      
      res.json({
        success: true,
        data: post
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to update post'
      });
    }
  }

  async deletePost(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const deleted = await this.blogService.deletePost(id);
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Post not found'
        });
      }
      res.json({
        success: true,
        message: 'Post deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to delete post'
      });
    }
  }

  async publishPost(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const post = await this.blogService.publishPost(id);
      if (!post) {
        return res.status(404).json({
          success: false,
          message: 'Post not found'
        });
      }
      res.json({
        success: true,
        data: post
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to publish post'
      });
    }
  }

  async getComments(req: Request, res: Response) {
    try {
      const { postId } = req.params;
      const comments = await this.blogService.getCommentsByPostId(postId);
      res.json({
        success: true,
        data: comments
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch comments'
      });
    }
  }

  async addComment(req: Request, res: Response) {
    try {
      const { postId } = req.params;
      const { author, content } = req.body;
      
      if (!author || !content) {
        return res.status(400).json({
          success: false,
          message: 'Author and content are required'
        });
      }
      
      const comment = await this.blogService.addComment(postId, author, content);
      res.status(201).json({
        success: true,
        data: comment
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to add comment'
      });
    }
  }
}` :
    `const { BlogService } = require('../services/BlogService');

class BlogController {
  constructor() {
    this.blogService = new BlogService();
  }

  async getAllPosts(req, res) {
    try {
      const posts = await this.blogService.getAllPosts();
      res.json({
        success: true,
        data: posts
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch posts'
      });
    }
  }

  async getPostById(req, res) {
    try {
      const { id } = req.params;
      const post = await this.blogService.getPostById(id);
      if (!post) {
        return res.status(404).json({
          success: false,
          message: 'Post not found'
        });
      }
      res.json({
        success: true,
        data: post
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch post'
      });
    }
  }

  async createPost(req, res) {
    try {
      const { title, content, author } = req.body;
      if (!title || !content || !author) {
        return res.status(400).json({
          success: false,
          message: 'Title, content, and author are required'
        });
      }
      
      const post = await this.blogService.createPost(title, content, author);
      res.status(201).json({
        success: true,
        data: post
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to create post'
      });
    }
  }

  async updatePost(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const post = await this.blogService.updatePost(id, updates);
      if (!post) {
        return res.status(404).json({
          success: false,
          message: 'Post not found'
        });
      }
      
      res.json({
        success: true,
        data: post
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to update post'
      });
    }
  }

  async deletePost(req, res) {
    try {
      const { id } = req.params;
      const deleted = await this.blogService.deletePost(id);
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Post not found'
        });
      }
      res.json({
        success: true,
        message: 'Post deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to delete post'
      });
    }
  }

  async publishPost(req, res) {
    try {
      const { id } = req.params;
      const post = await this.blogService.publishPost(id);
      if (!post) {
        return res.status(404).json({
          success: false,
          message: 'Post not found'
        });
      }
      res.json({
        success: true,
        data: post
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to publish post'
      });
    }
  }

  async getComments(req, res) {
    try {
      const { postId } = req.params;
      const comments = await this.blogService.getCommentsByPostId(postId);
      res.json({
        success: true,
        data: comments
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch comments'
      });
    }
  }

  async addComment(req, res) {
    try {
      const { postId } = req.params;
      const { author, content } = req.body;
      
      if (!author || !content) {
        return res.status(400).json({
          success: false,
          message: 'Author and content are required'
        });
      }
      
      const comment = await this.blogService.addComment(postId, author, content);
      res.status(201).json({
        success: true,
        data: comment
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to add comment'
      });
    }
  }
}

module.exports = { BlogController };`;

  writeFileSafe(
    path.join(targetRoot, "src", "controllers", "BlogController.ts"),
    blogControllerContent
  );

  // Blog routes
  const blogRoutesContent = ext === "ts" ?
    `import express from 'express';
import { BlogController } from '../controllers/BlogController';

const router = express.Router();
const blogController = new BlogController();

// Posts
router.get('/posts', blogController.getAllPosts);
router.get('/posts/:id', blogController.getPostById);
router.post('/posts', blogController.createPost);
router.put('/posts/:id', blogController.updatePost);
router.delete('/posts/:id', blogController.deletePost);
router.patch('/posts/:id/publish', blogController.publishPost);

// Comments
router.get('/posts/:postId/comments', blogController.getComments);
router.post('/posts/:postId/comments', blogController.addComment);

export default router;` :
    `const express = require('express');
const { BlogController } = require('../controllers/BlogController');

const router = express.Router();
const blogController = new BlogController();

// Posts
router.get('/posts', blogController.getAllPosts);
router.get('/posts/:id', blogController.getPostById);
router.post('/posts', blogController.createPost);
router.put('/posts/:id', blogController.updatePost);
router.delete('/posts/:id', blogController.deletePost);
router.patch('/posts/:id/publish', blogController.publishPost);

// Comments
router.get('/posts/:postId/comments', blogController.getComments);
router.post('/posts/:postId/comments', blogController.addComment);

module.exports = router;`;

  writeFileSafe(
    path.join(targetRoot, "src", "routes", "blog.ts"),
    blogRoutesContent
  );

  console.log("✅ Blog demo app generated");
}
