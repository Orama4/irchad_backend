import { describe, expect, it, afterAll } from "@jest/globals";
import request from "supertest";
import { app, server } from "../../index";

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
  it("should get the count of active users", async () => {
    const res = await request(app).get("/api/active-users/count");

    expect(res.status).toBe(200);
    expect(typeof res.body.activeUsersCount).toBe("number");
    expect(res.body.activeUsersCount).toBeGreaterThanOrEqual(0);
  });

  it("should get the count of inactive users", async () => {
    const res = await request(app).get("/api/inactive-users/count");

    expect(res.status).toBe(200);
    expect(typeof res.body.inactiveUsersCount).toBe("number");
    expect(res.body.inactiveUsersCount).toBeGreaterThanOrEqual(0);
  });

  it("should return user progress statistics", async () => {
    const res = await request(app).get("/api/user-progress").query({ interval: "month" });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);

    res.body.forEach((stat: UserProgressStat) => {
      expect(stat).toHaveProperty("period");
      expect(stat).toHaveProperty("count");
      expect(typeof stat.period).toBe("string");
      expect(typeof stat.count).toBe("number");
    });
  });

  it("should retrieve all blind users", async () => {
    const res = await request(app).get("/api/blind-users");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);

    res.body.forEach((user: BlindUser) => {
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
  });

});