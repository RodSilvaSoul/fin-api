import { AppError } from "../../../../shared/errors/AppError";
import { InMemoryUsersRepository } from "../../../users/repositories/in-memory/InMemoryUsersRepository";
import { InMemoryStatementsRepository } from "../../repositories/in-memory/InMemoryStatementsRepository";
import { ICreateStatementDTO } from "../createStatement/ICreateStatementDTO";
import { GetStatementOperationUseCase } from "./GetStatementOperationUseCase";

describe("#GetStatementOperation", () => {
  describe("#GetStatementOperationUseCase", () => {
    let inMemoryStatementsRepository: InMemoryStatementsRepository;
    let inMemoryUsersRepository: InMemoryUsersRepository;
    let getStatementOperationUseCase: GetStatementOperationUseCase;

    beforeEach(() => {
      inMemoryStatementsRepository = new InMemoryStatementsRepository();
      inMemoryUsersRepository = new InMemoryUsersRepository();
      getStatementOperationUseCase = new GetStatementOperationUseCase(
        inMemoryUsersRepository,
        inMemoryStatementsRepository
      );
    });

    const userMock = {
      email: "eny_email",
      name: "any_name",
      password: "any_password",
    };
    test("should get the data of an existing statement by id given a id of an registered user", async () => {
      const user = await inMemoryUsersRepository.create({ ...userMock });

      const statement: ICreateStatementDTO = {
        user_id: user.id as string,
        amount: 50,
        description: "mocked deposit",
        type: "deposit" as any,
      };

      const registeredStatement = await inMemoryStatementsRepository.create({
        ...statement,
      });

      const params = {
        user_id: user.id as string,
        statement_id: registeredStatement.id as string,
      };

      const result = await getStatementOperationUseCase.execute({ ...params });

      expect(result).toEqual(
        expect.objectContaining({
          ...statement,
          id: registeredStatement.id,
        })
      );
    });

    test("should not try get the statement data  given a id of an not registered user", async () => {
      const params = {
        user_id: "any_id",
        statement_id: "any_statement",
      };

      const result = getStatementOperationUseCase.execute({ ...params });

      await expect(result).rejects.toBeInstanceOf(AppError);
    });
  });
});
