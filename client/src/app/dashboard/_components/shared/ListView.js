"use client";

import { useId, useState } from "react";
import { Card, CardHeader, CardTitle } from "@/components/tailgrids/core/card";
import {
  TableRoot,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/tailgrids/core/table";

export function ListPanel({ title, description, filters, children }) {
  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <CardTitle>{title}</CardTitle>
          <p className="mt-1 text-sm text-text-tertiary">{description}</p>
        </div>
        <div className="w-full xl:w-auto">{filters}</div>
      </CardHeader>
      {children}
    </Card>
  );
}

export function ListTable({ columns, children }) {
  return (
    <TableRoot className="w-full min-w-[950px] border-none">
      <TableHeader>
        <TableRow>
          {columns.map((column, index) => (
            <TableHead
              key={column}
              className={
                index === columns.length - 1 ? "text-right" : undefined
              }
            >
              {column}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>{children}</TableBody>
    </TableRoot>
  );
}

export function ExpandableListRow({ cells, children, label = "View details" }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <>
      <TableRow className="transition hover:bg-background-gray-primary">
        {cells.map((cell, index) => (
          <TableCell key={index}>{cell}</TableCell>
        ))}
        <TableCell className="text-right">
          <button
            type="button"
            aria-expanded={open}
            aria-controls={id}
            onClick={() => setOpen(!open)}
            className="whitespace-nowrap text-sm font-medium text-brand-500 hover:text-brand-600"
          >
            {open ? "Hide details" : label}
          </button>
        </TableCell>
      </TableRow>
      <TableRow hidden={!open} id={id}>
        <TableCell
          colSpan={cells.length + 1}
          className="whitespace-normal bg-background-gray-primary/30"
        >
          {open && children}
        </TableCell>
      </TableRow>
    </>
  );
}
