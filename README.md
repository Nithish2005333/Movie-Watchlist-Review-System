# 🎬 Movie Watchlist Review System

A modern web application for managing your personal movie watchlist with **user authentication**, **MongoDB integration**, and a **responsive frontend**.

---

## ✨ Features
- 🔐 **User Authentication** – Secure login & registration  
- 👤 **User-Specific Watchlists** – Each user sees only their own movies  
- 🎥 **Movie Management** – Add, view, and delete movies from your watchlist  
- 🗄️ **MongoDB Atlas Integration** – Persistent cloud database  
- 📱 **Responsive Design** – Works on desktop, tablet, and mobile  
- 🔑 **Session Management** – Secure session-based authentication  

---

## 🚀 Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v14 or higher)  
- [MongoDB Atlas](https://www.mongodb.com/atlas) account (or local MongoDB)  
- npm or yarn  

### 2. Installation

# Clone the repo
git clone https://github.com/Nithish2005333/Movie-Watchlist-Review-System.git
cd Movie-Watchlist-Review-System

# Install dependencies
npm install


### 3. Set Up Environment Variables

Create a `.env` file in the root directory:

env
MONGO_URI=mongodb+srv://your-username:your-password@your-cluster.mongodb.net/movievault
PORT=3000

### 4. Run the Application

npm start


Open your browser and go to 👉 `http://localhost:3000`

---

## 🛠️ API Endpoints

### 🔑 Authentication

* `POST /api/register` → Register a new user
* `POST /api/login` → Login user
* `POST /api/logout` → Logout user

### 🎥 Movies (Requires Authentication)

* `GET /api/movies` → Get user’s watchlist
* `POST /api/movies` → Add movie to watchlist
* `DELETE /api/movies/:id` → Delete movie from watchlist

### ✅ Health Check

* `GET /api/health` → Server status & DB connection

---

## 📱 Frontend Pages

1. **Login Page** (`/`) – User authentication
2. **Register Page** (`/register`) – New user signup
3. **Movies Page** (`/movies`) – Dashboard for adding/viewing movies
4. **Watchlist Page** (`/watchlist`) – Personal movie collection

---

## 🔒 Security

* 🔑 Passwords hashed with **bcrypt**
* 🔑 Session-based authentication
* ✅ Input validation
* 🛡️ User data isolation

---


## 🤝 Contributing

1. Fork this repository
2. Create a new feature branch
3. Make your changes
4. Commit & push
5. Submit a Pull Request

---

## 📄 License

This project is licensed under the **MIT License**.

---

## 👨‍💻 Author

**Nithishwaran A.**
Built with ❤️ using HTML, CSS, JS, Node.js, Express, MongoDB, and vanilla JS.



