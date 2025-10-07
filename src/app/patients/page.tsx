"use client";

import React, { useState } from "react";
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
import { LayoutWrapper } from "@/components/layout/layout-wrapper";

interface Patient {
  id: string;
  name: string;
  claimNo: string;
  doi: string;
  workStatus: "TTD" | "MODIFIED" | "REGULAR";
  workStatusUpdatedAt: string;
  lastActivity: string;
  priority: "low" | "medium" | "high";
  overdueDays?: number;
}

const PatientsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  // Mock patient data
  const patients: Patient[] = [
    {
      id: "1",
      name: "John Smith",
      claimNo: "C1234",
      doi: "01/15/2023",
      workStatus: "TTD",
      workStatusUpdatedAt: "07/15/2024",
      lastActivity: "2 days ago",
      priority: "high",
      overdueDays: 45,
    },
    {
      id: "2",
      name: "Emily White",
      claimNo: "C5678",
      doi: "03/22/2023",
      workStatus: "MODIFIED",
      workStatusUpdatedAt: "08/01/2024",
      lastActivity: "5 days ago",
      priority: "medium",
      overdueDays: 20,
    },
    {
      id: "3",
      name: "Michael Brown",
      claimNo: "C9101",
      doi: "05/10/2023",
      workStatus: "REGULAR",
      workStatusUpdatedAt: "09/10/2024",
      lastActivity: "1 week ago",
      priority: "low",
    },
    {
      id: "4",
      name: "Sarah Johnson",
      claimNo: "C1122",
      doi: "02/28/2023",
      workStatus: "TTD",
      workStatusUpdatedAt: "06/15/2024",
      lastActivity: "3 days ago",
      priority: "high",
      overdueDays: 60,
    },
    {
      id: "5",
      name: "David Wilson",
      claimNo: "C3344",
      doi: "04/05/2023",
      workStatus: "MODIFIED",
      workStatusUpdatedAt: "08/20/2024",
      lastActivity: "1 day ago",
      priority: "medium",
    },
  ];

  const getStatusBadge = (
    status: Patient["workStatus"],
    overdueDays?: number
  ) => {
    const isOverdue = overdueDays && overdueDays > 30;

    switch (status) {
      case "TTD":
        return (
          <Badge
            variant={isOverdue ? "destructive" : "outline"}
            className={`gap-1 font-medium ${
              isOverdue
                ? "bg-red-50 text-red-700 border-red-200"
                : "bg-blue-50 text-blue-700 border-blue-200"
            }`}
          >
            {isOverdue && <AlertTriangle className="w-3 h-3" />}
            TTD {isOverdue && `(${overdueDays}d)`}
          </Badge>
        );
      case "MODIFIED":
        return (
          <Badge
            variant={isOverdue ? "destructive" : "outline"}
            className={`gap-1 font-medium ${
              isOverdue
                ? "bg-red-50 text-red-700 border-red-200"
                : "bg-amber-50 text-amber-700 border-amber-200"
            }`}
          >
            {isOverdue && <AlertTriangle className="w-3 h-3" />}
            Modified {isOverdue && `(${overdueDays}d)`}
          </Badge>
        );
      case "REGULAR":
        return (
          <Badge
            variant="outline"
            className="bg-green-50 text-green-700 border-green-200 font-medium"
          >
            Regular
          </Badge>
        );
    }
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

  const filteredPatients = patients.filter((patient) => {
    const matchesSearch =
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.claimNo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || patient.workStatus === statusFilter;
    const matchesPriority =
      priorityFilter === "all" || patient.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

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
                    placeholder="Search patients by name or claim number..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-11 h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-48 h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="TTD">TTD</SelectItem>
                    <SelectItem value="MODIFIED">Modified</SelectItem>
                    <SelectItem value="REGULAR">Regular</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={priorityFilter}
                  onValueChange={setPriorityFilter}
                >
                  <SelectTrigger className="w-full sm:w-48 h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priority</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="shadow-sm border-0 bg-white">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Total Patients
                    </p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {patients.length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-0 bg-white">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      High Priority
                    </p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {patients.filter((p) => p.priority === "high").length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-0 bg-white">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Overdue</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {
                        patients.filter(
                          (p) => p.overdueDays && p.overdueDays > 30
                        ).length
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-0 bg-white">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Recent Activity
                    </p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {
                        patients.filter((p) => p.lastActivity.includes("day"))
                          .length
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Patients List */}
          <Card className="shadow-sm border-0 bg-white">
            <CardHeader className="pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                <CardTitle className="text-xl font-semibold text-gray-900">
                  Patients ({filteredPatients.length})
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {filteredPatients.map((patient) => (
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
                      {getStatusBadge(patient.workStatus, patient.overdueDays)}

                      <div className="flex items-center gap-2">
                        <Link href={`/patients/${patient.id}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2 border-gray-200 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700"
                          >
                            <Eye className="w-4 h-4" />
                            View
                          </Button>
                        </Link>

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
                ))}

                {filteredPatients.length === 0 && (
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
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </LayoutWrapper>
  );
};

export default PatientsPage;
