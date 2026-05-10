/* eslint-disable complexity, max-lines */
"use client";

import * as React from "react";

import { format } from "date-fns";
import { CalendarIcon, Plus } from "lucide-react";
import { toast } from "sonner";

import { DataTable } from "@/components/data-table/data-table";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { DataTableViewOptions } from "@/components/data-table/data-table-view-options";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { CurrencyInput } from "@/components/ui/currency-input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  useCreateAdminTransaction,
  useDeleteAdminTransaction,
  useUpdateAdminTransaction,
} from "@/hooks/use-admin-transactions-mutation";
import { AdminTransactionsFilters, useAdminTransactions } from "@/hooks/use-admin-transactions-query";
import { useDataTableInstance } from "@/hooks/use-data-table-instance";
import { TRANSACTION_STATUS } from "@/lib/midtrans/constants";
import { cn } from "@/lib/utils";

import { createTransactionColumns } from "./columns";
import { formatPaymentMethodLabel, formatStatusLabel } from "./format-labels";
import { ManualTransactionDialog } from "./manual-transaction-dialog";
import {
  EditTransactionFormValues,
  editTransactionSchema,
  ManualTransactionFormValues,
  TransactionListItem,
} from "./schema";
import { TransactionDetailDrawer } from "./transaction-detail-drawer";
import { TransactionsTableSkeleton } from "./transactions-table-skeleton";

const statusFilters = [
  "ALL",
  TRANSACTION_STATUS.PENDING,
  TRANSACTION_STATUS.PROCESSING,
  TRANSACTION_STATUS.COMPLETED,
  TRANSACTION_STATUS.FAILED,
  TRANSACTION_STATUS.CANCELLED,
  TRANSACTION_STATUS.REFUNDED,
  TRANSACTION_STATUS.EXPIRED,
] as const;

const paymentMethodFilters = ["ALL", "manual", "cash", "transfer", "qris", "bank_transfer", "credit_card"] as const;

