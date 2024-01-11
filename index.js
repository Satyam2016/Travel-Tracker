import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const db = new pg.Client({
  host: "localhost",
  user: "postgres",
  password: "satyam",
  port: 5432,
  database: "World",
});

db.connect();

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

async function checkVisited() {
  try {
    const result = await db.query("SELECT country_code FROM visited_country");
    let countries = [];
    result.rows.forEach((country) => {
        countries.push(country.country_code);
    });
    return countries;
  } catch (error) {
    console.error("Error querying visited countries:", error);
    throw error;
  }
}

app.get("/", async (req, res) => {
  try {
    const countries = await checkVisited();
    console.log(countries);
    res.render("index.ejs", {
      countries: countries,
      total: countries.length,
    });
  } catch (error) {
    res.status(500).render("error.ejs", { error: "Internal Server Error" });
  }
});

app.post("/add", async (req, res) => {
  const country_name = req.body.country.toLowerCase();
  try {
    const result = await db.query("SELECT country_code FROM countries WHERE LOWER(country_name)=$1", [country_name]);
    if (result.rows.length === 0) {
      throw new Error("Country name does not exist, try again...");
    }

    const country_code = result.rows[0].country_code;

    const result1 = await db.query("SELECT country_code FROM visited_country WHERE country_code=$1", [country_code]);

    if (result1.rows.length !== 0) {
      throw new Error("Country has already been added, try again.");
    }

    await db.query("INSERT INTO visited_country (country_code) VALUES ($1)", [country_code]);
    res.redirect("/");

  } catch (error) {
    console.error(error);
    const countries = await checkVisited();
    res.render("index.ejs", {
      countries: countries,
      total: countries.length,
      error: error.message,
    });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
