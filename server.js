const express = require("express");
const axios = require("axios");
const { Sequelize } = require("sequelize");
const dotenv = require("dotenv");
const { createCanvas } = require("canvas");
const fs = require("fs");

dotenv.config();
const { sequelize, Country } = require("./models/Country");

const app = express();
const port = process.env.PORT;
app.use(express.json());

(async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully.');
    await sequelize.sync({ alter: true });
    console.log('Tables synchronized successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
})();

// Fetch countries and exchange rates from external APIs
const fetchCountriesData = async () => {
  try {
    const countriesResponse = await axios.get("https://restcountries.com/v2/all?fields=name,capital,region,population,flag,currencies");
    const exchangeRatesResponse = await axios.get("https://open.er-api.com/v6/latest/USD");
    return { countriesData: countriesResponse.data, exchangeRates: exchangeRatesResponse.data.rates };
  } catch (error) {
    throw new Error("Error fetching external data.");
  }
};

// POST /countries/refresh - Refresh country data and update the database
app.post("/countries/refresh", async (req, res) => {
  try {
    // Fetch country data and exchange rates
    const { countriesData, exchangeRates } = await fetchCountriesData();

    for (let country of countriesData) {
      let currencyCode = null;

      // Handle cases where no currency is available
      if (country.currencies && country.currencies.length > 0) {
        currencyCode = country.currencies[0].code;  // Get the first currency code
      }

      // Get the exchange rate from the external API (if currency code exists)
      let exchangeRate = null;
      if (currencyCode && exchangeRates[currencyCode]) {
        exchangeRate = exchangeRates[currencyCode];
      }

      // Calculate estimated GDP (only if valid currency and exchange rate are available)
      let estimatedGdp = 0;
      if (currencyCode && exchangeRate) {
        estimatedGdp = country.population * (Math.random() * (2000 - 1000) + 1000) / exchangeRate;
      }

      // Prepare country data to store or update in the database
      const countryData = {
        name: country.name,
        capital: country.capital,
        region: country.region,
        population: country.population,
        currency_code: currencyCode, // Set null if currency is missing
        exchange_rate: exchangeRate, // Set null if exchange rate is not found
        estimated_gdp: estimatedGdp, // Set GDP if calculated, else it will be 0
        flag_url: country.flag,
        last_refreshed_at: new Date(), // Timestamp for when the data was last refreshed
      };

      // Check if the country already exists in the database (case-insensitive)
      const existingCountry = await Country.findOne({ where: { name: country.name } });

      if (existingCountry) {
        // If the country exists, update it (including recalculating GDP)
        await existingCountry.update(countryData);
      } else {
        // If the country doesn't exist, create a new record
        await Country.create(countryData);
      }
    }

    // After saving countries, generate the summary image
    await generateSummaryImage();

    // Send success response
    res.status(200).json({ message: "Data refreshed successfully" });
  } catch (error) {
    // Handle errors fetching external data
    res.status(503).json({ error: "External data source unavailable", details: error.message });
  }
});

// GET /countries - Get all countries with optional filters (region, currency, sort by GDP)
app.get("/countries", async (req, res) => {
  const { region, currency, sort } = req.query;

  let query = { where: {} };

  if (region) query.where.region = region;
  if (currency) query.where.currency_code = currency;

  if (sort === "gdp_desc") {
    query.order = [["estimated_gdp", "DESC"]];
  }

  try {
    const countries = await Country.findAll(query);
    res.status(200).json(countries);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Serve the summary image
app.get("/countries/image", async (req, res) => {
  try {
    const imagePath = "cache/summary.png";

    const fs = require("fs");
    if (fs.existsSync(imagePath)) {
      res.sendFile(imagePath, { root: __dirname });
    } else {
      res.status(404).json({ error: "Summary image not found" });
    }
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /countries/:name - Get a specific country by name
app.get("/countries/:name", async (req, res) => {
  try {
    const country = await Country.findOne({ where: { name: req.params.name } });
    if (!country) {
      return res.status(404).json({ error: "Country not found" });
    }
    res.status(200).json(country);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /countries/:name - Delete a country record
app.delete("/countries/:name", async (req, res) => {
  try {
    const country = await Country.findOne({ where: { name: req.params.name } });
    if (!country) {
      return res.status(404).json({ error: "Country not found" });
    }
    await country.destroy();
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /status - Get the status of the API
app.get("/status", async (req, res) => {
  try {
    const totalCountries = await Country.count();
    const lastRefresh = await Country.max('last_refreshed_at');
    res.status(200).json({ total_countries: totalCountries, last_refreshed_at: lastRefresh });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Generate a summary image after refreshing data
const generateSummaryImage = async () => {
  try {
    // Fetch all countries from the database
    const countries = await Country.findAll();
    const topCountries = countries
      .sort((a, b) => b.estimated_gdp - a.estimated_gdp)
      .slice(0, 5);

    const totalCountries = countries.length;
    const lastRefresh = new Date().toISOString();

    // Create a canvas and get the 2D context to draw on it
    const canvas = createCanvas(800, 600);
    const ctx = canvas.getContext("2d");

    // Set the background color to white
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Set up text properties for drawing on the canvas
    ctx.font = '20px Arial';
    ctx.fillStyle = 'black';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Draw the total number of countries
    ctx.fillText(`Total Countries: ${totalCountries}`, 400, 50);

    let yPosition = 100;
    for (let i = 0; i < topCountries.length; i++) {
      const country = topCountries[i];
      ctx.fillText(`${country.name}: ${country.estimated_gdp.toFixed(2)}`, 400, yPosition);
      yPosition += 30;
    }

    // Draw the last refresh timestamp
    ctx.fillText(`Last Refreshed: ${lastRefresh}`, 400, yPosition);

    // Save the canvas as a PNG file in the 'cache' directory
    const out = fs.createWriteStream("country-currency-exchange-api/cache/summary.png");
    const stream = canvas.createPNGStream();
    stream.pipe(out);
    out.on("finish", () => {
      console.log("Summary image generated successfully.");
    });
  } catch (error) {
    console.error("Error generating summary image:", error);
  }
};

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});