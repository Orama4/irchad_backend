import { describe, expect, it, afterAll } from "@jest/globals";
import request from "supertest";
import { app, server } from "..";
interface UserProgressStat {
  period: string;
  count: number;
}

interface BlindUser {
  id: string;
  status: string;
  user: {
    profile?: {
      firstname: string;
      lastname: string;
      phonenumber: string;
      address: string;
    };
  };
}

/**
 * User API Tests
 */
describe("User API Tests", () => {
  beforeAll((done) => {
    let baseUrl: string;
    // Récupérer le port dynamiquement
    const address = server.address();
    if (address && typeof address !== "string") {
        baseUrl = `http://localhost:${address.port}`;
    }
    done();
});
  it("should get the count of active users", async () => {
    const res = await request(app).get("/users/active-users/count");

    expect(res.status).toBe(200);
    expect(typeof res.body.activeUsersCount).toBe("number");
    expect(res.body.activeUsersCount).toBeGreaterThanOrEqual(0);
  });

  it("should get the count of inactive users", async () => {
    const res = await request(app).get("/users/inactive-users/count");

    expect(res.status).toBe(200);
    expect(typeof res.body.inactiveUsersCount).toBe("number");
    expect(res.body.inactiveUsersCount).toBeGreaterThanOrEqual(0);
  });

  it("should return user progress statistics", async () => {
    const res = await request(app).get("/users/user-progress").query({ interval: "month" });

    // Check the response status
    expect(res.status).toBe(200);

    // Check that the response is an array
    expect(Array.isArray(res.body)).toBe(true);

    // Check the structure of each object in the array
    res.body.forEach((stat: any) => {
        expect(stat).toHaveProperty("name"); // Check for "name" property
        expect(stat).toHaveProperty("value"); // Check for "value" property
        expect(typeof stat.name).toBe("string"); // "name" should be a string
        expect(typeof stat.value).toBe("number"); // "value" should be a number
    });

    // Optionally, check that all months are present and in order
    const expectedMonths = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];
    res.body.forEach((stat: any, index: number) => {
        expect(stat.name).toBe(expectedMonths[index]); // Ensure months are in order
    });
});

it("should retrieve all blind users", async () => {
  const res = await request(app).get("/users");

  // Check the response status
  expect(res.status).toBe(200);

  // Check the response structure
  expect(typeof res.body).toBe("object");
  expect(res.body).toHaveProperty("users");
  expect(res.body).toHaveProperty("totalPages");
  expect(res.body).toHaveProperty("currentPage");

  // Check that "users" is an array
  expect(Array.isArray(res.body.users)).toBe(true);

  // Check each user in the "users" array
  res.body.users.forEach((user: any) => {
      expect(user).toHaveProperty("id");
      expect(user).toHaveProperty("status");
      expect(user).toHaveProperty("user");

      if (user.user) {
          expect(user.user).toHaveProperty("profile");
          if (user.user.profile) {
              expect(user.user.profile).toHaveProperty("firstname");
              expect(user.user.profile).toHaveProperty("lastname");
              expect(user.user.profile).toHaveProperty("phonenumber");
              expect(user.user.profile).toHaveProperty("address");
          }
      }
  });

  // Optionally, check pagination fields
  expect(typeof res.body.totalPages).toBe("number");
  expect(typeof res.body.currentPage).toBe("number");
  expect(res.body.totalPages).toBeGreaterThanOrEqual(1);
  expect(res.body.currentPage).toBeGreaterThanOrEqual(1);
});

 afterAll((done) => {
        server.close(done);
    });

});