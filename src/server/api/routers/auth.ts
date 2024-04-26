import { db } from "@/server/db";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { SignupRequest } from "@/schemas/auth";
import * as bcrypt from "bcrypt";
import * as jwt from "jsonwebtoken";
import { env } from "@/env";

export const authRouter = createTRPCRouter({
  signup: publicProcedure.input(SignupRequest).mutation(async ({ input }) => {
    const verification = SignupRequest.safeParse(input);

    if (!verification.success) {
      return {
        success: false,
        message: "All fields are required.",
        error: verification.error.flatten(),
      };
    }

    const { email, password, username, profilePicture } = verification.data;

    const userToFind = await db.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (userToFind) {
      return {
        success: false,
        message: "User already exists.",
      };
    }

    const newHashedPassword = await bcrypt.hash(password, 10);

    const userAvatar = profilePicture
      ? profilePicture
      : `https://ui-avatars.com/api/?background=random&name=${username}&rounded=true`;

    const newUser = await db.user.create({
      data: {
        email,
        password: newHashedPassword,
        username,
        profilePicture: userAvatar,
      },
      select: {
        id: true,
        email: true,
        username: true,
        profilePicture: true,
      },
    });

    const authToken = jwt.sign(
      {
        userId: newUser.id,
        username: newUser.username,
        email: newUser.email,
      },
      env.TOKEN_SECRET,
    );

    return {
      success: true,
      message: `Welcome aboard, ${newUser.username}!`,
      data: {
        ...newUser,
        authToken,
      },
    };
  }),
});
