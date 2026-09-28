'use strict';

const db = require('./mockDb');
const res = require('./response');

const BILLERS = {
  ELECTRICITY: { name: 'PowerCo Electric', category: 'Utilities' },
  WATER: { name: 'AquaFlow Water', category: 'Utilities' },
  GAS_UTILITY: { name: 'CityGas Supply', category: 'Utilities' },
  INTERNET: { name: 'SpeedNet ISP', category: 'Telecom' },
};

const VOUCHER_CATALOG = {
  GIFT_CARD: { brand: 'Contoso Gift Card', category: 'Gift', denominations: [25, 50, 100] },
  GROCERY: { brand: 'FreshMart', category: 'Grocery', denominations: [25, 50, 100] },
};

const OUTSTANDING_BILLS = {
  ACC001: [
    { billId: 'BILL-1001', billType: 'ELECTRICITY', billerRef: 'ELEC-99123', amount: 85.0, dueDate: '2026-10-05' },
    { billId: 'BILL-1002', billType: 'INTERNET', billerRef: 'ISP-44871', amount: 59.99, dueDate: '2026-10-08' },
  ],
  ACC002: [
    { billId: 'BILL-2001', billType: 'WATER', billerRef: 'WATER-22014', amount: 42.5, dueDate: '2026-10-03' },
  ],
  ACC003: [
    { billId: 'BILL-3001', billType: 'GAS_UTILITY', billerRef: 'GAS-88031', amount: 74.25, dueDate: '2026-10-12' },
    { billId: 'BILL-3002', billType: 'ELECTRICITY', billerRef: 'ELEC-77310', amount: 96.0, dueDate: '2026-10-15' },
  ],
};

function send(resHandler, response) {
  return resHandler.status(response.status).json(JSON.parse(response.body));
}

// Chat users often type "acc002" or " USER001 "; accept IDs in any case.
function normalizeId(value) {
  return typeof value === 'string' ? value.trim().toUpperCase() : value;
}

function generateVoucherCode() {
  return [...Array(4)].map(() => Math.random().toString(36).toUpperCase().substring(2, 6)).join('-');
}

function demoLogin(req, resHandler) {
  const userId = normalizeId(req.query.userId);
  if (!userId) {
    return send(resHandler, res.badRequest('userId query parameter is required.'));
  }

  const account = db.getAccountByUserId(userId);
  if (!account) {
    return send(resHandler, res.notFound(`User ${userId} not found.`));
  }

  return send(resHandler, res.ok({
    userId: account.userId,
    accountId: account.accountId,
    owner: account.owner,
    currency: account.currency,
    authenticated: false,
    message: 'Demo login only. No real authentication is performed.',
  }));
}

function getSavedAccounts(req, resHandler) {
  const accountId = normalizeId(req.query.accountId);
  if (!accountId) {
    return send(resHandler, res.badRequest('accountId query parameter is required.'));
  }

  const account = db.getAccount(accountId);
  if (!account) {
    return send(resHandler, res.notFound(`Account ${accountId} not found.`));
  }

  const savedAccounts = db.getAccounts()
    .filter((savedAccount) => savedAccount.accountId !== accountId)
    .map((savedAccount) => ({
      accountId: savedAccount.accountId,
      owner: savedAccount.owner,
      currency: savedAccount.currency,
      relationship: 'saved-demo-recipient',
    }));

  return send(resHandler, res.ok({ accountId, count: savedAccounts.length, savedAccounts }));
}

function getBalance(req, resHandler) {
  const accountId = normalizeId(req.query.accountId);

  if (!accountId) {
    const response = res.badRequest('accountId query parameter is required.');
    return resHandler.status(response.status).json(JSON.parse(response.body));
  }

  const account = db.getAccount(accountId);
  if (!account) {
    const response = res.notFound(`Account ${accountId} not found.`);
    return resHandler.status(response.status).json(JSON.parse(response.body));
  }

  const response = res.ok({
    accountId: account.accountId,
    owner: account.owner,
    balance: account.balance,
    currency: account.currency,
    asOf: new Date().toISOString(),
  });

  return resHandler.status(response.status).json(JSON.parse(response.body));
}

