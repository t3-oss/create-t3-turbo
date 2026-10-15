import { getBaseUrl } from "@/lib";

import { LacyLogo } from "~/app/(home)/_components/lacy-logo";
import AnimatedNoise from "~/app/(home)/_components/noise";

type ItemProps = {
  title: string;
  description?: string;
  link: string;
};

const Item = ({ title, description, link }: ItemProps) => {
  return (
    <li className="flex flex-col justify-center">
      <a
        href={link}
        className="flex items-center justify-between gap-2"
        target="_blank"
      >
        {title}
        {description && (
          <span className="text-sm text-muted-foreground">{description}</span>
        )}
      </a>
    </li>
  );
};

const List = ({ items }: { items: ItemProps[] }) => {
  return (
    <ul className="grid grid-cols-1 gap-2">
      {items.map((item) => (
        <Item key={item.title} {...item} />
      ))}
    </ul>
  );
};

// Define the type for the API response
type lacyUrlResponse = {
  url: string;
};

const HomePage = async () => {
  // Fetch the social URL
  const baseUrl = getBaseUrl();
  console.log(`Fetching from: ${baseUrl}/api/me`);
  const lacyUrl = await fetch(`${baseUrl}/api/me`)
    .then((res) => res.text())
    .catch((error) => {
      console.error("Error fetching social URL:", error);
      return "https://lacymorrow.com"; // Fallback URL
    });

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "lacy.is",
    url: "https://lacy.is",
    author: {
      "@type": "Person",
      name: "Lacy Morrow",
      url: "https://lacymorrow.com",
      sameAs: ["https://twitter.com/lacybuilds"],
    },
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <AnimatedNoise opacity={0.1} />
      <LacyLogo />
      <article className="flex max-w-lg flex-col">
        <List
          items={[
            {
              title: "shipkit",
              description: "launch apps quicker",
              link: "https://shipkit-five.vercel.app",
            },
            {
              title: "fly5",
              description: "aerial cinematography",
              link: "https://fly5.live",
            },
          ]}
        />
      </article>
      <p className="mt-8 text-sm text-muted-foreground">
        by{" "}
        <a
          href="https://lacymorrow.com"
          className="underline underline-offset-4"
        >
          Lacy Morrow
        </a>
      </p>
    </main>
  );
};

export default HomePage;
