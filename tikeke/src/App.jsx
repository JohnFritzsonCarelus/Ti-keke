
async function logError(errorMessage, errorSource) {
  try {
    await fetch(`${FIRESTORE_URL}/errorLogs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fields: {
          message: { stringValue: String(errorMessage).slice(0, 500) },
          source: { stringValue: String(errorSource || "unknown") },
          timestamp: { stringValue: new Date().toISOString() },
          userAgent: { stringValue: navigator.userAgent }
        }
      })
    });
  } catch (e) { console.log("Error logging failed:", e); }
}

window.onerror = function(message, source, lineno, colno, error) {

};

window.onunhandledrejection = function(event) {
 
};
