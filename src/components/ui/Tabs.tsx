"use client";
import React from 'react';

export type TabItem = {
  key: string;
  label: string;
};

type TabsProps = {
  items: TabItem[];
  activeKey: string;
  onChange: (key: string) => void;
  className?: string;
};

export default function Tabs({ items, activeKey, onChange, className }: TabsProps) {
  return (
    <nav className={"flex overflow-x-auto border-b border-gray-200 py-4 dark:border-white/10 " + (className ?? '')}>
      <ul
        role="list"
        className="flex min-w-full flex-none gap-x-6 px-4 text-sm/6 font-semibold text-gray-700 sm:px-6 lg:px-8 dark:text-gray-300"
      >
        {items.map((it) => (
          <li key={it.key}>
            <button
              type="button"
              onClick={() => onChange(it.key)}
              className={(activeKey === it.key
                ? 'text-indigo-600 dark:text-indigo-400'
                : 'text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white')}
            >
              {it.label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
