import { userPrisma } from "@acme/user-db";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const users = await userPrisma.post.findMany();
  res.status(200).json(users);
}
