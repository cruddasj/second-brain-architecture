export const setup = { label: "Repository", tokenLabel: "Access token", instructions: "No repository adapter is installed.", privacy: "Local content stays on this device." };
export const tokenSetupURL = () => "";
export async function downloadSnapshot() { throw new Error("No repository adapter is installed."); }
