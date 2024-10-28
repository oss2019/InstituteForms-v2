# Library Management System #

## Project Overview ##
- This is a Smart LMS where books borrowed and returned.
- The user can login with their IITDH student email and borrow or return. THe user has to be a IITDH student to signup first to set the password then login with the set password.
- The user wil get notified to return the book and also get a email about it.
- The admin can see the users, their borrowed books, and add, edit or remove a book.
- In this website the user can access the whole database of books, and also search, filter and sort them.
- The user gets the recommended books based on his branch
## Tech Stack
### Frontend
- Developed using React and Vite for a fast and reactive user interface.
### Styling
- Bootstrap 5 and Material UI for templates.
- Vanilla CSS for custom styling.
- Tailwind CSS for minified styling.
### Backend
- node.js and express.js for backend server.
- axios to connect the backend with frontend securely.
- jsonwebtoken for secure authentication.
### Database
- MongoDB for storing data.

## Using the repository
### BackEnd 
```bash
  `cd backend`
```
- Go to the backend folder.
```bash
   `npm i`
```
- Install the node modules.
```bash
    `npm start`
```
- Starts the backend server.

### FrontEnd 
```bash
  `cd frontend`
```
- Go to the frontend folder.
```bash
  `npm i`
```
- Install the node modules.
```bash
  `npm run dev`
```
- Runs the application in development mode.
- If either of them is not run then the website won't load

## People Behind this
  * K Varshith - Frontend(React structure,CSS and Animation)
  * Yash Halbhavi - Frontend(React Structure and functionality)
  * Prajwal Koppad - Backend
  * Suhas - Database Management
## For the judges to test:
- A sample user:
email: ```EE23BT035@iitdh.ac.in```
password ```HelloPrajwal```
- A sample admin:
email: ```kamatham.varshith@gmail.com```
password ```HelloPrajwal```
