# Interview Question Prectice for node js,express js and multer in typescript.

This repository contains a solution to a common interview question for a backend development position. The question involves creating CRUD operations for managing student and teacher data, assigning random teachers to students, implementing rating functionality, and fetching specific data based on certain criteria.

## Installation

1. **Clone the repository:**
    ```bash
    git clone https://github.com/pritkheni/kmphitech_interview.git
    ```

2. **Navigate to the project directory:**
    ```bash
    cd kmphitech_interview
    ```

3. **Install necessary dependencies:**
    ```bash
    npm install
    ```

4. **Create a `.env` file in the root directory with the following variables:**
    ```plaintext
    PORT=5000
    DB_USER=youe user name
    DB_HOST=your host name
    DB_NAME=your database name
    DB_PASSWORD=you password
    DB_PORT=5432
    ```

5. **Set up your PostgreSQL database using Docker by running the following command:**
    ```bash
    docker run --name <your_container_name> -e POSTGRES_PASSWORD=<your password> -d -p 5432:5432 postgres
    ```

6. **Update the database configuration in `database/db.ts` to use the environment variables defined in the `.env` file.**

7. **Run the application:**
    ```bash
    npm run dev
    ```

## Usage

- Use Postman or any API testing tool to interact with the API endpoints.
- Explore the routes in `routes/` to understand the available endpoints and their functionality.

## Additional Notes

- This solution is implemented using Node.js with Express.js framework and PostgreSQL as the database.
- In the future, a MongoDB version of this solution may be provided.
- Feel free to modify or extend the solution according to your requirements or for further practice.
- If you need to interact with the PostgreSQL container using the command line, you can use the following command:
    ```bash
    docker exec -it <your_container_name> psql -U postgres -d postgres
    ```

## Disclaimer

This solution is provided as a demonstration of skills and is not intended for production use without thorough testing and validation.
