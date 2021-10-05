import { AppError } from "../../../../shared/errors/AppError";
import { InMemoryUsersRepository } from "../../../users/repositories/in-memory/InMemoryUsersRepository";
import { InMemoryStatementsRepository } from "../../repositories/in-memory/InMemoryStatementsRepository";
import { CreateStatementUseCase } from "./CreateStatementUseCase";
import { ICreateStatementDTO } from "./ICreateStatementDTO";

describe("#CreateStatement", () => {
  describe("#CreateStatementUseCase", () => {
    let inMemoryStatementsRepository: InMemoryStatementsRepository;
    let inMemoryUsersRepository: InMemoryUsersRepository;
    let createStatementUseCase: CreateStatementUseCase;

    beforeEach(() => {
      inMemoryStatementsRepository = new InMemoryStatementsRepository();
      inMemoryUsersRepository = new InMemoryUsersRepository();
      createStatementUseCase = new CreateStatementUseCase(
        inMemoryUsersRepository,
        inMemoryStatementsRepository
      );
    });

    const userMock = {
      email: "eny_email",
      name: "any_name",
      password: "any_password",
    };

    it("should creat a new statement of type deposit given a id of a registered user", async () => {
      const user = await inMemoryUsersRepository.create({ ...userMock });

      const params: ICreateStatementDTO = {
        user_id: user.id as string,
        amount: 50,
        description: "mocked deposit",
        type: "deposit" as any,
      };

      const result = await createStatementUseCase.execute({ ...params });

      expect(result).toEqual(expect.objectContaining(params));
    });

    it("should not create a new statement of any type given a id of an not registered user", async () => {
      const params: ICreateStatementDTO = {
        user_id: "any_id",
        amount: 50,
        description: "mocked deposit",
        type: "deposit" as any,
      };

      const result = createStatementUseCase.execute({ ...params });

      await expect(result).rejects.toBeInstanceOf(AppError);
    });

    it("should  creat a new statement of type withdraw given a id of a registered user and if have founds", async () => {
      const user = await inMemoryUsersRepository.create({ ...userMock });

      const statements: ICreateStatementDTO[] = [
        {
          user_id: user.id as string,
          amount: 100,
          description: "mocked deposit",
          type: "deposit" as any,
        },
        {
          user_id: user.id as string,
          amount: 50,
          description: "mocked withdraw",
          type: "withdraw" as any,
        },
      ];

      const transactions = statements.map((statement) =>
        inMemoryStatementsRepository.create({ ...statement })
      );

      await Promise.all(transactions);

      const params: ICreateStatementDTO = {
        user_id: user.id as string,
        amount: 50,
        description: "mocked withdraw",
        type: "withdraw" as any,
      };

      const result = await createStatementUseCase.execute({ ...params });

      expect(result).toEqual(expect.objectContaining(params));
    });

    it("should not create a new statement of type withdraw given a id of a registered user if the user not have funds", async () => {
      const user = await inMemoryUsersRepository.create({ ...userMock });

      const statement: ICreateStatementDTO = {
        user_id: user.id as string,
        amount: 100,
        description: "mocked deposit",
        type: "deposit" as any,
      };

      await inMemoryStatementsRepository.create({ ...statement });

      const params: ICreateStatementDTO = {
        user_id: user.id as string,
        amount: 101,
        description: "mocked withdraw",
        type: "withdraw" as any,
      };

      const result = createStatementUseCase.execute({ ...params });

      expect(result).rejects.toBeInstanceOf(AppError);
    });
  });
});
