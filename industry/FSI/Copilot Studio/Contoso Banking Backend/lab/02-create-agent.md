# Module 2 — Create the agent

[← Previous: Deploy the API](./01-deploy-backend.md) · [Lab home](../README.md) · **Module 2 of 7** · [Next: Demo login →](./03-demo-login.md)

| | |
| --- | --- |
| **Time** | 15 minutes |
| **You will** | Create a standard agent from a prompt, review what the AI generated, and learn the variables and canvas nodes used in this lab |
| **You need** | Access to Copilot Studio with permission to create agents |

## Why a standard agent, not a declarative agent?

This lab builds conversations with **topics** and the **HTTP Request** node. Both run on the Copilot Studio [standard harness](https://learn.microsoft.com/microsoft-copilot-studio/harnesses-overview). Declarative agents for Microsoft 365 Copilot don't have topics, so the **Topics** page won't appear if you create one of those.

## Step 1 — Create the agent from a prompt

1. Open [Copilot Studio](https://copilotstudio.microsoft.com), and then select the environment your instructor gave you (top-right corner).
2. Check which home page you see:

   | You see | What to do |
   | --- | --- |
   | **What would you like to build?**, a description box, and a **Start building from scratch** section below it | You're on the standard home page. Go to the next step. |
   | **Hey *name*, what do you want to build?**, **Agent** and **Workflow** cards labeled *GitHub Copilot*, and a **New experience** toggle at the top right | Turn **off** the **New experience** toggle. If a **Feedback** panel opens, select **Submit** to close it. The standard home page appears. |

3. Optional: to build the agent in a language other than English, select the gear icon in the description box and choose the **primary language** now. You can't change it after the agent is created.
4. Make sure **Agent** is selected above the description box. Paste this prompt into the box, and then select the arrow (or press **Enter**):

   ```text
   Create a friendly banking assistant named Contoso Friendly Banker for a Contoso Bank classroom demo. It helps customers sign in with a demo user ID (USER001, USER002 or USER003), tell them their account number, check their balance, list their saved accounts, transfer money to a saved account, pay outstanding bills, and buy gift card or grocery vouchers. This is a mock bank with no real authentication and no real money, so never ask for passwords, PINs or card numbers. Always get account data from the bank's topics and tools, and never invent balances, account numbers, bills, transaction IDs or voucher codes. Before any transfer, bill payment or voucher purchase, check that the customer has enough money, show a summary, and ask for explicit confirmation. Don't give financial, investment or tax advice. Keep replies short, warm and clear, and always show amounts with their currency.
   ```

5. Wait while Copilot Studio creates the agent. The agent's **Overview** page opens, with a generated name, description, and instructions, and a list of **suggestions**.

## Step 2 — Review and replace the generated instructions

1. **Details**: select **Edit**, and make sure the name and description are:
   - **Name**: `Contoso Friendly Banker`
   - **Description**: `Helps Contoso Bank demo customers check balances, transfer money, pay bills, and buy vouchers.`

   Select **Save**.

2. **Instructions**: select **Edit** and read the instructions Copilot generated from your prompt. They usually look good at first glance, with sections such as *Purpose*, *Skills*, and *Step-by-Step Instructions*. But for this lab they have problems like these:

   | Generated instruction | Why it's a problem in this lab |
   | --- | --- |
   | *Validate that the ID is one of the allowed demo IDs* | The agent would "validate" the ID itself. Only the bank API knows which users exist, and the **Demo login** topic asks it. |
   | Step-by-step lists for transfers, bills, and vouchers | The agent might try to run these steps on its own instead of using your topics, and invent data along the way. |
   | *Ask for explicit confirmation before proceeding* | Your topics already ask for confirmation. The agent might ask a second time. |
   | *Ask which bill to pay and confirm amount* | The bill amount comes from the bank and can't be changed in the chat. |
   | *Ask for amount* (vouchers) | Vouchers come only in the amounts the bank lists, for example 25, 50, or 100. |
   | Example: *Your current balance is $200.00… Savings Account 1234* | Made-up examples teach the agent to make up data. There's no savings account 1234 in the demo bank. |
   | *e.g., $100.00* | The bank returns currency codes. Topics show `USD 1,240.00`. |
   | No rule about success messages | The agent could say "Done!" even when a transfer failed. |
   | No out-of-scope rule | The agent might try to help with loans, cards, or new accounts, which the bank doesn't offer. |

3. Select all the generated text, delete it, and paste these instructions instead:

   ```text
   # Purpose
   You are Contoso Friendly Banker, a friendly assistant for the Contoso Bank classroom demo. This is a mock bank: there is no real authentication and no real money.

   # What you can help with
   Each task has its own topic. Always use the matching topic, and let it do the work.
   - Sign in with a demo user ID (USER001, USER002 or USER003): Demo login topic
   - "What is my account number?": Account number topic
   - Check the balance: Balance inquiry topic
   - Send money to a saved account: Transfer money topic
   - Pay an outstanding bill: Pay a bill topic
   - Buy a gift card or grocery voucher: Buy a voucher topic

   # Rules
   - Get all account data from the topics. Never guess or invent account numbers, names, balances, bills, amounts, transaction IDs, or voucher codes.
   - Don't check IDs, balances, or funds yourself. The topics ask the bank.
   - The topics already check funds, show a summary, and ask for confirmation before money moves. Don't add your own confirmation or repeat those steps.
   - Say a transaction succeeded only after a topic shows a transaction ID. If a topic reports an error, explain it in simple words and suggest a next step, such as a smaller amount, another account, or trying again later. Never retry a transaction on your own.
   - Transfers go only to the customer's saved accounts. Bill amounts come from the bank and can't be changed. Vouchers come only in the amounts the bank lists.
   - Never ask for passwords, PINs, card numbers, or any other personal information.
   - Don't give financial, investment, or tax advice.
   - For anything else, such as loans, credit cards, new accounts, changing personal details, or disputes, say that the demo can't help with it, and list what you can do.

   # Style
   - Short, warm, and clear. Ask one question at a time.
   - Show amounts with the currency code the bank returns, for example USD 1,240.00.
   - After a task is finished, ask whether there's anything else you can help with.
   ```

   Select **Save**.

   The topics named in these instructions don't exist yet. You'll build them in Modules 3 to 6, using exactly these names, and link the instructions to them in [Module 7](./07-test-and-clean-up.md#step-2--link-the-instructions-to-your-topics).

4. **Suggestions**: the AI might suggest knowledge sources (such as websites), tools, triggers, or channels. Select **Dismiss** for each one. This lab builds its own topics and tool in later modules, and a banking website as knowledge could give answers that don't match the demo data. Suggestions you don't accept disappear when you leave the page.

> [!TIP]
> **Class discussion.** Compare your generated instructions with a classmate's. The same prompt often produces different text. What else in the generated version could cause problems? Generated instructions are a good first draft, but instructions for an agent that uses topics should *point to the topics* instead of describing the steps again.

## Step 3 — Check the agent settings

1. On the **Overview** page, find the **Knowledge** section and turn **off** **Web Search**. This stops the agent from answering bank questions with information from the internet.
2. Select **Settings** (top right), and then select **Generative AI**.
3. Under **Orchestration**, confirm that **Generative** is selected. With generative orchestration, the agent chooses topics by their **description**, so write descriptions carefully in the next modules.
4. Select **Save**.

> [!NOTE]
> Leave **Allow ungrounded responses** (on the same **Generative AI** page) as it is. The agent's instructions already tell it never to invent account data. If you turn that setting off, simple messages such as "hi" might get the fallback reply instead of a greeting.

## How the lab fits together

```mermaid
flowchart LR
  U([Customer]) --> A[Contoso Friendly Banker]
  A --> L[Demo login]
  A --> N[Account number]
  A --> B[Balance inquiry]
  A --> T[Transfer money]
  A --> P[Pay a bill]
  A --> V[Buy a voucher]
  B --> F[[Agent flow:<br/>Check available funds]]
  T --> F
  P --> F
  V --> F
  L --> API[(Contoso Bank API)]
  F --> API
  T --> API
  P --> API
  V --> API
```

You'll build one topic per customer journey, plus one **agent flow** (a workflow) called **Check available funds**. Four topics call the flow before they show a balance or move money, so the funds rule lives in one place.

## The variables you'll use

| Variable | Scope | Set in | Holds |
| --- | --- | --- | --- |
| `Global.BaseUrl` | Global | Demo login | The start of every API URL, for example `https://<host>/api` |
| `Global.AccountId` | Global | Demo login | The signed-in demo account, for example `ACC001` |
| `Global.CustomerName` | Global | Demo login | The account holder's name |
| `Global.Currency` | Global | Demo login | The account currency, for example `USD` |
| `Topic.<Name>` | Topic | Any topic | Values that only one topic needs |

> [!IMPORTANT]
> A **topic** variable exists only inside the topic that created it. If another topic needs a value, make it **Global** (select the variable → **Variable properties** → **Global (any topic can access)**).
>
> Agent flows can't read `Global.` variables at all. When a topic calls a flow, it passes values such as `Global.AccountId` in as inputs (you'll do that in Module 4).

## Canvas cheat sheet

Every step in this lab starts with the **+** (**Add node**) icon under an existing node.

| To… | Select **+** → |
| --- | --- |
| Show a message | **Send a message** |
| Ask the customer something | **Ask a question** |
| Branch on a value | **Add a condition** |
| Save or calculate a value | **Variable management** → **Set a variable value** |
| Turn JSON into a record | **Variable management** → **Parse value** |
| Call the API | **Advanced** → **Send HTTP request** |
| Call an agent flow | **Add a tool** → select the flow |
| Run another topic | **Topic management** → **Go to another topic** |
| Stop early | **Topic management** → **End current topic** or **End all topics** |

**Entering a Power Fx formula:** in a message, URL, or value box, select the **{x}** icon, open the **Formula** tab, type the formula, and then select **Insert**. For a condition, open the condition's **…** menu and select **Change to formula**.

### ✅ Checkpoint

- The left navigation shows **Topics** and **Flows**.
- The agent's name is **Contoso Friendly Banker**, and its instructions are the ones from Step 2.3.
- The **Knowledge** and **Tools** sections on the **Overview** page are empty.
- **Settings** → **Generative AI** shows **Generative** selected under **Orchestration**.
- **Web Search** is off in the **Knowledge** section of the **Overview** page.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| There's no **Topics** page | You created a new-experience agent or a Microsoft 365 Copilot (declarative) agent. Turn off **New experience** and create the agent again. |
| The description box is missing, or creating an agent from a description isn't available | Your tenant turned this feature off (for example, in sovereign clouds). Select **Agent** under **Start building from scratch** instead, and then enter the name, description, and instructions from Step 2 yourself. |
| The generated agent added knowledge sources or tools | You accepted a suggestion. Remove it from the **Knowledge** or **Tools** section of the **Overview** page. |
| You can't create agents | Ask your instructor for maker permissions in the environment, or switch to the class environment. |

---

[← Previous: Deploy the API](./01-deploy-backend.md) · [Lab home](../README.md) · [Next: Demo login →](./03-demo-login.md)
