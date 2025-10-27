# Country Currency & Exchange API

This is a RESTful API that fetches country data, including currencies, and provides CRUD operations on the data. It calculates the estimated GDP of each country based on population and exchange rates.

## **Features**

- Fetch country data from the [RestCountries API](https://restcountries.com/v2/all?fields=name,capital,region,population,flag,currencies).
- Fetch exchange rates from the [Open Exchange Rates API](https://open.er-api.com/v6/latest/USD).
- Store country data in a MySQL database.
- Provide CRUD operations for countries:
  - **POST /countries/refresh**: Refresh country data and exchange rates, store them in the database.
  - **GET /countries**: Get all countries with optional filters (e.g., by region, currency, and sorting by GDP).
  - **GET /countries/:name**: Get a specific country by name.
  - **DELETE /countries/:name**: Delete a country record.
  - **GET /status**: Show total number of countries and the timestamp of the last refresh.
  - **GET /countries/image**: Serve a summary image of the top 5 countries by GDP.

## **Tech Stack**

- **Backend**: Node.js with Express
- **Database**: MySQL with Sequelize ORM
- **External APIs**: RestCountries API, Open Exchange Rates API
- **Image Generation**: Sharp for generating summary images

## **Setup Instructions**

### 1. Clone the repository
```bash
git clone https://github.com/calculus-guy/HNG_TWO_TASK.git
cd country-currency-exchange-api


2. Install dependencies
npm install express axios mysql2 sequelize dotenv sharp

3. Create a .env file

Create a .env file in the root directory of the project and add the following configuration:

DB_HOST: Database host (default localhost).

DB_USER: Database username (default root).

DB_PASSWORD: Database password.

DB_NAME: Database name (default country_currency_exchange).

PORT: Port for the server (default 8080).

4. Set up MySQL Database

Ensure that MySQL is installed and running. Create the country_currency_exchange database and the countries table.

Log in to MySQL:

mysql -u root -p


Create the database and table:

CREATE DATABASE country_currency_exchange;

USE country_currency_exchange;

CREATE TABLE countries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  capital VARCHAR(255),
  region VARCHAR(255),
  population INT NOT NULL,
  currency_code VARCHAR(10) NOT NULL,
  exchange_rate FLOAT,
  estimated_gdp FLOAT,
  flag_url VARCHAR(255),
  last_refreshed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

5. Start the server

Run the server using the following command:

npm start


The server will be available at http://localhost:8080.

6. Test the API

You can test the API using Postman. Below are the endpoints available.

POST /countries/refresh

Fetches country data and exchange rates, stores or updates it in the database, and generates a summary image.

Response:

200 OK on success.

503 Service Unavailable if the external data source fails.

GET /countries

Fetches all countries with optional filters like region, currency, and sorting by GDP.

Query Parameters:

region: Filter by region (e.g., Africa).

currency: Filter by currency code (e.g., NGN).

sort: Sort by GDP (gdp_desc for descending order).

Response:

200 OK with a list of countries.

GET /countries/:name

Fetches a specific country by name.

Response:

200 OK with the country data.

404 Not Found if the country is not found.

DELETE /countries/:name

Deletes a specific country by name.

Response:

204 No Content on successful deletion.

404 Not Found if the country is not found.

GET /status

Returns the total number of countries and the last refresh timestamp.

Response:

200 OK with the total number of countries and last refreshed timestamp.

GET /countries/image

Serves the generated summary image showing the top 5 countries by GDP.

Response:

200 OK with the image file.

404 Not Found if the image is not found.

Testing

You can test the API using Postman or cURL:

Test POST /countries/refresh:

curl -X POST http://localhost:8080/countries/refresh


Test GET /countries:

curl http://localhost:8080/countries?region=Africa


Test GET /countries/:name:

curl http://localhost:8080/countries/Nigeria


Test DELETE /countries/:name:

curl -X DELETE http://localhost:8080/countries/Nigeria


Test GET /status:

curl http://localhost:8080/status


Test GET /countries/image:

curl http://localhost:8080/countries/image