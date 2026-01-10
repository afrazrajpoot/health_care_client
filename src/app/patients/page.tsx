"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  Search,
  Filter,
  Users,
  Calendar,
  Clock,
  AlertTriangle,
  Eye,
  Edit,
  MoreHorizontal,
  Plus,
  Check,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { LayoutWrapper } from "@/components/layout/layout-wrapper";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

function useDebounce(value: string, delay: number): string {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

interface Patient {
  id: string;
  name: string;
  claimNo: string;
  doi: string;
  workStatus: string;
  workStatusUpdatedAt: string;
  lastActivity: string;
  priority: "low" | "medium" | "high";
  overdueDays?: number;
}

const PatientsPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("search") ?? ""
  );
  const [copied, setCopied] = useState(false);

  const handleCopy = (textToCopy) => {
    navigator.clipboard
      .writeText(textToCopy)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000); // hide tick after 2s
      })
      .catch((err) => console.error("Copy failed:", err));
  };
  const { data: session } = useSession();
  const [statusFilter, setStatusFilter] = useState(
    searchParams.get("status") ?? "all"
  );
  const [priorityFilter, setPriorityFilter] = useState(
    searchParams.get("priority") ?? "all"
  );
  const [patients, setPatients] = useState<Patient[]>([]);

  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const physicianId = session?.user?.physicianId;

  const pageSize = 10;
  const page = parseInt(searchParams.get("page") ?? "1", 10);

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const createQueryString = useCallback(
    (changes: Record<string, string | number>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(changes).forEach(([key, value]) => {
        if (value === undefined || value === "") {
          params.delete(key);
        } else {
          params.set(key, value.toString());
        }
      });
      return params.toString();
    },
    [searchParams]
  );

  useEffect(() => {
    setSearchTerm(searchParams.get("search") ?? "");
    setStatusFilter(searchParams.get("status") ?? "all");
    setPriorityFilter(searchParams.get("priority") ?? "all");
  }, [searchParams]);

  // Update URL when debounced search term changes
  useEffect(() => {
    if (debouncedSearchTerm !== searchParams.get("search")) {
      router.replace(
        `?${createQueryString({ search: debouncedSearchTerm, page: 1 })}`,
        {
          scroll: false,
        }
      );
    }
  }, [debouncedSearchTerm, createQueryString, router, searchParams]);

  useEffect(() => {
    const fetchPatients = async () => {
      if (!physicianId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const params = new URLSearchParams({
          physicianId,
          page: page.toString(),
          limit: pageSize.toString(),
          ...(debouncedSearchTerm && { search: debouncedSearchTerm }),
          ...(statusFilter !== "all" && { status: statusFilter }),
          ...(priorityFilter !== "all" && { priority: priorityFilter }),
        });

        const response = await fetch(`/api/get-patient?${params}`);
        if (!response.ok) {
          throw new Error("Failed to fetch patients");
        }
        const result = await response.json();
        const now = new Date();
        const mapped = result.data.map((doc: any) => {
          const updated = new Date(doc.updatedAt);
          const daysDiff = Math.floor(
            (now.getTime() - updated.getTime()) / (1000 * 60 * 60 * 24)
          );
          let lastActivity = daysDiff === 0 ? "today" : `${daysDiff} days ago`;
          if (daysDiff >= 7) lastActivity = "1 week ago";
          let overdueDays: number | undefined = undefined;
          let priority: Patient["priority"] = "low";
          if (doc.status === "Urgent") {
            overdueDays = daysDiff;
            if (daysDiff > 45) priority = "high";
            else if (daysDiff > 20) priority = "medium";
          }
          const doiDate = new Date(doc.doi);
          const doiFormatted = `${(doiDate.getMonth() + 1)
            .toString()
            .padStart(2, "0")}/${doiDate
            .getDate()
            .toString()
            .padStart(2, "0")}/${doiDate.getFullYear()}`;
          return {
            id: doc.id,
            name: doc.patientName,
            claimNo: doc.claimNumber,
            doi: doiFormatted,
            workStatus: doc.status,
            workStatusUpdatedAt: doc.updatedAt,
            lastActivity,
            priority,
            overdueDays,
            adlLink: doc.patientQuizPage,
          };
        });
        setPatients(mapped);
        setTotal(result.total);
      } catch (error) {
        console.error("Error fetching patients:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, [physicianId, page, debouncedSearchTerm, statusFilter, priorityFilter]);

  const getStatusBadge = (status: string, overdueDays?: number) => {
    let variant = "outline";
    let className = "bg-gray-50 text-gray-700 border-gray-200 font-medium";
    let icon = null;
    let text = status.charAt(0).toUpperCase() + status.slice(1);

    if (status === "Urgent") {
      className = "bg-red-50 text-red-700 border-red-200";
      variant = "destructive";
      icon = <AlertTriangle className="w-3 h-3" />;
    } else if (status === "normal") {
      className = "bg-green-50 text-green-700 border-green-200";
      text = "Normal";
    }

    const isOverdue = overdueDays && overdueDays > 30;
    if (isOverdue) {
      className = "bg-red-50 text-red-700 border-red-200";
      variant = "destructive";
      if (!icon) icon = <AlertTriangle className="w-3 h-3" />;
      text += ` (${overdueDays}d)`;
    }

    return (
      <Badge variant={variant} className={`gap-1 font-medium ${className}`}>
        {icon}
        {text}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: Patient["priority"]) => {
    switch (priority) {
      case "high":
        return (
          <Badge
            variant="outline"
            className="bg-red-50 text-red-700 border-red-200 font-medium"
          >
            High
          </Badge>
        );
      case "medium":
        return (
          <Badge
            variant="outline"
            className="bg-amber-50 text-amber-700 border-amber-200 font-medium"
          >
            Medium
          </Badge>
        );
      case "low":
        return (
          <Badge
            variant="outline"
            className="bg-gray-50 text-gray-700 border-gray-200 font-medium"
          >
            Low
          </Badge>
        );
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    router.replace(`?${createQueryString({ status: value, page: 1 })}`, {
      scroll: false,
    });
  };

  const handlePriorityChange = (value: string) => {
    setPriorityFilter(value);
    router.replace(`?${createQueryString({ priority: value, page: 1 })}`, {
      scroll: false,
    });
  };

  const totalPages = Math.ceil(total / pageSize);

  const renderPagination = () => {
    const items: React.ReactNode[] = [];

    // Previous
    items.push(
      <PaginationItem key="previous">
        <PaginationPrevious
          asChild
          className={page === 1 ? "pointer-events-none opacity-50" : ""}
        >
          <Link
            href={page > 1 ? `?${createQueryString({ page: page - 1 })}` : "#"}
          >
            Previous
          </Link>
        </PaginationPrevious>
      </PaginationItem>
    );

    // Page numbers with ellipsis
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink asChild isActive={i === page}>
              <Link href={`?${createQueryString({ page: i })}`}>{i}</Link>
            </PaginationLink>
          </PaginationItem>
        );
      }
    } else {
      // First page
      items.push(
        <PaginationItem key={1}>
          <PaginationLink asChild>
            <Link href={`?${createQueryString({ page: 1 })}`}>1</Link>
          </PaginationLink>
        </PaginationItem>
      );
      if (page > 3) {
        items.push(
          <PaginationItem key="ellipsis1">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }
      // Current pages
      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);
      for (let i = start; i <= end; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink asChild isActive={i === page}>
              <Link href={`?${createQueryString({ page: i })}`}>{i}</Link>
            </PaginationLink>
          </PaginationItem>
        );
      }
      if (page < totalPages - 2) {
        items.push(
          <PaginationItem key="ellipsis2">
            <PaginationEllipsis />
          </PaginationItem>
        );
        // Last page
        items.push(
          <PaginationItem key={totalPages}>
            <PaginationLink asChild>
              <Link href={`?${createQueryString({ page: totalPages })}`}>
                {totalPages}
              </Link>
            </PaginationLink>
          </PaginationItem>
        );
      }
    }

    // Next
    items.push(
      <PaginationItem key="next">
        <PaginationNext
          asChild
          className={
            page === totalPages ? "pointer-events-none opacity-50" : ""
          }
        >
          <Link
            href={
              page < totalPages
                ? `?${createQueryString({ page: page + 1 })}`
                : "#"
            }
          >
            Next
          </Link>
        </PaginationNext>
      </PaginationItem>
    );

    return (
      <Pagination>
        <PaginationContent>{items}</PaginationContent>
      </Pagination>
    );
  };

  return (
    <LayoutWrapper>
      <div className="min-h-screen bg-gray-50">
        <div className="p-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8">
            <div>
              <h1 className="text-3xl font-semibold text-gray-900 mb-2">
                Patients
              </h1>
              <p className="text-gray-600">
                Manage patient records and work status updates
              </p>
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white font-medium h-11 px-6 gap-2">
              <Plus className="w-4 h-4" />
              Add Patient
            </Button>
          </div>

          {/* Filters */}
          <Card className="shadow-sm border-0 bg-white mb-8">
            <CardHeader className="pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-gray-600" />
                <CardTitle className="text-xl font-semibold text-gray-900">
                  Search & Filter
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    placeholder="Search patients by name..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="pl-11 h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Patients List */}
          <Card className="shadow-sm border-0 bg-white">
            <CardHeader className="pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                <CardTitle className="text-xl font-semibold text-gray-900">
                  Patients ({total})
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {loading ? (
                  Array.from({ length: pageSize }).map((_, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-5 border border-gray-100 rounded-xl animate-pulse"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="h-6 w-20 bg-gray-200 rounded"></div>
                        <div className="flex gap-2">
                          <div className="w-20 h-8 bg-gray-200 rounded"></div>
                          <div className="w-8 h-8 bg-gray-200 rounded"></div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : patients.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Users className="w-10 h-10 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      No patients found
                    </h3>
                    <p className="text-gray-600">
                      Try adjusting your search criteria or filters to find the
                      patients you're looking for.
                    </p>
                  </div>
                ) : (
                  patients.map((patient) => (
                    <div
                      key={patient.id}
                      className="flex items-center justify-between p-5 border border-gray-100 rounded-xl hover:bg-gray-50 hover:border-gray-200 transition-all duration-200"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <Avatar className="w-12 h-12">
                          <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold">
                            {patient.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-gray-900">
                              {patient.name}
                            </h3>
                            {getPriorityBadge(patient.priority)}
                          </div>
                          <p className="text-sm text-gray-600 font-medium mb-1">
                            {patient.claimNo} • DOI: {patient.doi}
                          </p>
                          <p className="text-xs text-gray-500">
                            Last activity: {patient.lastActivity}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        {getStatusBadge(
                          patient.workStatus,
                          patient.overdueDays
                        )}

                        <div className="flex items-center gap-2">
                          {/* <Link href={`/patients/${patient.id}`}> */}
                          {/* <Link href={`${patient?.adlLink}`}> */}
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2 border-gray-200 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700"
                            onClick={() => {
                              handleCopy(patient?.adlLink);
                            }}
                          >
                            {copied ? (
                              <Check className="w-4 h-4 text-green-600" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                            ADL Form Link
                          </Button>

                          {copied && (
                            <span className="text-sm text-green-600 transition-opacity duration-300">
                              Copied!
                            </span>
                          )}

                          {/* </Link> */}

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="hover:bg-gray-100"
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem className="gap-2">
                                <Edit className="w-4 h-4" />
                                Edit Patient
                              </DropdownMenuItem>
                              <DropdownMenuItem className="gap-2">
                                <Calendar className="w-4 h-4" />
                                Update Status
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              {!loading && totalPages > 1 && (
                <div className="flex justify-center mt-8">
                  {renderPagination()}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </LayoutWrapper>
  );
};

export default PatientsPage;
