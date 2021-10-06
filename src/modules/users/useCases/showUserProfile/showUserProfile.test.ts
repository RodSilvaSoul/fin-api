import "dotenv/config";
import { sign } from "jsonwebtoken";
import {
  Connection,
  Repository,
  getConnectionOptions,
  getRepository,
  createConnection,
} from "typeorm";

import config from "../../../../config/auth";
import request from "supertest";

import { User } from "../../entities/User";
import { ICreateUserDTO } from "../createUser/ICreateUserDTO";
import { app } from "../../../../app";

describe("#ShowUserProfile integration", () => {
  let connection: Connection;
  let userRepository: Repository<User>;
  let defaultUser: ICreateUserDTO;

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

    userRepository = getRepository(User);

    defaultUser = {
      email: "email@gmail.com",
      name: "any_name",
      password: "any_password",
    };

    const userInstance = userRepository.create({ ...defaultUser });
    await userRepository.save(userInstance);
  });

  afterAll(async () => {
    await connection.close();
  });

  it("should get the profile data of an authenticate user", async () => {
    const jwt = sign(defaultUser, config.jwt.secret);

    const response = await request(app)
      .get("/api/v1/profile")
      .set("authorization", `bearer ${jwt}`)
      .expect(200);

    const { body } = response;

    const expectedData = {
      name: defaultUser.name,
      email: defaultUser.email,
    };

    expect(body).toEqual(expect.objectContaining(expectedData));
    expect(body).toHaveProperty("id");
  });

  it("should not get the profile data if missing the jwt", async () => {
    const response = await request(app).get("/api/v1/profile").expect(401);

    const { body } = response;

    expect(body).toHaveProperty("message");
  });

  it("should not get the profile data given a invalid jwt", async () => {
    const jwt = sign(defaultUser, "invalid_secret");

    const response = await request(app)
      .get("/api/v1/profile")
      .set("authorization", `bearer ${jwt}`)
      .expect(401);

    const { body } = response;

    expect(body).toHaveProperty("message");
  });
});
