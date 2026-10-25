
# 🛍️ Syntecxhub E-Commerce Store

A modern, responsive E-Commerce Store developed as part of the Syntecxhub Web Development Internship.

## 📌 Project Overview

The E-Commerce Store is a web application that allows users to explore products, search and filter items, manage a shopping cart, and experience a demo checkout process.

## ✨ Features

- Responsive and user-friendly interface
- Product listings with images and details
- Search and category filtering
- Product sorting
- Shopping cart with quantity controls
- Demo checkout functionality
- User registration and login API
- JWT-based authentication
- Admin APIs for managing products and orders
- Optional MongoDB Atlas integration

## 🛠️ Technologies Used

- **Frontend:** React.js, Vite, CSS
- **Backend:** Node.js, Express.js
- **Database:** MongoDB Atlas
- **Authentication:** JSON Web Token (JWT), bcrypt
- **Development Tools:** Visual Studio Code, npm

## 📂 Project Structure

```text
Syntecxhub-E-Commerce-Store/
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── styles.css
│   ├── index.html
│   └── package.json
├── backend/
│   ├── server.js
│   └── package.json
└── README.md
```

## 🚀 Installation and Setup

### Prerequisites

- Node.js and npm installed
- Visual Studio Code

### 1. Clone the Repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd Syntecxhub-E-Commerce-Store
```

### 2. Setup the Backend

```bash
cd backend
npm install
```

Create a `.env` file using `.env.example` as a reference. Configure the MongoDB connection and JWT secret when using authentication and persistent data.

Start the backend:

```bash
npm run dev
```

Backend URL: `http://localhost:5000`

### 3. Setup the Frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

If using PowerShell on Windows, use `npm.cmd` instead of `npm` if script execution is blocked.

Open the local URL displayed in the terminal, usually:

`http://localhost:5173`

## 🔐 Security

- Passwords are hashed using bcrypt.
- JWT is used for protected API routes.
- Secret keys and database credentials should be stored in environment variables.
- Never upload your `.env` file or credentials to GitHub.

## ⚠️ Limitations

- Checkout is a demonstration and does not process real payments.
- MongoDB configuration is required for persistent user accounts and orders.
- A complete visual admin dashboard may require additional development.

## 🎯 Learning Outcomes

- Understanding React components and state management
- Building REST APIs with Express.js
- Implementing authentication concepts
- Connecting an application to MongoDB
- Developing a responsive user interface
- Understanding project setup and deployment

## 👩‍💻 Internship Details

- **Organization:** Syntecxhub
- **Domain:** Web Development
- **Project:** E-Commerce Store

---

**Developed as part of the Syntecxhub Web Development Internship.**
