import { getPayload } from "payload";

// import { handler, OPTIONS } from "@acme/api";
import { config } from "@acme/payload";

// const authHandler =
//   // auth(
//   handler;
// // );

export async function GET(request: Request) {
  const payload = await getPayload({ config });
  const posts = await payload.find({
    collection: "posts",
  });
  return Response.json({ hello: "world", posts });
}
