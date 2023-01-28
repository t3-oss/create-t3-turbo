import "../styles/globals.css";
import type { AppType } from "next/app";

const MyApp: AppType = ({ Component, pageProps }) => {
  return <Component {...pageProps} />;
};

export default MyApp;
