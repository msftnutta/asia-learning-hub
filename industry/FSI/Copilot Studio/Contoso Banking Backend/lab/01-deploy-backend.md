# Module 1 — Deploy the banking API to Azure App Service

[Lab home](../README.md) · **Module 1 of 7** · [Next: Create the agent →](./02-create-agent.md)

| | |
| --- | --- |
| **Time** | 20 minutes |
| **You will** | Create a new resource group and a Premium v3 App Service plan, then deploy the Contoso Bank API |
| **You need** | An Azure subscription where you can create resource groups |

## Before you start

Use these settings for every resource in this module:

| Setting | Value | Why |
| --- | --- | --- |
| Region | `southeastasia` (fallback: `eastasia`) | Close to the class. Keep **all** resources in the same region. |
| Pricing plan | **P0v3** (Premium v3, Linux) | The cheapest Premium SKU, about half the price of P1v3 |
| Runtime | Node.js 22 LTS | Node.js 20 reached end of support on 30 April 2026 |

> [!NOTE]
> At Azure retail prices, P0v3 Linux in Southeast Asia costs about **USD 0.09 per hour (roughly USD 67 per month)** while it exists. Delete the resource group when the class ends ([Module 7](./07-test-and-clean-up.md#clean-up)). Check current prices on the [App Service pricing page](https://azure.microsoft.com/pricing/details/app-service/linux/).

## Step 1 — Open Azure Cloud Shell

1. Sign in to the [Azure portal](https://portal.azure.com).
2. Select the **Cloud Shell** icon in the top bar, and then choose **Bash**.
3. Confirm you're using the class subscription:

   ```bash
   az account show --query name -o tsv
   ```

   If it's the wrong one, switch:

   ```bash
   az account set --subscription "<subscription name or ID>"
   ```

Cloud Shell already includes the Azure CLI and Git, so you don't need to install anything.

## Step 2 — Choose your names

Replace `<your-initials>` with something unique to you, such as `nw`. App names must be unique across all of Azure, so the script adds a random number.

```bash
INITIALS=<your-initials>
LOCATION=southeastasia
RG=rg-contoso-bank-$INITIALS
PLAN=asp-contoso-bank-$INITIALS
APP=contoso-bank-$INITIALS-$RANDOM
echo "Your app name is: $APP"
```

> [!IMPORTANT]
> Write down your app name. Cloud Shell forgets these variables when it times out. If that happens, run this step again, but set `APP` to the name you wrote down instead of generating a new one.

## Step 3 — Create the resource group

```bash
az group create --name $RG --location $LOCATION
```

## Step 4 — Create the P0v3 App Service plan

Creating the plan is the real availability check. If P0v3 can't run in the region, this command fails with a clear error, and nothing is billed.

```bash
az appservice plan create \
  --name $PLAN \
  --resource-group $RG \
  --location $LOCATION \
  --is-linux \
  --sku P0V3
```

Confirm what you got:

```bash
az appservice plan show --name $PLAN --resource-group $RG --query "{sku:sku.name, region:location, kind:kind}" -o table
```

The output should show `P0v3`, `Southeast Asia`, and `linux`.

**If the plan command fails** with an error saying the SKU isn't available, the region has no capacity, or the pricing tier isn't allowed, switch to East Asia and start again from Step 3:

```bash
az group delete --name $RG --yes
LOCATION=eastasia
```

> [!NOTE]
> Don't use `az appservice list-locations` to decide whether P0v3 is available. Its results depend on your subscription and CLI version, and it can return nothing even when the plan would be created successfully.

## Step 5 — Create the web app and deploy the code

1. Download the code, and move into the backend folder. This folder contains `package.json` and `server.js`.

   ```bash
   git clone https://github.com/msftnutta/asia-learning-hub.git
   cd "asia-learning-hub/industry/FSI/Copilot Studio/Contoso Banking Backend"
   ```

   If you're working from your own fork, replace `msftnutta` with your GitHub username.

2. Create the web app in your plan, with the Node.js 22 runtime:

   ```bash
   az webapp create \
     --name $APP \
     --resource-group $RG \
     --plan $PLAN \
     --runtime "NODE:22-lts"
   ```

3. Turn on build automation, so App Service runs `npm install` when you deploy:

   ```bash
   az webapp config appsettings set \
     --name $APP \
     --resource-group $RG \
     --settings SCM_DO_BUILD_DURING_DEPLOYMENT=true
   ```

4. Zip the folder's contents, and then deploy the zip:

   ```bash
   rm -f ~/contoso-bank.zip
   zip -r ~/contoso-bank.zip . -x "node_modules/*"

   az webapp deploy \
     --name $APP \
     --resource-group $RG \
     --src-path ~/contoso-bank.zip \
     --type zip
   ```

   Run `zip` **inside the backend folder**, so that `package.json` sits at the top of the zip. The deployment installs the dependencies and starts the app with `npm start`. It takes about 2–4 minutes.

> [!NOTE]
> Older guides use `az webapp up` for this step. That command is deprecated, and Cloud Shell shows a warning if you run it. Use the commands above instead.

## Step 6 — Get your API base URL

```bash
HOST=$(az webapp show --name $APP --resource-group $RG --query defaultHostName -o tsv)
echo "Website:      https://$HOST/"
echo "API base URL: https://$HOST/api"

curl -s "https://$HOST/health"
curl -s "https://$HOST/api/login?userId=USER001"
```

Copy the **API base URL**. You'll paste it into Copilot Studio in [Module 3](./03-demo-login.md).

> [!TIP]
> Always copy the host name from this command rather than typing it. New App Service apps can receive a unique host name that includes a random suffix and the region.

### ✅ Checkpoint

- `/health` returns `{"status":"ok"}`.
- `/api/login?userId=USER001` returns `"accountId":"ACC001"`.
- `https://<your-host>/api-docs` opens the API reference in your browser.

## Optional — Continuous deployment from GitHub

Only use this if you want every push to your fork to redeploy the app automatically. The rest of the lab doesn't need it.

1. Fork this repository to your GitHub account.
2. In the Azure portal, open your web app and select **Deployment Center**.
3. Set **Source** to **GitHub**, and then select your organization, repository, and the `main` branch.
4. Under **Authentication type**, choose **User-assigned identity**. This option avoids storing a publish-profile password in GitHub.
5. Select **Save**. Azure commits a workflow file to `.github/workflows/` in your fork.
6. Edit that workflow in GitHub. It builds from the **repository root**, but this app lives in a subfolder, so the build fails until you change it:
   - Add `working-directory: 'industry/FSI/Copilot Studio/Contoso Banking Backend'` to the `npm install` step.
   - Change the path that gets uploaded or zipped, and the `package` value in the deploy step, to that same folder.

   Step names differ between generated workflows. The rule is that each path must point to the folder that contains `package.json`.
7. Commit the change, and then watch the run on your fork's **Actions** tab.

> [!CAUTION]
> This repository is public. Never commit publish profiles, passwords, keys, or connection strings. The demo API doesn't need any secrets.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| The browser shows **Application Error**, or the logs say `Cannot find module 'express'` | Build automation didn't run. Repeat Step 5.3, and then repeat Step 5.4. |
| The logs say `Cannot find module '/home/site/wwwroot/server.js'` | The zip was created in the wrong folder. Run the `cd` command from Step 5.1, and then repeat Step 5.4. |
| SKU not available, a capacity error, or the pricing tier isn't allowed | Run `az group delete --name $RG --yes`, set `LOCATION=eastasia`, and repeat Steps 3–5. |
| `Website with given name already exists` | App names are global. Run `APP=contoso-bank-$INITIALS-$RANDOM` and repeat Steps 5.2–5.4. |
| The browser shows **Application Error** | Run `az webapp log tail --name $APP --resource-group $RG` and read the error. |
| Balances look wrong after testing | The data is in memory. Run `az webapp restart --name $APP --resource-group $RG` to reset it. |

---

[Lab home](../README.md) · [Next: Create the agent →](./02-create-agent.md)
