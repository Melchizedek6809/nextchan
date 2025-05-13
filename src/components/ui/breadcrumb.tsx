import * as React from "react"
import Link from "next/link"
import { ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"

// Root breadcrumb component
export interface BreadcrumbProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode
}

export function Breadcrumb({ children, className, ...props }: BreadcrumbProps) {
  return (
    <nav 
      aria-label="Breadcrumb" 
      className={cn("flex items-center text-sm text-muted-foreground", className)} 
      {...props}
    >
      <ol className="flex items-center space-x-2">
        {children}
      </ol>
    </nav>
  )
}

// Breadcrumb item component
export interface BreadcrumbItemProps extends React.HTMLAttributes<HTMLLIElement> {
  children: React.ReactNode
  isCurrent?: boolean
}

export function BreadcrumbItem({ 
  children, 
  className, 
  isCurrent,
  ...props 
}: BreadcrumbItemProps) {
  return (
    <li 
      className={cn("flex items-center", className)} 
      aria-current={isCurrent ? "page" : undefined}
      {...props}
    >
      {children}
    </li>
  )
}

// Breadcrumb separator
export function BreadcrumbSeparator() {
  return (
    <ChevronRight className="size-3 text-muted-foreground/50" />
  )
}

// Breadcrumb link
export interface BreadcrumbLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  asChild?: boolean
  isCurrent?: boolean
}

export function BreadcrumbLink({ 
  className, 
  href, 
  children,
  isCurrent,
  ...props 
}: BreadcrumbLinkProps) {
  const classes = cn(
    "hover:text-foreground transition-colors flex items-center",
    isCurrent && "font-medium text-foreground",
    className
  )

  if (!href || isCurrent) {
    return (
      <span className={classes} {...props}>
        {children}
      </span>
    )
  }

  return (
    <Link href={href} className={classes} {...props}>
      {children}
    </Link>
  )
} 