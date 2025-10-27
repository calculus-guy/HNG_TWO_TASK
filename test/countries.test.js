const request = require("supertest");
const app = require("../server");

describe("POST /countries/refresh", () => {
  it("should refresh country data and return 200", async () => {
    const res = await request(app).post("/countries/refresh");
    expect(res.status).toBe(200);
  });
});

describe("GET /countries", () => {
  it("should fetch countries and return 200", async () => {
    const res = await request(app).get("/countries?region=Africa");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("data");
  });
});

describe("GET /countries/:name", () => {
  it("should fetch a specific country", async () => {
    const res = await request(app).get("/countries/Nigeria");
    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Nigeria");
  });
});

describe("DELETE /countries/:name", () => {
  it("should delete a country", async () => {
    const res = await request(app).delete("/countries/Nigeria");
    expect(res.status).toBe(204);
  });
});