"use client";

import { Tabs } from "@acme/ui/tabs2";

import SignIn from "~/components/sign-in";
import { SignUp } from "~/components/sign-up";

export default function Page() {
  // const router = useRouter();
  // const params = useSearchParams();
  // useEffect(() => {
  //   client.oneTap({
  //     fetchOptions: {
  //       onError: ({ error }) => {
  //         toast.error(error.message || "An error occurred");
  //       },
  //       onSuccess: () => {
  //         toast.success("Successfully signed in");
  //         router.push(getCallbackURL(params));
  //       },
  //     },
  //   });
  // }, []);

  return (
    <div className="w-full">
      <div className="flex w-full flex-col items-center justify-center md:py-10">
        <div className="md:w-[400px]">
          <Tabs
            tabs={[
              {
                title: "Sign In",
                value: "sign-in",
                content: <SignIn />,
              },
              {
                title: "Sign Up",
                value: "sign-up",
                content: <SignUp />,
              },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
