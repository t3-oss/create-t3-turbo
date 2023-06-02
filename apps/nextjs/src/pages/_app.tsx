import "raf/polyfill";
import "setimmediate";
import "../styles/globals.css";
import type { AppType } from "next/app";
import type { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";

import { Provider } from "@acme/app/provider";
import { api } from "@acme/app/utils/api/index.web";

const MyApp: AppType<{ session: Session | null }> = ({
  Component,
  pageProps: { session, ...pageProps },
}) => {
  return (
    <SessionProvider session={session}>
      <Provider>
        <Component {...pageProps} />
      </Provider>
    </SessionProvider>
  );
};

export default api.withTRPC(MyApp);
