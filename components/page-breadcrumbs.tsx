import Link from "next/link";

import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";

type Crumb = { label: string; href?: string };

export default function PageBreadcrumbs({ items }: { items: Crumb[] }) {
  return <Breadcrumb><BreadcrumbList>{items.map((item, index) => <FragmentItem key={`${item.label}-${index}`} item={item} separator={index > 0} />)}</BreadcrumbList></Breadcrumb>;
}

function FragmentItem({ item, separator }: { item: Crumb; separator: boolean }) {
  return <>{separator && <BreadcrumbSeparator />}<BreadcrumbItem>{item.href ? <BreadcrumbLink render={<Link href={item.href} />}>{item.label}</BreadcrumbLink> : <BreadcrumbPage>{item.label}</BreadcrumbPage>}</BreadcrumbItem></>;
}
