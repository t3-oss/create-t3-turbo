import type { Metadata } from "next";

import { Thinking } from "@/app/thinking/_components/thinking";


export const metadata: Metadata = {
	title: "Thinking",
	alternates: { canonical: "/thinking" },
	robots: { index: false, follow: false },
};

export default function ThinkingPage() {
	return <Thinking />;
}
