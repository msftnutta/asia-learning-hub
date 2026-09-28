'use strict';

const accounts = {
  ACC001: { accountId: 'ACC001', userId: 'USER001', owner: 'Chihiro Kimura', balance: 5280.5, currency: 'USD' },
  ACC002: { accountId: 'ACC002', userId: 'USER002', owner: 'Camila Botelho', balance: 1240.0, currency: 'USD' },
  ACC003: { accountId: 'ACC003', userId: 'USER003', owner: 'Michelle Caruana', balance: 12400.75, currency: 'USD' },
};

const transactions = [
  { txnId: 'TXN-0001', accountId: 'ACC001', type: 'TRANSFER_OUT', amount: -200.0, description: 'Transfer to ACC002', date: '2026-03-26T10:15:00Z', status: 'SUCCESS' },
  { txnId: 'TXN-0002', accountId: 'ACC002', type: 'TRANSFER_IN', amount: 200.0, description: 'Transfer from ACC001', date: '2026-03-26T10:15:00Z', status: 'SUCCESS' },
  { txnId: 'TXN-0003', accountId: 'ACC001', type: 'VOUCHER', amount: -50.0, description: 'Gas Voucher — Shell $50', date: '2026-03-25T14:22:00Z', status: 'SUCCESS' },
  { txnId: 'TXN-0004', accountId: 'ACC001', type: 'BILL_PAYMENT', amount: -85.0, description: 'Electricity Bill — PowerCo', date: '2026-03-24T09:00:00Z', status: 'SUCCESS' },
  { txnId: 'TXN-0005', accountId: 'ACC003', type: 'BILL_PAYMENT', amount: -74.25, description: 'CityGas Supply — Ref: GAS-88031', date: '2026-03-23T18:45:00Z', status: 'SUCCESS' },
];

let txnCounter = transactions.length;

function nextTxnId() {
  txnCounter += 1;
  return `TXN-${String(txnCounter).padStart(4, '0')}`;
}

function getAccount(accountId) {
  return accounts[accountId] || null;
}

function getAccountByUserId(userId) {
  return Object.values(accounts).find((account) => account.userId === userId) || null;
}

function getAccounts() {
  return Object.values(accounts);
}

function debit(accountId, amount) {
  if (!accounts[accountId]) return false;
  accounts[accountId].balance = +(accounts[accountId].balance - amount).toFixed(2);
  return true;
}

function credit(accountId, amount) {
  if (!accounts[accountId]) return false;
  accounts[accountId].balance = +(accounts[accountId].balance + amount).toFixed(2);
  return true;
}

function addTransaction(entry) {
  const txn = { txnId: nextTxnId(), date: new Date().toISOString(), status: 'SUCCESS', ...entry };
  transactions.unshift(txn);
  return txn;
}

function getTransactions(accountId, limit = 20) {
  return transactions.filter((t) => t.accountId === accountId).slice(0, limit);
}

module.exports = { getAccount, getAccountByUserId, getAccounts, debit, credit, addTransaction, getTransactions };
