# TODO: Frontend Login and Signup Page Implementation

## Completed Tasks
- [x] Create `frontend/signup.html` with HTML form including email, password, confirm password, and role selection fields
- [x] Link to existing `style.css` for consistent styling
- [x] Add inline JavaScript for form validation and submission to backend API (`http://localhost:5000/api/auth/register`)
- [x] Implement client-side validation (required fields, password match, password length)
- [x] Handle API responses (success/error) and display messages
- [x] Add redirect to login page on successful signup
- [x] Include security headers and navigation controls consistent with other pages
- [x] Create `frontend/login.html` with HTML form including email and password fields
- [x] Add inline JavaScript for form validation and submission to backend API (`http://localhost:5000/api/auth/login`)
- [x] Implement client-side validation (required fields)
- [x] Handle API responses (success/error) and display messages
- [x] Store JWT token and user role in localStorage on successful login
- [x] Add redirect to appropriate page based on user role (staff to staff.html, student to appointment.html)
- [x] Include security headers and navigation controls consistent with other pages

## Remaining Tasks
- [ ] Test the signup functionality:
  - Start the backend server (`npm start` in backend directory)
  - Open `frontend/signup.html` in browser
  - Submit the form with valid data
  - Verify user is created in MongoDB
  - Check error handling for invalid inputs
- [ ] Test the login functionality:
  - Start the backend server (`npm start` in backend directory)
  - Open `frontend/login.html` in browser
  - Submit the form with valid credentials
  - Verify JWT token is stored in localStorage
  - Check redirect to appropriate page based on role
  - Check error handling for invalid credentials
- [ ] Verify user creation in MongoDB (check database for new user entries)
- [ ] Test edge cases (duplicate email, weak password, network errors, invalid login)
