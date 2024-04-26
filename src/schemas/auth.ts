import { z } from "zod";

export const SignupRequest = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  username: z.string().min(3),
  profilePicture: z.string().optional(),
});
