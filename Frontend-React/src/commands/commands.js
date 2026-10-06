/*
 * Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
 * See LICENSE in the project root for license information.
 */

/* global Office, Excel */

Office.onReady(() => {
  // Office.js is initialized
});

/**
 * Handles add-in command function execution safely for Excel host.
 * @param {Office.AddinCommands.Event} event
 */
function action(event) {
  try {
    if (typeof Excel !== "undefined" && Excel.run) {
      Excel.run(async (context) => {
        await context.sync();
      }).catch((err) => {
        console.warn("Excel command execution error:", err);
      });
    }
  } catch (err) {
    console.warn("Add-in command action error:", err);
  } finally {
    if (event && typeof event.completed === "function") {
      event.completed();
    }
  }
}

if (typeof Office !== "undefined" && Office.actions && typeof Office.actions.associate === "function") {
  Office.actions.associate("action", action);
}
