import { deductCredit, completeOperation, refundOperation } from "./paymentService.js";
import { logger } from "../lib/logger.js";

export async function runBillable(userId, description, action) {
  const deduction = await deductCredit(userId, description, description);
  try {
    const result = await action();
    await completeOperation(deduction.operationId);
    return { result, deduction };
  } catch (error) {
    await refundOperation(deduction.operationId).catch(err => logger.error({ err, operationId: deduction.operationId }, "Refund pending recovery"));
    throw error;
  }
}
