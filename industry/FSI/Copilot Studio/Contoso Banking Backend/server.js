'use strict';

const express = require('express');
const path = require('path');
const bankingApi = require('./src/bankingApi');

const app = express();
const port = process.env.PORT || 8080;

app.disable('x-powered-by');
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/api-docs', (req, res) => {
  res.sendFile(path.join(__dirname, 'api-docs.html'));
});

app.get('/api-docs.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'api-docs.html'));
});

app.get(['/faq', '/FAQ.html', '/faq.html'], (req, res) => {
  res.sendFile(path.join(__dirname, 'FAQ.html'));
});

app.get('/api/balance', (req, res) => bankingApi.getBalance(req, res));
app.get('/api/login', (req, res) => bankingApi.demoLogin(req, res));
app.get('/api/saved-accounts', (req, res) => bankingApi.getSavedAccounts(req, res));
app.get('/api/transactions', (req, res) => bankingApi.getTransactions(req, res));
app.get('/api/transfer', (req, res) => bankingApi.transfer(req, res));
app.post('/api/transfer', (req, res) => bankingApi.transfer(req, res));
app.post('/api/voucher/purchase', (req, res) => bankingApi.purchaseVoucher(req, res));
app.get('/api/vouchers', (req, res) => bankingApi.listVouchers(req, res));
app.get('/api/bills', (req, res) => bankingApi.getOutstandingBills(req, res));
app.post('/api/bills/pay', (req, res) => bankingApi.payBill(req, res));

app.use((req, res, next) => {
  const protectedPath = /^(?:\/(?:api|src|node_modules)(?:\/|$)|\/(?:server|package(?:-lock)?|local\.settings)\.(?:js|json)|\/\.env(?:\.|$))/i;
  if (protectedPath.test(req.path)) {
    // API clients (such as Copilot Studio HTTP nodes) need a JSON error, not the HTML error page.
    if (/^\/api(?:\/|$)/i.test(req.path)) {
      return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Endpoint not found.' });
    }
    return res.status(404).sendFile(path.join(__dirname, 'error.html'));
  }
  next();
});

app.use(express.static(__dirname, { index: false }));
app.use('/new-campaign', express.static(path.join(__dirname, 'new-campaign')));

app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Endpoint not found.' });
  }
  res.status(404).sendFile(path.join(__dirname, 'error.html'));
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ success: false, error: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong.' });
});

app.listen(port, () => {
  console.log(`Contoso Bank app listening on port ${port}`);
});
