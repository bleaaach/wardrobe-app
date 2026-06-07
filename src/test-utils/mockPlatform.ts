let currentOS: "web" | "android" | "ios" = "web";
export function setPlatform(os: "web" | "android" | "ios") { currentOS = os; }
export function getPlatform() { return { OS: currentOS }; }
