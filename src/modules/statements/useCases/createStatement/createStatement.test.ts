import {
  Connection,
  getConnectionOptions,
  createConnection,
  Repository,
  getRepository,
} from "typeorm";
import "dotenv/config";

import config from "../../../../config/auth";
import request from "supertest";

import { v4 as uuidV4 } from "uuid";
import { sign } from "jsonwebtoken";

import { User } from "../../../users/entities/User";
import { ICreateUserDTO } from "../../../users/useCases/createUser/ICreateUserDTO";
import { Statement } from "../../entities/Statement";
import { ICreateStatementDTO } from "../createStatement/ICreateStatementDTO";
import { app } from "../../../../app";

describe("#CreateStatement integration", () => {
  let connection: Connection;
  let usersRepository: Repository<User>;

  const defaultUserId = uuidV4();

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

    usersRepository = getRepository(User);

    await connection.query("DROP TABLE IF EXISTS statements");
    await connection.query("DROP TABLE IF EXISTS users");
    await connection.query("DROP TABLE IF EXISTS migrations");

    await connection.runMigrations();

    const userInstance = usersRepository.create({
      ...defaultUser,
      id: defaultUserId,
    });
    await usersRepository.save(userInstance);
  });

  afterAll(async () => {
    await connection.close();
  });

  it("should crate a statement of type deposit given an authenticated user", async () => {
    const jwt = sign({}, config.jwt.secret, {
      subject: defaultUserId,
    });

    const requestParams = {
      amount: 100,
      description: "integration deposit",
    };

    const response = await request(app)
      .post("/api/v1/statements/deposit")
      .send({ ...requestParams })
      .set("authorization", `bearer ${jwt}`)
      .expect(201);

    const { body } = response;

    expect(body).toEqual(expect.objectContaining(requestParams));
  });

  it("should crate a statement of type withdraw given  an authenticated user with founds", async () => {
    const jwt = sign({}, config.jwt.secret, {
      subject: defaultUserId,
    });

    const requestParams = {
      amount: 100,
      description: "integration withdraw",
    };

    const response = await request(app)
      .post("/api/v1/statements/withdraw")
      .send({ ...requestParams })
      .set("authorization", `bearer ${jwt}`)
      .expect(201);

    const { body } = response;

    expect(body).toEqual(expect.objectContaining(requestParams));
  });

  it("should not crate a statement of type withdraw given an authenticated user with no funds", async () => {
    const jwt = sign({}, config.jwt.secret, {
      subject: defaultUserId,
    });

    const requestParams = {
      amount: 100,
      description: "integration withdraw",
    };

    const response = await request(app)
      .post("/api/v1/statements/withdraw")
      .send({ ...requestParams })
      .set("authorization", `bearer ${jwt}`)
      .expect(400);

    const { body } = response;

    expect(body).toHaveProperty("message");
  });

  it("should not create a statement of any type given an invalid jwt", async () => {
    const jwt = sign({}, "invalid_secret", {
      subject: defaultUserId,
    });

    const response = await request(app)
      .post("/api/v1/statements/withdraw")
      .set("authorization", `bearer ${jwt}`)
      .expect(401);

    const { body } = response;

    expect(body).toHaveProperty("message");
  });

  it("should not create a statement of any type if missing the jwt", async () => {
    const response = await request(app)
      .post("/api/v1/statements/withdraw")
      .expect(401);

    const { body } = response;

    expect(body).toHaveProperty("message");
  });
});
