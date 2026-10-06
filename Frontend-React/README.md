# FinAccrual React Add-in

This is the official React implementation of the Excel task-pane add-in. It runs on port `3001` and uses a dedicated Office add-in ID.

## Run locally

```powershell
npm install
npm run dev-server
npm start
```

Sideload `manifest.xml` if you prefer to register the add-in manually.

## Build

```powershell
npm run build
```

The React implementation keeps the original task-pane stylesheet and visual class system, while moving view selection, sign-in, plan selection, checkout handoff, OAuth handoff, dashboard state, and session persistence into React components.
