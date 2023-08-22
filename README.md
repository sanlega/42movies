Movie Voting App 🎬
===================

Welcome to the Movie Voting App! This application allows users to vote for their favorite movies or suggest a new one. The authentication is done using the 42 API, ensuring that only 42 school members can participate.

  
_Screenshot of the Movie Voting App_

Features 🌟
-----------

*   **42 API Authentication**: Only members of the 42 school can log in and participate.
*   **Vote for Movies**: Users can vote for their favorite movies.
*   **Suggest a Movie**: If your favorite movie isn't on the list, you can add it!
*   **Docker Support**: Easily set up and run the app using Docker.

Prerequisites 📋
----------------

Before you begin, ensure you have met the following requirements:

*   [Node.js](https://nodejs.org/)
*   [MongoDB](https://www.mongodb.com/)
*   [Docker](https://www.docker.com/) (optional)

Setup and Installation 🛠️
--------------------------

1.  **Clone the Repository**:
    
    ```bash
    git clone https://github.com/your-username/movie-voting-app.git
    cd movie-voting-app
    
    ```
    
2.  **Setup Environment Variables**:
    
    Rename the `.env.example` file to `.env` and fill in the required fields:
    
    ```makefile
    MONGO_URI=your_mongodb_uri
    CLIENT_ID=your_42_api_client_id
    CLIENT_SECRET=your_42_api_client_secret
    REDIRECT_URI=your_42_api_callback_redirect_uri
    ```
    
    ⚠️ **Important**: Never commit your `.env` file. It contains sensitive information.
    
3.  **Install Dependencies**:
    
    ```bash
    npm install
    
    ```
    
4.  **Run the App**:
    
    ```bash
    npm start
    
    ```
    
    Alternatively, if you're using Docker:
    
    ```bash
    docker-compose up
    
    ```
    

Contributing 🤝
---------------

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.
