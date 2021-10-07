import { Response, Request } from "express";
import { container } from "tsyringe";
import { CreateTransferUseCase } from "./createTransferUseCase";

export class CreateTransferController {
  async execute(request: Request, response: Response): Promise<Response> {
    const { id: user_id } = request.user;
    const { recipient_id } = request.params;
    const { description, amount } = request.body;

    const createTransferUseCase = container.resolve(CreateTransferUseCase);

    const statement = createTransferUseCase.execute({
      amount,
      description,
      recipient_id,
      user_id,
    });

    return response.json(statement);
  }
}
