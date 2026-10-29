// Lancé une fois au démarrage du serveur : on démarre les tâches automatiques (rappels, newsletter).
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs" && process.env.NODE_ENV === "production") {
    const { startJobs } = await import("./lib/jobs");
    startJobs();
  }
}
