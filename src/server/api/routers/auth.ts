import { LoginHandler, SignupHandler } from "../handlers/auth";
import { createTRPCRouter } from "../trpc";

export const authRouter = createTRPCRouter({
  signup: SignupHandler,
  login: LoginHandler,
});
