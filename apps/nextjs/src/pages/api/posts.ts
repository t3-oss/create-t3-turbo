import { postPrisma } from "@acme/post-db";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const posts = await postPrisma.post.findMany();
  res.status(200).json(posts);
}
