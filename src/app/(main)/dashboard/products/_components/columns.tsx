import Image from "next/image";

import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { EllipsisVertical, Calendar, Banknote, Clock, Package } from "lucide-react";

import { ProductPriceDisplay } from "@/components/product-price-display";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatusBadge } from "@/components/ui/status-badge";
import { resolveProductPricing } from "@/lib/checkout-pricing";

import { DataTableColumnHeader } from "../../../../../components/data-table/data-table-column-header";

import { Product } from "./schema";

interface ProductActions {
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (product: Product) => void;
  onViewProduct: (product: Product) => void;
}

export const createProductColumns = (actions: ProductActions): ColumnDef<Product>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "image",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Image" />,
    cell: ({ row }) => {
      const image = row.original.image;
      const name = row.original.name;

      return (
        <div className="bg-muted relative h-12 w-12 overflow-hidden rounded-md border">
          {image ? (
            <Image src={image} alt={name} fill className="object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Package className="text-muted-foreground h-4 w-4" />
            </div>
          )}
        </div>
      );
    },
    enableSorting: false,
  },
  {
    accessorKey: "name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Product Name" />,
    cell: ({ row }) => {
      const name = row.original.name;
      const description = row.original.description;

      return (
        <div
          className="hover:text-primary flex max-w-[200px] min-w-0 cursor-pointer flex-col gap-1 transition-colors"
          onClick={() => actions.onViewProduct(row.original)}
        >
          <div className="truncate font-medium" title={name}>
            {name}
          </div>
          {description && (
            <div className="text-muted-foreground line-clamp-2 text-sm break-words" title={description}>
              {description}
            </div>
          )}
        </div>
      );
    },
    meta: {
      className: "whitespace-normal",
    },
    size: 200,
    minSize: 180,
    maxSize: 220,
  },
  {
    accessorKey: "brands",
    header: "Brands",
    cell: ({ row }) => {
      const brands = row.original.brands;
      if (!brands.length) return null;
      return (
        <div className="flex flex-wrap gap-1">
          {brands.map((brand) => (
            <Badge key={brand.id} variant="outline" className="font-normal">
              {brand.name}
            </Badge>
          ))}
        </div>
      );
    },
    enableSorting: false,
  },
  {
    accessorKey: "price",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Price" />,
    cell: ({ row }) => {
      const product = row.original;
      const pricing =
        product.salePrice != null && product.salePrice < product.price
          ? resolveProductPricing({ price: product.price, salePrice: product.salePrice })
          : resolveProductPricing({
              price: product.price,
              salePrice: product.salePrice,
              discountStartsAt: product.discountStartsAt,
              discountEndsAt: product.discountEndsAt,
            });

      return (
        <div className="flex items-center gap-1 text-sm font-medium">
          <Banknote className="h-3 w-3 shrink-0" />
          <ProductPriceDisplay
            listPrice={product.price}
            finalPrice={product.finalPrice ?? pricing.priceAfterProduct}
            isOnSale={pricing.isOnSale}
            discountLabel={product.discountLabel ?? pricing.discountLabel}
            size="sm"
          />
        </div>
      );
    },
  },
  {
    accessorKey: "validDays",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Valid Days" />,
    cell: ({ row }) => {
      const validDays = row.original.validDays;

      return (
        <div className="flex items-center gap-1 text-sm">
          <Clock className="h-3 w-3" />
          {validDays} days
        </div>
      );
    },
  },
  {
    accessorKey: "isActive",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => {
      const isActive = row.original.isActive;

      return <StatusBadge variant={isActive ? "success" : "secondary"}>{isActive ? "Active" : "Inactive"}</StatusBadge>;
    },
  },
  {
    accessorKey: "_count.memberships",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Purchases" />,
    cell: ({ row }) => {
      const count = row.original._count.memberships;

      return <StatusBadge variant="outline">{count}</StatusBadge>;
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Created" />,
    cell: ({ row }) => {
      const date = new Date(row.original.createdAt);

      return (
        <div className="flex items-center gap-1 text-sm">
          <Calendar className="h-3 w-3" />
          {format(date, "MMM dd, yyyy")}
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const product = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
              size="icon"
            >
              <EllipsisVertical />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={() => actions.onViewProduct(product)}>View Details</DropdownMenuItem>
            <DropdownMenuItem onClick={() => actions.onEditProduct(product)}>Edit Product</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={() => actions.onDeleteProduct(product)}>
              Delete Product
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
    enableSorting: false,
  },
];
