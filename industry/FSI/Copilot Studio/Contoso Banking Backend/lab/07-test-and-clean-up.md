# Module 7 — Test, share, and clean up

[← Previous: Bills and vouchers](./06-bills-and-vouchers.md) · [Lab home](../README.md) · **Module 7 of 7**

| | |
| --- | --- |
| **Time** | 15 minutes |
| **You will** | Run an end-to-end test, reset the demo data, optionally share the agent, and delete your Azure resources |

## Step 1 — Reset the demo data

Earlier tests changed balances and paid some bills. Restart the app so everything starts fresh. Cloud Shell forgets your variables when it times out, so set them again first:

```bash
RG=rg-contoso-bank-<your-initials>
APP=<the app name you wrote down in Module 1>
az webapp restart --name $APP --resource-group $RG
```

## Step 2 — Run the end-to-end test

In the **Test** pane, select **Refresh**, and then run this whole script in **one** conversation. To make the canvas follow the conversation from topic to topic, turn on **Track between topics** in the Test pane menu.

| # | Type | Expected result | What runs |
| --- | --- | --- | --- |
| 1 | `Hi, what's my account number?` | Asks for a demo user ID | Account number → Demo login |
| 2 | `USER001` | Welcome, Chihiro Kimura. Account ACC001. | Demo login → Account number |
| 3 | `How much money do I have?` | USD 5,280.50 | Balance inquiry → flow |
| 4 | `Send money to a friend` | Lists ACC002 and ACC003 | Transfer money |
| 5 | `acc002`, then `100` | Asks you to confirm | Transfer money → flow |
| 6 | **Yes, send it** | A transaction ID, and a new balance of USD 5,180.50 | Transfer money |
| 7 | `Pay my electricity bill` → `BILL-1001` → **Yes, pay it** | Paid PowerCo Electric. New balance USD 5,095.50. | Pay a bill → flow |
| 8 | `Buy a gift card` → `GIFT_CARD` → `25` → **Yes, buy it** | A voucher code. New balance USD 5,070.50. | Buy a voucher → flow |
| 9 | `Send money` → `ACC003` → `999999` | Not enough funds. Nothing moves. | Transfer money → flow |
| 10 | `What's my balance?` | USD 5,070.50 | Balance inquiry → flow |

"flow" means the **Check available funds** agent flow. If a row fails, go back to the module that built that topic and use its **Troubleshooting** table.

### ✅ Checkpoint

- All 10 rows behave as expected.
- The final balance equals the starting balance minus the confirmed transactions only.
- **Flows** → **Check available funds** → **Run history** shows six new runs, one for each row marked "→ flow".

## Step 3 — Share the agent (optional)

1. Select **Publish** in Copilot Studio.
2. Open **Channels**, and select **Demo website** to get a link you can share with classmates.

Your organization's policies might restrict publishing. If so, keep testing in the **Test** pane.

## Clean up

Delete everything you created in Azure so that billing stops:

```bash
az group delete --name $RG --yes --no-wait
```

Confirm the deletion finished after a few minutes:

```bash
az group exists --name $RG
```

The command returns `false` when the resource group is gone. You can also delete the agent in Copilot Studio (**Agents** → **…** → **Delete**) if you no longer need it.

## Stretch challenges

Try these if you finish early:

1. **Recent transactions**: build a topic that calls `GET /api/transactions?accountId=…&limit=5` and lists the results with `Concat`.
2. **Amount validation**: in **Transfer money**, reject amounts of 0 or less before calling the **Check available funds** flow.
3. **Sign out**: add a topic that clears `Global.AccountId` with a **Set a variable value** node and says goodbye.
4. **Adaptive Card**: replace the typed recipient ID with an **Ask with Adaptive Card** node that shows the saved accounts as buttons.
5. **Let the agent call the flow by itself**: go to your agent's **Tools** page → **Add a tool** → **Flow** → **Check available funds** → **Add and configure**. Use the description `Checks whether the signed-in customer can afford a specific amount.` Set the **BaseUrl** and **AccountId** inputs to **Set as a value** with `Global.BaseUrl` and `Global.AccountId`, and leave **RequiredAmount** to be filled dynamically. Then sign in as USER002 and ask `Can I afford a 2000 dollar transfer?`
6. **Add a business rule in one place**: change the flow so that `HasEnoughFunds` is false for amounts over USD 5,000, publish it, and confirm that transfers, bills, and vouchers all follow the new rule without editing any topic.

## What you built

- A Node.js banking API on Azure App Service (P0v3, Southeast Asia).
- A standard Copilot Studio agent with six topics and one agent flow:
  - Two customer utilities: **Demo login** and **Account number**.
  - Four customer journeys: **Balance inquiry**, **Transfer money**, **Pay a bill**, and **Buy a voucher**.
  - One reusable workflow: the **Check available funds** agent flow, called by all four journeys.
- A safe pattern for money-moving conversations: *check → summarize → confirm → execute → report*.

---

[← Previous: Bills and vouchers](./06-bills-and-vouchers.md) · [Lab home](../README.md)
