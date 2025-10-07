// app/patients/[id]/page.tsx
"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import {
    ArrowLeft,
    AlertTriangle,
    Calendar,
    FileText,
    CheckCircle,
    Clock,
    Edit,
    Download,
    User,
    Activity,
    Shield,
    Users
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { LayoutWrapper } from '@/components/layout/layout-wrapper';

interface Patient {
    id: string;
    name: string;
    claimNo: string;
    doi: string;
    workStatus: 'TTD' | 'MODIFIED' | 'REGULAR';
    workStatusUpdatedAt: string;
    accepted: string[];
    denied: string[];
    restrictions: string;
}

interface Document {
    id: string;
    title: string;
    type: string;
    date: string;
    summary: string;
    actions: string[];
}

const PatientDetail = ({ params }: { params: { id: string } }) => {
    const [activeTab, setActiveTab] = useState('overview');

    // Mock patient data
    const patient: Patient = {
        id: params.id,
        name: 'John Smith',
        claimNo: 'Claim # 1234',
        doi: '01/15/2023',
        workStatus: 'TTD',
        workStatusUpdatedAt: '07/15',
        accepted: ['Left Shoulder'],
        denied: ['Lumbar'],
        restrictions: 'Orthopedic, Physical Therapy'
    };

    const documents: Document[] = [
        {
            id: '1',
            title: 'Attorney Letter',
            type: 'ATTORNEY',
            date: '08/14',
            summary: 'Requests work status + MRI copy',
            actions: ['Open PDF', 'Draft Psych RFA', 'Mark Done']
        },
        {
            id: '2',
            title: 'QME Report',
            type: 'QME',
            date: '08/14',
            summary: '70% industrial, a Psych referral',
            actions: ['Open PDF', 'Draft RFA']
        }
    ];

    const calculateDaysOverdue = (lastUpdate: string) => {
        // Simple calculation - in real app use proper date library
        return 45; // Mock 45 days
    };

    const daysOverdue = calculateDaysOverdue(patient.workStatusUpdatedAt);

    return (
      <LayoutWrapper>
        <div className="min-h-screen bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="space-y-8">
              {/* Header */}
              <div className="flex items-center gap-6 pb-8 border-b border-gray-200">
                <Link href="/dashboard">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Dashboard
                  </Button>
                </Link>
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-gray-700" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                      {patient.name}
                    </h1>
                    <p className="text-gray-600 font-medium">
                      {patient.claimNo} • DOI: {patient.doi}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Panel - Patient Info */}
                <div className="space-y-6">
                  <Card className="border border-gray-200 shadow-sm">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <Activity className="h-5 w-5 text-gray-700" />
                        Patient Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div>
                        <h3 className="font-semibold mb-3 text-gray-900">
                          Work Status
                        </h3>
                        <div
                          className={`p-4 rounded-lg border-l-4 ${
                            daysOverdue > 30
                              ? "bg-amber-50 border-l-amber-400 border border-amber-200"
                              : "bg-green-50 border-l-green-400 border border-green-200"
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            {daysOverdue > 30 && (
                              <AlertTriangle className="w-4 h-4 text-amber-600" />
                            )}
                            <span className="font-semibold text-gray-900">
                              {patient.workStatus}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">
                            Last updated {patient.workStatusUpdatedAt} (
                            {daysOverdue} days ago)
                          </p>
                          <Button
                            size="sm"
                            className="w-full bg-gray-900 hover:bg-gray-800 text-white font-medium"
                          >
                            Update Work Status
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-semibold text-emerald-700 mb-3 flex items-center gap-1">
                            <CheckCircle className="h-4 w-4" />
                            Accepted
                          </h4>
                          <div className="space-y-2">
                            {patient.accepted.map((part) => (
                              <Badge
                                key={part}
                                variant="outline"
                                className="bg-emerald-50 text-emerald-700 border-emerald-200 font-medium"
                              >
                                {part}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h4 className="font-semibold text-red-700 mb-3 flex items-center gap-1">
                            <Shield className="h-4 w-4" />
                            Denied
                          </h4>
                          <div className="space-y-2">
                            {patient.denied.map((part) => (
                              <Badge
                                key={part}
                                variant="outline"
                                className="bg-red-50 text-red-700 border-red-200 font-medium"
                              >
                                {part}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-gray-200">
                        <h4 className="font-semibold mb-2 text-gray-900">
                          Restrictions
                        </h4>
                        <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                          {patient.restrictions}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border border-gray-200 shadow-sm">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <Users className="h-5 w-5 text-gray-700" />
                        Recent Patients
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <Button
                          variant="ghost"
                          className="w-full justify-start text-gray-700 hover:text-gray-900 hover:bg-gray-50 font-medium"
                        >
                          John Smith
                        </Button>
                        <Button
                          variant="ghost"
                          className="w-full justify-start text-gray-700 hover:text-gray-900 hover:bg-gray-50 font-medium"
                        >
                          Maria Lopez
                        </Button>
                        <Button
                          variant="ghost"
                          className="w-full justify-start text-gray-700 hover:text-gray-900 hover:bg-gray-50 font-medium"
                        >
                          Jose Ramirez
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Center Panel - Tabs */}
                <div className="lg:col-span-2">
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-3 bg-gray-50 border border-gray-200">
                      <TabsTrigger
                        value="overview"
                        className="font-medium data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:border-gray-200"
                      >
                        Overview
                      </TabsTrigger>
                      <TabsTrigger
                        value="new-checkin"
                        className="font-medium data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:border-gray-200"
                      >
                        New Since Check-in
                      </TabsTrigger>
                      <TabsTrigger
                        value="tasks"
                        className="font-medium data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:border-gray-200"
                      >
                        Tasks
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-6 mt-8">
                      <Card className="border border-gray-200 shadow-sm">
                        <CardHeader className="pb-4">
                          <CardTitle className="font-semibold text-gray-900">
                            Changes Since Last Visit
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span className="text-sm font-medium text-gray-900">
                              Restriction: 20 lbs → 10 lbs
                            </span>
                          </div>
                          <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                            <Clock className="w-4 h-4 text-orange-500" />
                            <span className="text-sm font-medium text-gray-900">
                              MRI lumbar ordered (pending)
                            </span>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border border-gray-200 shadow-sm">
                        <CardHeader className="pb-4">
                          <CardTitle className="font-semibold text-gray-900">
                            Compliance Nudges
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between p-4 bg-amber-50 rounded-lg border border-amber-200">
                            <div className="flex items-center gap-3">
                              <AlertTriangle className="w-5 h-5 text-amber-600" />
                              <span className="font-medium text-gray-900">
                                ADLs not updated
                              </span>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-amber-300 text-amber-700 hover:bg-amber-100 font-medium"
                            >
                              Update now
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="new-checkin" className="space-y-6 mt-8">
                      {documents.map((doc) => (
                        <Card
                          key={doc.id}
                          className="border border-gray-200 shadow-sm"
                        >
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-4">
                              <div>
                                <h3 className="font-semibold text-gray-900 mb-1">
                                  {doc.title}{" "}
                                  <span className="text-gray-600 font-normal">
                                    {doc.date}
                                  </span>
                                </h3>
                                <p className="text-sm text-gray-600 mt-1">
                                  {doc.summary}
                                </p>
                              </div>
                              <Badge
                                variant="outline"
                                className={`font-medium ${
                                  doc.type === "ATTORNEY"
                                    ? "bg-purple-50 text-purple-700 border-purple-200"
                                    : "bg-blue-50 text-blue-700 border-blue-200"
                                }`}
                              >
                                {doc.type}
                              </Badge>
                            </div>
                            <div className="flex gap-2 flex-wrap">
                              {doc.actions.map((action) => (
                                <Button
                                  key={action}
                                  size="sm"
                                  variant="outline"
                                  className="border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900 font-medium"
                                >
                                  {action}
                                </Button>
                              ))}
                            </div>

                            {doc.type === "QME" && (
                              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                <span className="font-semibold text-blue-900">
                                  Psych RFA
                                </span>
                                <span className="text-blue-700">
                                  {" "}
                                  → Maria (Due +3d)
                                </span>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </TabsContent>

                    <TabsContent value="tasks" className="mt-8">
                      <Card className="border border-gray-200 shadow-sm">
                        <CardHeader className="pb-4">
                          <CardTitle className="font-semibold text-gray-900">
                            Active Tasks
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                              <div>
                                <p className="font-semibold text-gray-900">
                                  Review work status update
                                </p>
                                <p className="text-sm text-gray-600 mt-1">
                                  Due: Today
                                </p>
                              </div>
                              <Badge className="bg-red-100 text-red-700 border-red-200 font-medium">
                                High
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                              <div>
                                <p className="font-semibold text-gray-900">
                                  Schedule MRI follow-up
                                </p>
                                <p className="text-sm text-gray-600 mt-1">
                                  Due: Tomorrow
                                </p>
                              </div>
                              <Badge
                                variant="outline"
                                className="border-orange-200 text-orange-700 bg-orange-50 font-medium"
                              >
                                Medium
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            </div>
          </div>
        </div>
      </LayoutWrapper>
    );
};

export default PatientDetail;