"use client";

import { NewsTable } from "./news-table";
import { CommoditiesTable } from "./commodities-table";
import { CurrencyTable } from "./currency-table";
import { IndicesTable } from "./indices-table";

export function NewsSection() {
  return (
    <section className="w-full py-12 md:py-24 lg:py-32">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
              Latest Financial News
            </h2>
            <p className="max-w-[900px] mx-auto text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Stay updated with the latest financial news and market insights from trusted sources.
            </p>
          </div>
        </div>
        <div className="mx-auto max-w-7xl mt-12" suppressHydrationWarning>
          <div className="space-y-8">
            {/* News Table */}
            <div>
              <NewsTable />
            </div>
            
            {/* Commodities, Currency, and Indices Tables - 3 columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <CommoditiesTable />
              <CurrencyTable />
              <IndicesTable />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}