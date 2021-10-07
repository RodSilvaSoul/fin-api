import { inject, injectable } from "tsyringe";
import { IUsersRepository } from "../../../users/repositories/IUsersRepository";
import { OperationType } from "../../entities/Statement";
import { IStatementsRepository } from "../../repositories/IStatementsRepository";
import { ICreateTransferDTO } from "./createTransferDTO";
import { CreateTransferError } from "./createTransferError";

@injectable()
export class CreateTransferUseCase {
  constructor(
    @inject("UsersRepository")
    private usersRepository: IUsersRepository,

    @inject("StatementsRepository")
    private statementsRepository: IStatementsRepository
  ) {}

  async execute({
    user_id,
    amount,
    description,
    recipient_id,
  }: ICreateTransferDTO) {
    const user = await this.usersRepository.findById(user_id);

    if (!user) {
      throw new CreateTransferError.UserNotFound();
    }

    const { balance } = await this.statementsRepository.getUserBalance({
      user_id,
    });

    if (balance < amount) {
      throw new CreateTransferError.InsufficientFunds();
    }

    await this.statementsRepository.create({
      user_id: recipient_id,
      amount,
      description: description + `, \nDeposit from: ${user.name}`,
      type: OperationType.DEPOSIT,
    });

    const statement = await this.statementsRepository.create({
      user_id,
      amount,
      description,
      type: OperationType.TRANSFER,
    });

    return statement;
  }
}
