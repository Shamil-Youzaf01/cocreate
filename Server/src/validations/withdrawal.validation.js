import { z } from "zod";

const paymentDetailsSchema = z
  .object({
    method: z.enum(["UPI", "BANK_TRANSFER"]),

    upiId: z.string().trim().optional(),

    accountName: z.string().trim().optional(),

    accountNumber: z.string().trim().optional(),

    ifsc: z.string().trim().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.method === "UPI" && !data.upiId) {
      ctx.addIssue({
        code: "custom",
        path: ["upiId"],
        message: "UPI ID is required for UPI withdrawals",
      });
    }

    if (data.method === "BANK_TRANSFER") {
      if (!data.accountName) {
        ctx.addIssue({
          code: "custom",
          path: ["accountName"],
          message: "Account name is required",
        });
      }

      if (!data.accountNumber) {
        ctx.addIssue({
          code: "custom",
          path: ["accountNumber"],
          message: "Account number is required",
        });
      }

      if (!data.ifsc) {
        ctx.addIssue({
          code: "custom",
          path: ["ifsc"],
          message: "IFSC is required",
        });
      }
    }
  });

const requestWithdrawalSchema = z.object({
  body: z.object({
    amount: z.number().positive("Withdrawal amount must be greater than zero"),

    paymentDetails: paymentDetailsSchema,
  }),
});

export { requestWithdrawalSchema };
