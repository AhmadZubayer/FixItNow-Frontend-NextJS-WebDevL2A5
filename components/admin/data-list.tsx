"use client";

import { useState, type ReactNode } from "react";
import EmptyState from "@/components/empty-state";
import PageSkeleton from "@/components/page-skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pagination, PaginationContent, PaginationItem } from "@/components/ui/pagination";

const pageSize = 30;

type Props<T> = {
  title: string;
  items: T[];
  searchText: (item: T) => string;
  loading: boolean;
  error: string;
  onRetry: () => void;
  children: (items: T[], offset: number) => ReactNode;
  showCount?: boolean;
  paginate?: boolean;
};

const AdminDataList = <T,>({ title, items, searchText, loading, error, onRetry, children, showCount = true, paginate = true }: Props<T>) => {
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const matching = items.filter((item) => searchText(item).toLowerCase().includes(query.toLowerCase()));
  const pageCount = Math.max(1, Math.ceil(matching.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const offset = paginate ? (currentPage - 1) * pageSize : 0;
  const visible = paginate ? matching.slice(offset, offset + pageSize) : matching;

  return <div className="space-y-6">
    <h1 className="text-2xl font-semibold tracking-tight">{title}{showCount && !loading && !error ? ` (${items.length})` : ""}</h1>
    <form className="flex max-w-lg items-center gap-2" role="search" onSubmit={(event) => { event.preventDefault(); setQuery(input.trim()); setPage(1); }}>
      <Input type="search" aria-label={`Search ${title.toLowerCase()}`} placeholder={`Search ${title.toLowerCase()}`} maxLength={100} value={input} onChange={(event) => { setInput(event.target.value); if (!event.target.value) { setQuery(""); setPage(1); } }} />
      <Button type="submit" variant="outline">Search</Button>
    </form>
    {loading ? <PageSkeleton /> : error ? <div role="alert" className="space-y-2"><p className="text-sm text-destructive">{error}</p><Button variant="outline" onClick={onRetry}>Retry</Button></div> : <>
      {matching.length ? children(visible, offset) : <EmptyState title={query ? "No matching results" : `No ${title.toLowerCase()} yet`} description={query ? "Try another search term." : "Records will appear here when available."} />}
      {paginate && <Pagination className="justify-start" aria-label={`${title} pagination`}>
        <PaginationContent className="flex-wrap gap-2">
          <PaginationItem><Button size="sm" variant="outline" disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)}>Previous</Button></PaginationItem>
          <PaginationItem><span className="px-2 text-sm" aria-live="polite">Page {currentPage} of {pageCount}</span></PaginationItem>
          <PaginationItem><Button size="sm" variant="outline" disabled={currentPage >= pageCount} onClick={() => setPage(currentPage + 1)}>Next</Button></PaginationItem>
        </PaginationContent>
      </Pagination>}
    </>}
  </div>;
};

export default AdminDataList;
