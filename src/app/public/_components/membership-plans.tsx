"use client";

import { PublicProductCard, type PublicProduct } from "./public-product-card";
import { SectionWithPattern } from "./section-with-pattern";

interface MembershipPlansProps {
  products: PublicProduct[];
}

export function MembershipPlans({ products }: MembershipPlansProps) {
  return (
    <SectionWithPattern id="plans" className="border-border/60 sporty-section-fill-white border-t py-24 sm:py-32">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-brand-primary text-sm font-semibold tracking-widest uppercase">Membership</p>
          <h2 className="text-brand-accent mt-2 text-2xl font-black tracking-tighter uppercase italic sm:text-3xl md:text-4xl md:text-5xl">
            Join The Ranks
          </h2>
          <p className="text-brand-accent/70 mt-3 text-sm sm:mt-4 sm:text-base">
            No contracts, no hidden fees. Just pure effort and results.
          </p>
        </div>

        {products.length === 0 ? (
          <div className="text-brand-accent/60 mt-16 text-center">
            <p className="text-lg">No membership plans available at the moment.</p>
            <p className="mt-2 text-sm">Please check back later.</p>
          </div>
        ) : (
          <div className="mx-auto mt-16 grid max-w-6xl grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <PublicProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </SectionWithPattern>
  );
}
