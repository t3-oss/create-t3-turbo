"use client";

import { useState } from "react";
import { motion } from "framer-motion";

import { cn } from "@acme/ui";

interface Tab {
  title: string;
  value: string;
  content?: string | React.ReactNode;
}

export const Tabs = ({
  tabs: propTabs,
  containerClassName,
  activeTabClassName,
  tabClassName,
  contentClassName,
}: {
  tabs: Tab[];
  containerClassName?: string;
  activeTabClassName?: string;
  tabClassName?: string;
  contentClassName?: string;
}) => {
  const [active, setActive] = useState<Tab>(
    propTabs.length > 0 && propTabs[0]
      ? propTabs[0]
      : { title: "", value: "", content: undefined },
  );
  const [tabs, setTabs] = useState<Tab[]>(propTabs);

  const moveSelectedTabToTop = (idx: number) => {
    const newTabs = [...propTabs];
    const selectedTab = newTabs.splice(idx, 1);
    if (
      newTabs.length > 0 &&
      newTabs[0] &&
      selectedTab.length > 0 &&
      selectedTab[0]
    ) {
      newTabs.unshift(selectedTab[0]);
      setTabs(newTabs);
      setActive(newTabs[0]);
    }
  };

  const [hovering, setHovering] = useState(false);

  return (
    <>
      <div
        className={cn(
          "no-visible-scrollbar perspective-[1000px] relative mt-0 flex w-full max-w-max flex-row items-center justify-start overflow-auto border-x border-t bg-opacity-0 sm:overflow-visible",
          containerClassName,
        )}
      >
        {propTabs.map((tab, idx) => (
          <button
            key={tab.title}
            onClick={() => {
              moveSelectedTabToTop(idx);
            }}
            onMouseEnter={() => setHovering(true)}
            onMouseLeave={() => setHovering(false)}
            className={cn(
              "relative rounded-full px-4 py-2 opacity-80 hover:opacity-100",
              tabClassName,
            )}
            style={{
              transformStyle: "preserve-3d",
            }}
          >
            {active.value === tab.value && (
              <motion.div
                transition={{
                  duration: 0.2,
                  delay: 0.1,

                  type: "keyframes",
                }}
                animate={{
                  x: tabs.indexOf(tab) === 0 ? [0, 0, 0] : [0, 0, 0],
                }}
                className={cn(
                  "absolute inset-0 bg-gray-200 opacity-100 dark:bg-zinc-900/90",
                  activeTabClassName,
                )}
              />
            )}

            <span
              className={cn(
                "relative block text-black dark:text-white",
                active.value === tab.value
                  ? "font-medium text-opacity-100"
                  : "opacity-40",
              )}
            >
              {tab.title}
            </span>
          </button>
        ))}
      </div>
      <FadeInDiv
        tabs={tabs}
        active={active}
        key={active.value}
        hovering={hovering}
        className={cn("", contentClassName)}
      />
    </>
  );
};

export const FadeInDiv = ({
  className,
  tabs,
}: {
  className?: string;
  key?: string;
  tabs: Tab[];
  active: Tab;
  hovering?: boolean;
}) => {
  const isActive = (tab: Tab) => {
    return tab.value === tabs[0]?.value;
  };
  return (
    <div className="relative h-full w-full">
      {tabs.map((tab, idx) => (
        <motion.div
          key={tab.value}
          style={{
            scale: 1 - idx * 0.1,
            zIndex: -idx,
            opacity: idx < 3 ? 1 - idx * 0.1 : 0,
          }}
          animate={{
            transition: {
              duration: 0.2,
              delay: 0.1,
              type: "keyframes",
            },
          }}
          className={cn(
            "h-full w-full",
            isActive(tab) ? "" : "hidden",
            className,
          )}
        >
          {tab.content}
        </motion.div>
      ))}
    </div>
  );
};
