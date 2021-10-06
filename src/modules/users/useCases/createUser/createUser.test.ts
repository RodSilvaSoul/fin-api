import { Connection, getConnectionOptions, createConnection } from "typeorm";
import request from "supertest";

import { app } from "../../../../app";
import { ICreateUserDTO } from "./ICreateUserDTO";

describe("#CreateUser integration", () => {
  let connection: Connection;

  let defaultUser: ICreateUserDTO = {
    email: "email@gmail.com",
    name: "any_name",
    password: "any_password",
  };

  beforeAll(async () => {
    const defaultOptions = await getConnectionOptions();

    connection = await createConnection(
      Object.assign(defaultOptions, {
        database: "test",
        port: 5433,
      })
    );

    await connection.query("DROP TABLE IF EXISTS statements");
    await connection.query("DROP TABLE IF EXISTS users");
    await connection.query("DROP TABLE IF EXISTS migrations");

    await connection.runMigrations();
  });

  afterAll(async () => {
    await connection.close();
  });

  it("should create a user given an not registered email", async () => {
    const response = await request(app)
      .post("/api/v1/users")
      .send(defaultUser)
      .expect(201);

    const { body } = response;

    expect(body).not.toEqual(expect.objectContaining(defaultUser));
  });

  it("should not create a user given an registered email", async () => {
    const response = await request(app)
      .post("/api/v1/users")
      .send(defaultUser)
      .expect(400);

    const { body } = response;

    expect(body).toHaveProperty("message");
  });
});
