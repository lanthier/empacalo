import { greet } from "./utils";
import calc, { double } from "./math";
greet("Alice");
console.log("5 doubled is", double(5));
console.log("3 + 4 =", calc(3, 4));