export function TransactionsTable() {
  const [isFilterPending, startFilterTransition] = React.useTransition();
  const [filters, setFilters] = React.useState<AdminTransactionsFilters>({
    status: "ALL",
    paymentMethod: "ALL",
    startDate: "",
    endDate: "",
  });
  const [selectedTransactionId, setSelectedTransactionId] = React.useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);
  const [isManualDialogOpen, setIsManualDialogOpen] = React.useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [transactionToEdit, setTransactionToEdit] = React.useState<TransactionListItem | null>(null);
  const [transactionToDelete, setTransactionToDelete] = React.useState<TransactionListItem | null>(null);
  const [editForm, setEditForm] = React.useState<EditTransactionFormValues>({
    amount: 0,
    status: TRANSACTION_STATUS.PENDING,
    paymentMethod: "",
    paymentProvider: "",
    paidAt: "",
    notes: "",
  });

  const deferredFilters = React.useDeferredValue(filters);
  const { data = [], isLoading, isFetching } = useAdminTransactions({ filters: deferredFilters });
  const createMutation = useCreateAdminTransaction();
  const updateMutation = useUpdateAdminTransaction();
  const deleteMutation = useDeleteAdminTransaction();
  const startDate = filters.startDate ? new Date(filters.startDate + "T00:00:00") : undefined;
  const endDate = filters.endDate ? new Date(filters.endDate + "T00:00:00") : undefined;

  const columns = React.useMemo(
    () =>
      createTransactionColumns({
        onEdit: (transaction) => {
          setTransactionToEdit(transaction);
          setEditForm({
            amount: transaction.amount,
            status: transaction.status as EditTransactionFormValues["status"],
            paymentMethod: transaction.paymentMethod ?? "",
            paymentProvider: transaction.paymentProvider ?? "",
            paidAt: transaction.paidAt ? transaction.paidAt.slice(0, 16) : "",
            notes: "",
          });
          setIsEditDialogOpen(true);
        },
        onDelete: (transaction) => {
          setTransactionToDelete(transaction);
        },
      }),
    [],
  );
  const table = useDataTableInstance({
    data,
    columns,
    defaultPageSize: 10,
  });

  async function handleCreateManualTransaction(values: ManualTransactionFormValues) {
    await createMutation.mutateAsync(values);
    toast.success("Transaction created successfully");
  }

  async function handleUpdateTransaction() {
    if (!transactionToEdit) return;
    const parsed = editTransactionSchema.safeParse(editForm);
    if (!parsed.success) {
      const firstIssueMessage = parsed.error.issues[0]?.message ?? "Invalid edit form";
      toast.error(firstIssueMessage);
      return;
    }

    await updateMutation.mutateAsync({
      id: transactionToEdit.id,
      data: {
        amount: parsed.data.amount,
        status: parsed.data.status,
        paymentMethod: parsed.data.paymentMethod || null,
        paymentProvider: parsed.data.paymentProvider || null,
        paidAt: parsed.data.paidAt ? new Date(parsed.data.paidAt).toISOString() : null,
        notes: parsed.data.notes || null,
      },
    });
    toast.success("Transaction updated successfully");
    setIsEditDialogOpen(false);
    setTransactionToEdit(null);
  }

  async function handleDeleteTransaction() {
    if (!transactionToDelete) return;
    await deleteMutation.mutateAsync(transactionToDelete.id);
    toast.success("Transaction deleted successfully");
    setTransactionToDelete(null);
    if (selectedTransactionId === transactionToDelete.id) {
      setSelectedTransactionId(null);
      setIsDrawerOpen(false);
    }
  }

  function handleRowClick(transaction: TransactionListItem) {
    setSelectedTransactionId(transaction.id);
    setIsDrawerOpen(true);
  }

  function updateStatusFilter(value: string) {
    startFilterTransition(() => {
      setFilters((prev) => (prev.status === value ? prev : { ...prev, status: value }));
    });
  }

  function updatePaymentMethodFilter(value: string) {
    startFilterTransition(() => {
      setFilters((prev) => (prev.paymentMethod === value ? prev : { ...prev, paymentMethod: value }));
    });
  }

  function updateStartDateFilter(value: string) {
    startFilterTransition(() => {
      setFilters((prev) => (prev.startDate === value ? prev : { ...prev, startDate: value }));
    });
  }

  function updateEndDateFilter(value: string) {
    startFilterTransition(() => {
      setFilters((prev) => (prev.endDate === value ? prev : { ...prev, endDate: value }));
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:flex xl:flex-1 xl:flex-wrap xl:items-center">
          <Input
            placeholder="Search by user name"
            value={table.getState().globalFilter ?? ""}
            onChange={(event) => table.setGlobalFilter(event.target.value)}
            className="w-full xl:w-[220px]"
          />
          <Select value={filters.status} onValueChange={updateStatusFilter}>
            <SelectTrigger className="w-full xl:w-[160px]">
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              {statusFilters.map((status) => (
                <SelectItem key={status} value={status}>
                  {formatStatusLabel(status)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filters.paymentMethod} onValueChange={updatePaymentMethodFilter}>
            <SelectTrigger className="w-full xl:w-[170px]">
              <SelectValue placeholder="Payment method" />
            </SelectTrigger>
            <SelectContent>
              {paymentMethodFilters.map((method) => (
                <SelectItem key={method} value={method}>
                  {formatPaymentMethodLabel(method)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal xl:w-[160px]",
                  !startDate && "text-muted-foreground",
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
                <span className="truncate">{startDate ? format(startDate, "MMM d, yyyy") : "Start date"}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={(date) => updateStartDateFilter(date ? format(date, "yyyy-MM-dd") : "")}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal xl:w-[160px]",
                  !endDate && "text-muted-foreground",
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
                <span className="truncate">{endDate ? format(endDate, "MMM d, yyyy") : "End date"}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={(date) => updateEndDateFilter(date ? format(date, "yyyy-MM-dd") : "")}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="flex flex-wrap items-center gap-2 xl:flex-nowrap">
          <DataTableViewOptions table={table} />
          <Button className="w-full sm:w-auto" onClick={() => setIsManualDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Add Manual Transaction</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>
      </div>
      {isLoading ? (
        <TransactionsTableSkeleton />
      ) : (
        <>
          {(isFilterPending || isFetching) && <p className="text-muted-foreground text-xs">Updating filters...</p>}
          <div className="overflow-x-auto">
            <DataTable table={table} columns={columns} onRowClick={handleRowClick} />
          </div>
        </>
      )}
      <DataTablePagination table={table} />

      <TransactionDetailDrawer
        transactionId={selectedTransactionId}
        open={isDrawerOpen}
        onOpenChange={(open) => {
          setIsDrawerOpen(open);
          if (!open) setSelectedTransactionId(null);
        }}
      />

      <ManualTransactionDialog
        open={isManualDialogOpen}
        onOpenChange={setIsManualDialogOpen}
        onSubmit={handleCreateManualTransaction}
        isSubmitting={createMutation.isPending}
      />

      <Dialog
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          setIsEditDialogOpen(open);
          if (!open) setTransactionToEdit(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Transaction</DialogTitle>
            <DialogDescription>Update the selected transaction fields.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Amount (IDR)</Label>
              <div className="relative">
                <span className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm font-medium">
                  Rp
                </span>
                <CurrencyInput
                  placeholder="0"
                  className="h-9 pl-9 tabular-nums"
                  value={editForm.amount}
                  onChange={(value) => setEditForm((prev) => ({ ...prev, amount: value }))}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Status</Label>
              <Select
                value={editForm.status}
                onValueChange={(value) =>
                  setEditForm((prev) => ({ ...prev, status: value as EditTransactionFormValues["status"] }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusFilters
                    .filter((status) => status !== "ALL")
                    .map((status) => (
                      <SelectItem key={status} value={status}>
                        {formatStatusLabel(status)}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Payment Method</Label>
              <Input
                value={editForm.paymentMethod ?? ""}
                onChange={(event) => setEditForm((prev) => ({ ...prev, paymentMethod: event.target.value }))}
                placeholder="manual / qris / transfer"
              />
            </div>
            <div className="space-y-1">
              <Label>Payment Provider</Label>
              <Input
                value={editForm.paymentProvider ?? ""}
                onChange={(event) => setEditForm((prev) => ({ ...prev, paymentProvider: event.target.value }))}
                placeholder="manual / midtrans / other"
              />
            </div>
            <div className="space-y-1">
              <Label>Paid At</Label>
              <Input
                type="datetime-local"
                value={editForm.paidAt ?? ""}
                onChange={(event) => setEditForm((prev) => ({ ...prev, paidAt: event.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label>Notes</Label>
              <Input
                value={editForm.notes ?? ""}
                onChange={(event) => setEditForm((prev) => ({ ...prev, notes: event.target.value }))}
                placeholder="Optional admin note"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={updateMutation.isPending}>
              Cancel
            </Button>
            <Button onClick={handleUpdateTransaction} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!transactionToDelete} onOpenChange={(open) => !open && setTransactionToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Transaction</DialogTitle>
            <DialogDescription>
              This will delete the transaction and its linked memberships without bookings. This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <div className="text-sm">
            {transactionToDelete ? (
              <p>
                Delete transaction <span className="font-medium">{transactionToDelete.id}</span> for{" "}
                <span className="font-medium">{transactionToDelete.userName}</span>?
              </p>
            ) : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTransactionToDelete(null)} disabled={deleteMutation.isPending}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteTransaction} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
