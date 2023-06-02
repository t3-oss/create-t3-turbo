import React from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { Provider } from "@acme/app/provider";
import { TRPCProvider } from "@acme/app/utils/api";

// This is the main layout of the app
// It wraps your pages with the providers they need
const RootLayout = () => {
  return (
    <TRPCProvider>
      <Provider>
        {/*
          The Stack component displays the current page.
          It also allows you to configure your screens 
        */}
        <Stack
          screenOptions={{
            headerStyle: {
              backgroundColor: "#f472b6",
            },
          }}
        />
        <StatusBar />
      </Provider>
    </TRPCProvider>
  );
};

export default RootLayout;
