export const register = async () => {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  try {
    const { backend } = await import("./lib/backend");
    const response = await backend.get("/health", {
      validateStatus: () => true,
      headers: { "Cache-Control": "no-cache" },
    });

    if (response.status === 200) {
      console.log("[Backend health]", response.status, response.data);
    } else {
      console.error("[Backend health]", response.status, response.data);
    }
  } catch (error) {
    console.error(
      "[Backend health] Unable to reach the backend:",
      error instanceof Error ? error.message : "Unknown error",
    );
  }
};
