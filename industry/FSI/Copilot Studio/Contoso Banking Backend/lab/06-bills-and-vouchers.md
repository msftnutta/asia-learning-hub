# Module 6 — Pay bills and buy vouchers

[← Previous: Transfer money](./05-transfer.md) · [Lab home](../README.md) · **Module 6 of 7** · [Next: Test and clean up →](./07-test-and-clean-up.md)

| | |
| --- | --- |
| **Time** | 30 minutes |
| **You will** | Build two more journeys by reusing the pattern from Module 5 |
| **You need** | A working **Transfer money** topic from [Module 5](./05-transfer.md) |

## The pattern you're reusing

Both topics follow the same steps as **Transfer money**:

```text
sign-in guard → GET list → show list → ask for a choice → LookUp the choice
  → Check available funds (agent flow) → confirm → POST → show the result
```

The steps below only list what's different. When a step says "as in Module 5", open that step and repeat it with the new values.

## Part A — Pay a bill

The customer picks a bill **by ID**. The amount always comes from the API, so it can't be changed in the chat.

### Step 1 — Create the topic

Create a blank topic named `Pay a bill` with this description:

```text
Pays one of the signed-in customer's outstanding bills, such as electricity, water, gas or internet. Use when the customer wants to see or pay their bills.
```

Add the sign-in guard.

### Step 2 — Get the outstanding bills

HTTP `GET` with this URL formula:

```powerfx
Global.BaseUrl & "/bills?accountId=" & Global.AccountId
```

Save the response as `BillsResponse`, and get the schema from:

```json
{
  "success": true,
  "accountId": "ACC001",
  "count": 2,
  "bills": [
    {
      "billId": "BILL-1001",
      "billType": "ELECTRICITY",
      "billerRef": "ELEC-99123",
      "amount": 85.5,
      "dueDate": "2026-10-05",
      "billerName": "PowerCo Electric",
      "category": "Utilities",
      "currency": "USD"
    }
  ]
}
```

Apply the error pattern with the condition `Topic.BillsResponse.success = true`.

### Step 3 — Handle "no bills" and show the list

1. Add a condition formula `Topic.BillsResponse.count = 0`. Under that branch, add **Send a message** `You have no outstanding bills.`, then **End current topic**.
2. Below the condition, add **Send a message** (formula):

   ```powerfx
   "Your outstanding bills:" & Char(10) &
   Concat(
     Topic.BillsResponse.bills,
     "- " & billId & ": " & billerName & ", " & currency & " " & Text(amount, "#,##0.00") & ", due " & dueDate,
     Char(10)
   )
   ```

### Step 4 — Choose a bill

1. **Ask a question**: `Which bill would you like to pay? Type the bill ID, for example BILL-1001.` Use **User's entire response**, and save it to `BillIdInput`.
2. **Set a variable value**: create `SelectedBill` with this formula:

   ```powerfx
   LookUp(Topic.BillsResponse.bills, billId = Upper(Trim(Topic.BillIdInput)))
   ```

3. Add a condition formula `IsBlank(Topic.SelectedBill)`. Under that branch, send `I couldn't find that bill. Please start again and choose one of the listed bill IDs.`, then **End current topic**.

### Step 5 — Check funds and confirm

