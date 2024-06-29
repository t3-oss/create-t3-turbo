import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import Layout from "./layout";

describe("layout", () => {
  test("should render", () => {
    render(
      <Layout>
        <div>Test</div>
      </Layout>,
    );
    expect(screen.getByText("Test")).toBeDefined();
  });
});
