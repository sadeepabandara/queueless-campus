Project Overview

This project demonstrates the containerisation and deployment of the Queueless Campus application using Docker. The objective was to ensure that the system runs reliably in a clean environment without requiring manual dependency installation.

The application consists of a backend service connected to a MongoDB database, both orchestrated using Docker Compose. Containerisation improves portability, consistency, and ease of setup, allowing the application to be executed seamlessly on any machine with Docker installed.

The system was tested in a fresh containerised environment to verify that all services start correctly and that database-backed features operate as expected.

Technologies Used

Node.js

Express.js

MongoDB

Docker

Docker Compose

These technologies were selected to support scalable deployment and reproducible runtime environments.

Prerequisites

Before running the application install the following:

Docker Desktop (Recommended)
 https://www.docker.com/products/docker-desktop


Forking and Cloning the Repository
 Step 1 — Fork the Repository

Click the Fork button on GitHub to create your own copy of the repository.

 Step 2 — Clone Your Fork

Open a terminal and run:

git clone <YOUR_GITHUB_REPO_LINK>
cd <PROJECT_FOLDER>

This downloads the project to your local machine.

 Environment Configuration

How to Execute the Application


 Step 1 — Build and Start Containers

From the root directory, run:

docker compose up --build


   This command will:

Build the backend image

Start the MongoDB container

Configure networking between services

Launch the server

The initial build may take a few minutes.

 Step 2 — Verify the Application is Running

Open your browser and navigate to:

http://localhost:5000


  
To uniquely identify this submission, the following endpoint has been implemented:

 Endpoint:
GET http://localhost:5000/api/student

  Expected Response:
{
  "name": "Dhwani PANKAJKUMAR Thakor",
  "studentId": "s225731075"
}


This endpoint is publicly accessible and does not require authentication.

  Testing the Application
  Recommended Testing Tool

Install Thunder Client (VS Code Extension)
or use Postman.

 Thunder Client:
https://marketplace.visualstudio.com/items?itemName=rangav.vscode-thunder-client
 
 Register a User

Send a POST request:

POST http://localhost:5000/api/auth/register

Example JSON Body:
{
 "email": "testuser@gmail.com",
 "password": "Test@123",
 "role": "student"
}


Successful registration confirms database write functionality.

 Login

Send:

POST http://localhost:5000/api/auth/login


A successful response will return a JWT token, confirming that the database connection and authentication system are functioning correctly.

    Viewing the Database from VS Code Terminal

The database can be inspected directly through the Docker container.

Step 1 — Open VS Code Terminal

Go to:

Terminal → New Terminal

Step 2 — List Running Containers
docker ps


Copy the MongoDB container name.

Step 3 — Access Mongo Shell
docker exec -it <mongo-container-name> mongosh

Step 4 — Display Databases
show dbs

Step 5 — Use Application Database
use queueless-campus

Step 6 — Show Collections
show collections

Step 7 — View Registered Users
db.users.find().pretty()


This confirms that the application is successfully storing data within MongoDB.

 Security Considerations

To enhance security:

Sensitive credentials are not hardcoded

Environment variables are used for configuration

The .env file is excluded from version control

This ensures confidential data is not publicly exposed while still allowing the marker to run the application using the provided instructions.

Stopping the Application

To stop all running containers:

docker compose down

Note

The application was tested in a fresh containerised environment to ensure reliability and reproducibility. Clear execution steps have been provided so that the marker can run the system without ambiguity.