function getTransactions(req, resHandler) {
  const accountId = normalizeId(req.query.accountId);
  const limit = parseInt(req.query.limit || '20', 10);

  if (!accountId) {
    const response = res.badRequest('accountId query parameter is required.');
    return resHandler.status(response.status).json(JSON.parse(response.body));
  }

  if (!db.getAccount(accountId)) {
    const response = res.notFound(`Account ${accountId} not found.`);
    return resHandler.status(response.status).json(JSON.parse(response.body));
  }

  const txns = db.getTransactions(accountId, limit);
  const response = res.ok({ accountId, count: txns.length, transactions: txns });
  return resHandler.status(response.status).json(JSON.parse(response.body));
}

function transfer(req, resHandler) {
  let fromAccountId; let toAccountId; let amount; let note;

  if (req.method === 'GET') {
    fromAccountId = req.query.fromAccountId;
    toAccountId = req.query.toAccountId;
    amount = req.query.amount;
    note = req.query.note;
  } else {
    ({ fromAccountId, toAccountId, amount, note } = req.body || {});
  }

  fromAccountId = normalizeId(fromAccountId);
  toAccountId = normalizeId(toAccountId);

  if (!fromAccountId || !toAccountId || amount == null) {
    const response = res.badRequest('fromAccountId, toAccountId, and amount are required.');
    return resHandler.status(response.status).json(JSON.parse(response.body));
  }

  if (fromAccountId === toAccountId) {
    const response = res.badRequest('Sender and recipient accounts must be different.');
    return resHandler.status(response.status).json(JSON.parse(response.body));
  }

  const numAmount = parseFloat(amount);
  if (Number.isNaN(numAmount) || numAmount <= 0) {
    const response = res.badRequest('amount must be a positive number.');
    return resHandler.status(response.status).json(JSON.parse(response.body));
  }

  if (numAmount > 10000) {
    const response = res.badRequest('Single transfer limit is $10,000. Please contact support for larger transfers.');
    return resHandler.status(response.status).json(JSON.parse(response.body));
  }

  const sender = db.getAccount(fromAccountId);
  if (!sender) {
    const response = res.notFound(`Sender account ${fromAccountId} not found.`);
    return resHandler.status(response.status).json(JSON.parse(response.body));
  }

  const recipient = db.getAccount(toAccountId);
  if (!recipient) {
    const response = res.notFound(`Recipient account ${toAccountId} not found.`);
    return resHandler.status(response.status).json(JSON.parse(response.body));
  }

  if (sender.balance < numAmount) {
    const response = res.unprocessable('Insufficient balance to complete this transfer.');
    return resHandler.status(response.status).json(JSON.parse(response.body));
  }

  db.debit(fromAccountId, numAmount);
  db.credit(toAccountId, numAmount);

  const description = note ? `Transfer to ${toAccountId} — ${note}` : `Transfer to ${toAccountId}`;
  const txnOut = db.addTransaction({ accountId: fromAccountId, type: 'TRANSFER_OUT', amount: -numAmount, description });
  db.addTransaction({ accountId: toAccountId, type: 'TRANSFER_IN', amount: numAmount, description: `Transfer from ${fromAccountId}${note ? ' — ' + note : ''}` });

  const updatedSender = db.getAccount(fromAccountId);
  const response = res.created({
    transactionId: txnOut.txnId,
    type: 'TRANSFER',
    from: { accountId: fromAccountId, owner: sender.owner },
    to: { accountId: toAccountId, owner: recipient.owner },
    amount: numAmount,
    currency: sender.currency,
    note: note || null,
    newBalance: updatedSender.balance,
    timestamp: txnOut.date,
  });

  return resHandler.status(response.status).json(JSON.parse(response.body));
}

