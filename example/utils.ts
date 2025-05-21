import { exclaim } from "./shared";

export function greet(name: string) {
  console.log("Hello " + exclaim(name));
}
