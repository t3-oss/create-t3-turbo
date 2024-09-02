import { useRouter } from "next/navigation";

import { api } from "@acme/api/provider";

import { deleteToken } from "~/utils/token";

export const useUser = () => {
  const { data: user } = api.auth.getUser.useQuery();
  return user;
};

export const useSignOut = () => {
  const utils = api.useUtils();
  const router = useRouter();

  return async () => {
    deleteToken();
    await utils.invalidate();
    router.replace("/");
  };
};
