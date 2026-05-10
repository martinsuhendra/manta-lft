import Image from "next/image";

import { ImageIcon } from "lucide-react";

interface ProductCardImageProps {
  data: {
    name: string;
    image?: string | null;
  };
  /** Full-width 16:9 strip on compact card; default hero below header */
  variant?: "default" | "compact";
}

function EmptyMediaSlot() {
  return (
    <div
      className="from-muted/90 via-muted/50 to-primary/[0.06] dark:from-muted/60 dark:via-muted/40 dark:to-primary/[0.1] absolute inset-0 flex items-center justify-center bg-gradient-to-br"
      aria-hidden
    >
      <div className="border-muted-foreground/20 bg-background/50 dark:bg-background/20 flex size-16 items-center justify-center rounded-2xl border border-dashed shadow-sm backdrop-blur-[2px] sm:size-20">
        <ImageIcon className="text-muted-foreground/60 size-8 stroke-[1.35] sm:size-9" aria-hidden />
      </div>
    </div>
  );
}

export function ProductCardImage({ data, variant = "default" }: ProductCardImageProps) {
  if (variant === "compact") {
    return (
      <div className="bg-muted relative aspect-video w-full shrink-0 overflow-hidden rounded-lg border">
        {data.image ? (
          <Image
            src={data.image}
            alt={data.name}
            fill
            className="object-cover"
            sizes="(max-width:768px) 100vw, 400px"
          />
        ) : (
          <EmptyMediaSlot />
        )}
      </div>
    );
  }

  return (
    <div className="bg-muted relative mb-4 aspect-video overflow-hidden rounded-lg border">
      {data.image ? <Image src={data.image} alt={data.name} fill className="object-cover" /> : <EmptyMediaSlot />}
    </div>
  );
}
