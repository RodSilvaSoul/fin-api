import { AppError } from "../../../../shared/errors/AppError";
import { InMemoryUsersRepository } from "../../repositories/in-memory/InMemoryUsersRepository";
import { ShowUserProfileUseCase } from "./ShowUserProfileUseCase";

describe("#showUserProfile", () => {
  let inMemoryUsersRepository: InMemoryUsersRepository;
  let showUserProfileUseCase: ShowUserProfileUseCase;
  describe("showUserProfileUseCase", () => {
    beforeEach(() => {
      inMemoryUsersRepository = new InMemoryUsersRepository();
      showUserProfileUseCase = new ShowUserProfileUseCase(
        inMemoryUsersRepository
      );
    });

    it("should return an user profile data given id of registered user", async () => {
      const userMock = {
        email: "eny_email",
        name: "any_name",
        password: "any_password",
      };

      const user = await inMemoryUsersRepository.create({
        ...userMock,
      });

      const result = await showUserProfileUseCase.execute(user.id as string);

      expect(result).toEqual(expect.objectContaining(userMock));
    });

    it("should not return an user profile data given id of not registered user", async () => {
      const result = showUserProfileUseCase.execute("any_id");

      await expect(result).rejects.toBeInstanceOf(AppError);
    });
  });
});
