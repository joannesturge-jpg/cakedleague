import { randomBytes } from "node:crypto";

export function generateInviteCode() {
  return randomBytes(6).toString("hex");
}
