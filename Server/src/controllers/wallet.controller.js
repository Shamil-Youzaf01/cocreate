import { getWallet, getTransactions } from "../services/wallet.service.js";

const getMyWallet = async (req, res) => {
  const wallet = await getWallet(req.user.userId);

  res.status(200).json({
    success: true,
    data: {
      wallet,
    },
  });
};

const getMyTransactions = async (req, res) => {
  const transactions = await getTransactions(req.user.userId);

  res.status(200).json({
    success: true,
    results: transactions.length,
    data: {
      transactions,
    },
  });
};

export { getMyWallet, getMyTransactions };
