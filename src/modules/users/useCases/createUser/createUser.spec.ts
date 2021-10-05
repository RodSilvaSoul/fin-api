import "reflect-metadata";
import bcrypt from "bcryptjs";

import { AppError } from "../../../../shared/errors/AppError";
import { InMemoryUsersRepository } from "../../repositories/in-memory/InMemoryUsersRepository";
import { CreateUserUseCase } from "./CreateUserUseCase";

describe("#CreateUser", () => {
  let inMemoryUsersRepository: InMemoryUsersRepository;
  let createUserUseCase: CreateUserUseCase;

  const defaultParams = {
    email: "any_email@gmail.com",
    name: "any_name",
    password: "any_password",
  };
  describe("#createUserUseCase", () => {
    beforeEach(() => {
      inMemoryUsersRepository = new InMemoryUsersRepository();
      createUserUseCase = new CreateUserUseCase(inMemoryUsersRepository);
    });
    it("should create a new user given an not registered email", async () => {
      const params = {
        ...defaultParams,
      };

      const hashedPassword = "any_hash";

      jest
        .spyOn(bcrypt, "hash")
        .mockImplementation(
          () => new Promise((resolve) => resolve(hashedPassword))
        );

      const result = await createUserUseCase.execute({ ...params });

      expect(result).toEqual(expect.objectContaining(result));
      expect(result).toHaveProperty("id");
      expect(result.password).toBe(hashedPassword);
    });

    it("should not create a new user given an registered email", async () => {
      inMemoryUsersRepository.create(defaultParams);

      const params = {
        ...defaultParams,
      };
      const hashedPassword = "any_hash";

      jest
        .spyOn(bcrypt, "hash")
        .mockImplementation(
          () => new Promise((resolve) => resolve(hashedPassword))
        );

      const result = createUserUseCase.execute({ ...params });

      expect(result).rejects.toBeInstanceOf(AppError);
    });
  });
});
