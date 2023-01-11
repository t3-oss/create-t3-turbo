import NextAuth from "next-auth";

import { authOptions } from "@acme/auth";
import { NextApiRequest, NextApiResponse } from "next";

// eslint-disable-next-line import/no-anonymous-default-export
export default async (req: NextApiRequest, res: NextApiResponse) => {
  //   console.log("Incoming request", req);
  await NextAuth(req, res, authOptions);
  // console.log("Responding with", res.statusCode, res);
};