function purchaseVoucher(req, resHandler) {
  const { voucherType, amount } = req.body || {};
  const accountId = normalizeId((req.body || {}).accountId);

  if (!accountId || !voucherType || amount == null) {
    const response = res.badRequest('accountId, voucherType, and amount are required.');
    return resHandler.status(response.status).json(JSON.parse(response.body));
  }

  const voucher = VOUCHER_CATALOG[voucherType.toUpperCase()];
  if (!voucher) {
    const response = res.badRequest(`Unknown voucherType "${voucherType}". Valid types: ${Object.keys(VOUCHER_CATALOG).join(', ')}`);
    return resHandler.status(response.status).json(JSON.parse(response.body));
  }

  const numAmount = parseFloat(amount);
  if (Number.isNaN(numAmount) || numAmount <= 0) {
    const response = res.badRequest('amount must be a positive number.');
    return resHandler.status(response.status).json(JSON.parse(response.body));
  }

  if (!voucher.denominations.includes(numAmount)) {
    const response = res.badRequest(`Invalid denomination for ${voucher.brand}. Available: $${voucher.denominations.join(', $')}`);
    return resHandler.status(response.status).json(JSON.parse(response.body));
  }

  const account = db.getAccount(accountId);
  if (!account) {
    const response = res.notFound(`Account ${accountId} not found.`);
    return resHandler.status(response.status).json(JSON.parse(response.body));
  }

  if (account.balance < numAmount) {
    const response = res.unprocessable('Insufficient balance to purchase this voucher.');
    return resHandler.status(response.status).json(JSON.parse(response.body));
  }

  db.debit(accountId, numAmount);
  const txn = db.addTransaction({ accountId, type: 'VOUCHER', amount: -numAmount, description: `${voucher.brand} ${voucher.category} Voucher — $${numAmount}` });
  const updatedAccount = db.getAccount(accountId);
  const code = generateVoucherCode();
  const response = res.created({
    transactionId: txn.txnId,
    type: 'VOUCHER_PURCHASE',
    voucher: {
      voucherType: voucherType.toUpperCase(),
      brand: voucher.brand,
      category: voucher.category,
      amount: numAmount,
      currency: account.currency,
      code,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    },
    accountId,
    newBalance: updatedAccount.balance,
    timestamp: txn.date,
  });

  return resHandler.status(response.status).json(JSON.parse(response.body));
}

function getOutstandingBills(req, resHandler) {
  const accountId = normalizeId(req.query.accountId);
  if (!accountId) {
    const response = res.badRequest('accountId query parameter is required.');
    return resHandler.status(response.status).json(JSON.parse(response.body));
  }

  if (!db.getAccount(accountId)) {
    const response = res.notFound(`Account ${accountId} not found.`);
    return resHandler.status(response.status).json(JSON.parse(response.body));
  }

  const bills = (OUTSTANDING_BILLS[accountId] || []).map((bill) => ({
    ...bill,
    billerName: BILLERS[bill.billType].name,
    category: BILLERS[bill.billType].category,
    currency: db.getAccount(accountId).currency,
  }));
  const response = res.ok({ accountId, count: bills.length, bills });
  return resHandler.status(response.status).json(JSON.parse(response.body));
}

function payBill(req, resHandler) {
  const accountId = normalizeId((req.body || {}).accountId);
  const billId = normalizeId((req.body || {}).billId);
  if (!accountId || !billId) {
    const response = res.badRequest('accountId and billId are required.');
    return resHandler.status(response.status).json(JSON.parse(response.body));
  }

  const account = db.getAccount(accountId);
  if (!account) {
    const response = res.notFound(`Account ${accountId} not found.`);
    return resHandler.status(response.status).json(JSON.parse(response.body));
  }

  const bills = OUTSTANDING_BILLS[accountId] || [];
  const billIndex = bills.findIndex((bill) => bill.billId === billId);
  if (billIndex === -1) {
    const response = res.notFound(`Bill ${billId} not found for account ${accountId}.`);
    return resHandler.status(response.status).json(JSON.parse(response.body));
  }

  const bill = bills[billIndex];
  if (account.balance < bill.amount) {
    const response = res.unprocessable('Insufficient balance to pay this bill.');
    return resHandler.status(response.status).json(JSON.parse(response.body));
  }

  db.debit(accountId, bill.amount);
  bills.splice(billIndex, 1);
  const biller = BILLERS[bill.billType];
  const txn = db.addTransaction({
    accountId,
    type: 'BILL_PAYMENT',
    amount: -bill.amount,
    description: `${biller.name} — Ref: ${bill.billerRef}`,
  });
  const updatedAccount = db.getAccount(accountId);
  const response = res.created({
    transactionId: txn.txnId,
    type: 'BILL_PAYMENT',
    payment: { ...bill, billerName: biller.name, category: biller.category, currency: account.currency },
    accountId,
    newBalance: updatedAccount.balance,
    timestamp: txn.date,
  });
  return resHandler.status(response.status).json(JSON.parse(response.body));
}

function listVouchers(req, resHandler) {
  const vouchers = Object.entries(VOUCHER_CATALOG).map(([voucherType, voucher]) => ({
    voucherType,
    brand: voucher.brand,
    category: voucher.category,
    denominations: voucher.denominations,
    currency: 'USD',
  }));
  return send(resHandler, res.ok({ count: vouchers.length, vouchers }));
}

module.exports = { demoLogin, getSavedAccounts, getBalance, getTransactions, transfer, listVouchers, purchaseVoucher, getOutstandingBills, payBill };
