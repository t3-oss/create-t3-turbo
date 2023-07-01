import type { GetServerSidePropsContext, NextPage } from "next";
import Head from "next/head";

import { useLocale } from "@acme/lib/hooks/useLocale";

import { ssrInit } from "~/server/ssr";

const Home: NextPage = () => {
  const { t, isLocaleReady } = useLocale();
  if (!isLocaleReady) return null;
  return (
    <>
      <main className="flex h-screen flex-col items-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
        <div className="container mt-12 flex flex-col items-center justify-center gap-4 px-4 py-8">
          <h1 className="text-5xl font-extrabold tracking-tight sm:text-[5rem]">
            <title>{t("Create_T3_App")}</title>
          </h1>
        </div>
      </main>
    </>
  );
};

export const getServerSideProps = async (
  context: GetServerSidePropsContext,
) => {
  const ssr = await ssrInit(context);

  return {
    props: {
      trpcState: ssr.dehydrate(),
    },
  };
};

export default Home;
