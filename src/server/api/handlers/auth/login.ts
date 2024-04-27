import { LoginRequest } from "@/schemas/auth";
import { publicProcedure } from "../../trpc";
import { db } from "@/server/db";
import * as bcrypt from "bcrypt";
import * as jwt from "jsonwebtoken";
import { env } from "@/env";

export const LoginHandler = publicProcedure.input(LoginRequest).mutation(
  async ({
    input,
  }): Promise<{
    message: string;
    success: boolean;
    error?: Record<string, unknown>;
    data?: {
      authToken: string;
      userId: string;
      username: string;
      email: string;
    };
  }> => {
    try {
      const verification = LoginRequest.safeParse(input);

      if (!verification.success) {
        return {
          success: false,
          message: "All fields are required.",
          error: verification.error.flatten(),
        };
      }

      const { email, password, username } = verification.data;

      const userToFind = await db.user.findFirst({
        where: {
          OR: [{ email }, { username }],
        },
      });

      if (!userToFind) {
        return {
          success: false,
          message: "Invalid credentials.",
        };
      }

      const comparePassword = await bcrypt.compare(
        password,
        userToFind.password,
      );

      if (!comparePassword) {
        return {
          success: false,
          message: "Invalid credentials.",
        };
      }

      const payload = {
        userId: userToFind.id,
        username: userToFind.username,
        email: userToFind.email,
      };

      const authToken = jwt.sign(payload, env.TOKEN_SECRET);

      return {
        success: true,
        message: `Welcome aboard, ${userToFind.username}!`,
        data: {
          ...payload,
          authToken,
        },
      };
    } catch (_error) {
      return {
        success: false,
        message: "Internal server error",
      };
    }
  },
);
