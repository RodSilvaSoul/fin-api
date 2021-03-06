import {
  Connection,
  createConnection,
  getRepository,
  Repository,
  getConnectionOptions,
} from "typeorm";
import { hash } from "bcryptjs";
import request from "supertest";

import { User } from "../../entities/User";
import { app } from "../../../../app";
import { ICreateUserDTO } from "../createUser/ICreateUserDTO";

describe("#AuthenticateUseCase integration", () => {
  let connection: Connection;
  let userRepository: Repository<User>;
  let defaultUser: ICreateUserDTO;

  const passwordWithoutHash = "123";

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
      password: await hash(passwordWithoutHash, 8),
    };

    const userInstance = userRepository.create({ ...defaultUser });
    await userRepository.save(userInstance);
  });

  afterAll(async () => {
    await connection.close();
  });

  test("should authenticate a user given valid credentials", async () => {
    const reqParams = {
      email: defaultUser.email,
      password: passwordWithoutHash,
    };

    const response = await request(app)
      .post("/api/v1/sessions")
      .send(reqParams)
      .expect(200);

    const { body } = response;

    expect(body.user).toEqual(
      expect.objectContaining({
        name: defaultUser.name,
        email: defaultUser.email,
      })
    );

    expect(body.user).not.toHaveProperty("password");

    expect(body).toHaveProperty("token");
  });

  it("should not authenticate a user given  an invalid password", async () => {
    const reqParams = {
      email: defaultUser.email,
      password: "invalid_password",
    };

    const response = await request(app)
      .post("/api/v1/sessions")
      .send(reqParams)
      .expect(401);

    const { body } = response;

    expect(body).toHaveProperty("message");
  });

  it("should  not authenticate a user given an invalid email", async () => {
    const reqParams = {
      email: "invalid_@gmail.com",
      password: passwordWithoutHash,
    };

    const response = await request(app)
      .post("/api/v1/sessions")
      .send(reqParams)
      .expect(401);

    const { body } = response;

    expect(body).toHaveProperty("message");
  });
});