1. Select **+** → **Add a tool** → **Check available funds**, with inputs `Global.BaseUrl`, `Global.AccountId`, and **RequiredAmount** = `Topic.SelectedBill.amount`. Handle `FundsError` and `HasEnoughFunds = false` as in [Module 5, Step 6](./05-transfer.md#step-6--check-funds-with-the-workflow).
2. Add **Ask a question** with **Multiple choice options** `Yes, pay it` and `No, cancel`:

   ```text
   Pay {Topic.SelectedBill.billerName} {Topic.SelectedBill.currency} {Topic.SelectedBill.amount} now?
   ```

   Handle **No, cancel** as in [Module 5, Step 7](./05-transfer.md#step-7--ask-for-confirmation).

### Step 6 — Pay the bill

Under **Yes, pay it**, add an HTTP `POST` with the URL formula `Global.BaseUrl & "/bills/pay"`, a **JSON content** body, and **Continue on error**.

Body formula:

```powerfx
{
  accountId: Global.AccountId,
  billId: Topic.SelectedBill.billId
}
```

Save the response as `PaymentResponse`, and get the schema from:

```json
{
  "success": true,
  "transactionId": "TXN-0007",
  "type": "BILL_PAYMENT",
  "payment": { "billId": "BILL-1001", "billerName": "PowerCo Electric", "amount": 85.5, "currency": "USD" },
  "accountId": "ACC001",
  "newBalance": 5195.5,
  "timestamp": "2026-09-28T09:00:00.000Z"
}
```

Add a condition formula `Topic.PaymentResponse.success = true`. Under the success branch, send:

```powerfx
"Paid " & Topic.PaymentResponse.payment.billerName & "." & Char(10) &
"Transaction ID: " & Topic.PaymentResponse.transactionId & Char(10) &
"New balance: " & Topic.PaymentResponse.payment.currency & " " & Text(Topic.PaymentResponse.newBalance, "#,##0.00")
```

Under **All other conditions**, apply the error pattern. Then save.

## Part B — Buy a voucher

The voucher catalog comes from `GET /api/vouchers`, so the topic never hard-codes brands or amounts.

### Step 1 — Create the topic

Create a blank topic named `Buy a voucher` with this description:

```text
Buys a gift card or grocery voucher for the signed-in customer. Use when the customer wants to buy or purchase a voucher or gift card.
```

Add the sign-in guard.

### Step 2 — Get the catalog

HTTP `GET` with this URL formula:

```powerfx
Global.BaseUrl & "/vouchers"
```

Save the response as `VouchersResponse`, and get the schema from:

```json
{
  "success": true,
  "count": 2,
  "vouchers": [
    {
      "voucherType": "GIFT_CARD",
      "brand": "Contoso Gift Card",
      "category": "Gift",
      "denominations": [25, 50, 100],
      "currency": "USD"
    }
  ]
}
```

Apply the error pattern with the condition `Topic.VouchersResponse.success = true`.

### Step 3 — Show the catalog and choose a voucher

1. **Send a message** (formula):

   ```powerfx
   "Available vouchers:" & Char(10) &
   Concat(
     Topic.VouchersResponse.vouchers,
     "- " & voucherType & ": " & brand & " (" & currency & " " & Concat(denominations, Text(Value), ", ") & ")",
     Char(10)
   )
   ```

   `denominations` is a list of numbers. In Power Fx, each number in the list is named `Value`.

2. **Ask a question**: `Which voucher would you like? Type GIFT_CARD or GROCERY.` Use **User's entire response**, and save it to `VoucherTypeInput`.
3. **Set a variable value**: create `SelectedVoucher` with this formula:

   ```powerfx
   LookUp(
     Topic.VouchersResponse.vouchers,
     voucherType = Substitute(Upper(Trim(Topic.VoucherTypeInput)), " ", "_")
   )
   ```

   `Substitute` turns "gift card" into `GIFT_CARD`.

4. Add a condition formula `IsBlank(Topic.SelectedVoucher)`. Under that branch, send `I couldn't find that voucher type.`, then **End current topic**.

### Step 4 — Choose an amount

1. **Ask a question**. Use a formula for the message:

   ```powerfx
   "Which amount? Choose " & Concat(Topic.SelectedVoucher.denominations, Text(Value), ", ") & "."
   ```

   Set **Identify** to **Number**, and save it to `VoucherAmount`.

2. Add a condition formula:

   ```powerfx
   IsBlank(LookUp(Topic.SelectedVoucher.denominations, Value = Topic.VoucherAmount))
   ```

   Under that branch, send `Please choose one of the listed amounts.`, then **End current topic**.

### Step 5 — Check funds, confirm, and buy

1. Select **+** → **Add a tool** → **Check available funds**, with inputs `Global.BaseUrl`, `Global.AccountId`, and **RequiredAmount** = `Topic.VoucherAmount`. Handle `FundsError` and `HasEnoughFunds = false` as in [Module 5, Step 6](./05-transfer.md#step-6--check-funds-with-the-workflow).
2. Confirm with **Multiple choice options** `Yes, buy it` and `No, cancel`:

   ```text
   Buy a {Topic.SelectedVoucher.brand} voucher for {Topic.SelectedVoucher.currency} {Topic.VoucherAmount}?
   ```

3. Under **Yes, buy it**, add an HTTP `POST` with the URL formula `Global.BaseUrl & "/voucher/purchase"`, a **JSON content** body, and **Continue on error**. Body formula:

   ```powerfx
   {
     accountId: Global.AccountId,
     voucherType: Topic.SelectedVoucher.voucherType,
     amount: Topic.VoucherAmount
   }
   ```

4. Save the response as `VoucherResponse`, and get the schema from:

   ```json
   {
     "success": true,
     "transactionId": "TXN-0008",
     "type": "VOUCHER_PURCHASE",
     "voucher": {
       "voucherType": "GIFT_CARD",
       "brand": "Contoso Gift Card",
       "category": "Gift",
       "amount": 25,
       "currency": "USD",
       "code": "AB12-CD34-EF56-GH78",
       "expiresAt": "2027-09-28"
     },
     "accountId": "ACC001",
     "newBalance": 5170.5,
     "timestamp": "2026-09-28T09:00:00.000Z"
   }
   ```

5. Add a condition formula `Topic.VoucherResponse.success = true`. Under the success branch, send:

   ```powerfx
   "Here's your " & Topic.VoucherResponse.voucher.brand & " voucher!" & Char(10) &
   "Code: " & Topic.VoucherResponse.voucher.code & Char(10) &
   "Expires: " & Topic.VoucherResponse.voucher.expiresAt & Char(10) &
   "New balance: " & Topic.VoucherResponse.voucher.currency & " " & Text(Topic.VoucherResponse.newBalance, "#,##0.00")
   ```

   Under **All other conditions**, apply the error pattern. Then save.

## Test both topics

| User | Type | Expected result |
| --- | --- | --- |
| USER001 | `pay my bills` → `BILL-1001` → **Yes, pay it** | *Paid PowerCo Electric.* The balance drops by USD 85.00. |
| USER001 | `pay my bills` again | BILL-1001 is no longer in the list |
| USER001 | `pay my bills` → `bill-9999` | *I couldn't find that bill…* |
| USER002 | `buy a voucher` → `gift card` → `50` → **Yes, buy it** | A voucher code and expiry date |
| USER002 | `buy a voucher` → `GROCERY` → `30` | *Please choose one of the listed amounts.* |
| USER002 | `buy a voucher` → `GIFT_CARD` → `100` → **No, cancel** | Cancelled. The balance is unchanged. |

### ✅ Checkpoint

- Bills and vouchers both call the **Check available funds** flow, and neither topic copies its logic.
- The flow's **Run history** shows one run for each bill payment and voucher purchase you tested.
- The bill amount always comes from the API, never from the customer.
- A paid bill disappears from the list until you reset the data.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| `Value` is underlined as an error in the voucher formula | The schema sample must contain `denominations` as a list of numbers, such as `[25, 50, 100]`. |
| `SelectedBill.amount` isn't in the picker | Save the topic after the `LookUp` step so the record type is inferred. |
| Bills are missing | You already paid them. Run `az webapp restart` to reset the data. |

---

[← Previous: Transfer money](./05-transfer.md) · [Lab home](../README.md) · [Next: Test and clean up →](./07-test-and-clean-up.md)
