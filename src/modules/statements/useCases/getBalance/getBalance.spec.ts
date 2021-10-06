import { AppError } from "../../../../shared/errors/AppError";
import { InMemoryUsersRepository } from "../../../users/repositories/in-memory/InMemoryUsersRepository";
import { InMemoryStatementsRepository } from "../../repositories/in-memory/InMemoryStatementsRepository";
import { ICreateStatementDTO } from "../createStatement/ICreateStatementDTO";
import { GetBalanceUseCase } from "./GetBalanceUseCase";

describe("#GetBalance", () => {
  describe("#GetBalanceUseCase", () => {
    let inMemoryStatementsRepository: InMemoryStatementsRepository;
    let getBalanceUseCase: GetBalanceUseCase;
    let inMemoryUsersRepository: InMemoryUsersRepository;

    beforeEach(() => {
      inMemoryStatementsRepository = new InMemoryStatementsRepository();
      inMemoryUsersRepository = new InMemoryUsersRepository();
      getBalanceUseCase = new GetBalanceUseCase(
        inMemoryStatementsRepository,
        inMemoryUsersRepository
      );
    });

    const userMock = {
      email: "eny_email",
      name: "any_name",
      password: "any_password",
    };

    it("should get balance given a id of an registered user", async () => {
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

      const transactionsResult = await Promise.all(transactions);

      const result = await getBalanceUseCase.execute({
        user_id: user.id as string,
      });

      expect(result.statement).toEqual(
        expect.arrayContaining(transactionsResult)
      );
      expect(result.balance).toBe(50);
    });

    it("should not get balance given a id of an not registered user", async () => {
      const result = getBalanceUseCase.execute({
        user_id: "any_id",
      });

      await expect(result).rejects.toBeInstanceOf(AppError);
    });
  });
});
