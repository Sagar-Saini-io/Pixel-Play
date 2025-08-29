# Pixel Play Backend

This is the backend API for a video-sharing platform, built to handle all core functionalities from user authentication to video content management.

## Key Features

* **User Management:** Secure user sign-up, login, and profile management with a robust authentication system.
* **Video Operations:** Endpoints to handle video uploads, retrieval, streaming, and metadata management.
* **Engagement Features:** API support for user interactions, including liking videos, leaving comments, subscribing to channels, and creating playlists.
* **Cloud Integration:** Seamlessly integrates with Cloudinary for efficient and scalable cloud storage of all video content.

## Core Technologies

* **Node.js (Express):** The backend runtime environment and web framework.
* **MongoDB:** The NoSQL database used for storing all application data.
* **Mongoose:** An ODM (Object Data Modeling) library for MongoDB and Node.js.
* **JWT & bcrypt:** Used for secure, token-based authentication and password hashing.
* **Multer:** Middleware for handling `multipart/form-data`, primarily for file uploads.

## API Endpoints

This API provides a comprehensive set of **RESTful** endpoints with full CRUD (Create, Read, Update, Delete) capabilities.

## Setup & Installation

To get this API up and running on your local machine, follow these steps:

1.  **Clone the Repository:**
    ```bash
    git clone [your_repository_url]
    cd [your_project_folder]
    ```
2.  **Install Dependencies:**
    ```bash
    npm install
    ```
3.  **Environment Variables:** Create a `.env` file in the root directory and add the following variables:
    ```
    PORT=5000
    MONGODB_URI=<your_mongodb_connection_string>
    JWT_SECRET=<your_jwt_secret_key>
    CLOUDINARY_CLOUD_NAME=<your_cloudinary_cloud_name>
    CLOUDINARY_API_KEY=<your_cloudinary_api_key>
    CLOUDINARY_API_SECRET=<your_cloudinary_api_secret>
    ```
    * **MONGODB_URI:** Your MongoDB database connection string.
    * **JWT_SECRET:** A long, random string for signing JWT tokens.
    * **Cloudinary credentials:** Your Cloudinary account details for cloud storage.

4.  **Run the Server:**
    ```bash
    npm start
    ```




   

The API will now be running at `http://localhost:5000`. You can use a tool like Postman or a frontend application to interact with it.

---
