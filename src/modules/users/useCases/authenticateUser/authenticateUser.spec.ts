import bcryptjs from "bcryptjs";
import jsonwebtoken from "jsonwebtoken";
import { AppError } from "../../../../shared/errors/AppError";

import { InMemoryUsersRepository } from "../../repositories/in-memory/InMemoryUsersRepository";
import { AuthenticateUserUseCase } from "./AuthenticateUserUseCase";

describe("#authenticateUser", () => {
  let inMemoryUsersRepository: InMemoryUsersRepository;
  let authenticateUserUseCase: AuthenticateUserUseCase;

  describe("#authenticateUserUseCase", () => {
    beforeEach(() => {
      inMemoryUsersRepository = new InMemoryUsersRepository();
      authenticateUserUseCase = new AuthenticateUserUseCase(
        inMemoryUsersRepository
      );
    });

    const defaultParams = {
      email: "any_email@gmail.com",
      name: "any_name",
      password: "any_password",
    };
    test("should authenticate a user given the correct credentials of a registered user", async () => {
      await inMemoryUsersRepository.create({ ...defaultParams });

      jest.spyOn(bcryptjs, "compare").mockImplementation((a, b) => {
        return new Promise((resolve, reject) => {
          if (a === b) {
            return resolve(true);
          }
          resolve(false);
        });
      });

      jest.spyOn(jsonwebtoken, "sign").mockImplementation(() => "jwt_token");

      const result = await authenticateUserUseCase.execute({
        ...defaultParams,
      });

      const { password, ...rest } = defaultParams;

      expect(result.user).toEqual(expect.objectContaining(rest));
      expect(result.user).not.toHaveProperty("password");
      expect(result.user).toHaveProperty("id");
      expect(result.token).toBe("jwt_token");
    });

    test("should not authenticate a user given an email of an not registered user", async () => {
      const result = authenticateUserUseCase.execute({
        ...defaultParams,
      });

      expect(result).rejects.toBeInstanceOf(AppError);
    });

    test("should not authenticate a user given an invalid password of an registered user", async () => {
      await inMemoryUsersRepository.create({ ...defaultParams });

      jest.spyOn(bcryptjs, "compare").mockImplementation((a, b) => {
        return new Promise((resolve) => {
          if (a === b) {
            return resolve(true);
          }
          resolve(false);
        });
      });

      const result = authenticateUserUseCase.execute({
        ...defaultParams,
        password: "wrong password",
      });

      await expect(result).rejects.toBeInstanceOf(AppError);
    });
  });
});
