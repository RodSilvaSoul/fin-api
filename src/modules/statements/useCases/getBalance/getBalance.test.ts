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

describe("#GetBalance integration", () => {
  let connection: Connection;
  let usersRepository: Repository<User>;
  let statementsRepository: Repository<Statement>;

  const defaultUserId = uuidV4();

  let defaultUser: ICreateUserDTO = {
    email: "email@gmail.com",
    name: "any_name",
    password: "any_password",
  };

  let defaultStatements: ICreateStatementDTO[] = [
    {
      user_id: defaultUserId,
      amount: 100,
      description: "mocked deposit",
      type: "deposit" as any,
    },
    {
      user_id: defaultUserId,
      amount: 50,
      description: "mocked withdraw",
      type: "withdraw" as any,
    },
  ];

  beforeAll(async () => {
    const defaultOptions = await getConnectionOptions();

    connection = await createConnection(
      Object.assign(defaultOptions, {
        database: "test",
        port: 5433,
      })
    );

    usersRepository = getRepository(User);
    statementsRepository = getRepository(Statement);

    await connection.query("DROP TABLE IF EXISTS statements");
    await connection.query("DROP TABLE IF EXISTS users");
    await connection.query("DROP TABLE IF EXISTS migrations");

    await connection.runMigrations();

    const userInstance = usersRepository.create({
      ...defaultUser,
      id: defaultUserId,
    });
    await usersRepository.save(userInstance);

    const statementsPromises = defaultStatements.map((statement) => {
      const statementInstance = statementsRepository.create(statement);
      return statementsRepository.save(statementInstance);
    });

    await Promise.all(statementsPromises);
  });

  afterAll(async () => {
    await connection.close();
  });

  it("should get user balance given a id of an registered user and authenticated", async () => {
    const jwt = sign({}, config.jwt.secret, {
      subject: defaultUserId,
    });

    const response = await request(app)
      .get("/api/v1/statements/balance")
      .set("authorization", `bearer ${jwt}`)
      .expect(200);

    const { body } = response;

    const getExpectedStatementData = (data: ICreateStatementDTO) => {
      const { amount, type, description } = data;

      return {
        amount,
        type,
        description,
      };
    };

    expect(body.statement).toEqual([
      expect.objectContaining(getExpectedStatementData(defaultStatements[0])),
      expect.objectContaining(getExpectedStatementData(defaultStatements[1])),
    ]);
    expect(body.balance).toBe(50);
  });

  it("should not get user balance if missing the jwt", async () => {
    const response = await request(app)
      .get("/api/v1/statements/balance")
      .expect(401);

    const { body } = response;

    expect(body).toHaveProperty("message");
  });

  it("should not get user balance given an invalid jwt", async () => {
    const jwt = sign({}, "invalid_secret", {
      subject: defaultUserId,
    });

    const response = await request(app)
      .get("/api/v1/statements/balance")
      .set("authorization", `bearer ${jwt}`)
      .expect(401);

    const { body } = response;

    expect(body).toHaveProperty("message");
  });
});
