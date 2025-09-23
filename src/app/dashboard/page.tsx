// app/dashboard/page.tsx
"use client";

import React, { useState } from 'react';
import {
    Search,
    AlertTriangle,
    Clock,
    ChevronRight,
    FileText,
    User,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface Patient {
    id: string;
    name: string;
    claimId: string;
    claimNumber: string;
}

interface WorkStatusAlert {
    id: string;
    patientName: string;
    status: 'TTD' | 'MODIFIED' | 'REGULAR';
    daysOverdue: number;
    lastUpdate: string;
    severity: 'warning' | 'alert' | 'critical';
}

interface QueueTask {
    id: string;
    title: string;
    description: string;
    count?: number;
    priority: 'low' | 'medium' | 'high';
}

interface DocumentAlert {
    id: string;
    type: string;
    patientName: string;
    daysOld: number;
    urgent: boolean;
}

const Dashboard = () => {
    const [searchTerm, setSearchTerm] = useState('');

    // Mock data
    const recentPatients: Patient[] = [
        { id: '1', name: 'John Smith', claimId: 'C1234', claimNumber: '05208' },
        { id: '2', name: 'Emily White', claimId: 'C5678', claimNumber: '07108' },
        { id: '3', name: 'Michael Brown', claimId: 'C9101', claimNumber: 'John Smith' }
    ];

    const workStatusAlerts: WorkStatusAlert[] = [
        {
            id: '1',
            patientName: 'John Smith',
            status: 'TTD',
            daysOverdue: 45,
            lastUpdate: '07/15',
            severity: 'alert'
        },
        {
            id: '2',
            patientName: 'Emily White',
            status: 'MODIFIED',
            daysOverdue: 50,
            lastUpdate: '07/01',
            severity: 'alert'
        },
        {
            id: '3',
            patientName: 'Michael Brown',
            status: 'REGULAR',
            daysOverdue: 100,
            lastUpdate: '06/01',
            severity: 'critical'
        }
    ];

    const myQueueTasks: QueueTask[] = [
        { id: '1', title: 'Review Dr. Lee\'s Notes', description: 'Consult Report - (2 122)', priority: 'high' },
        { id: '2', title: 'Draft Rebuttal - C1134', description: 'Paralegal Team', priority: 'medium' },
        { id: '3', title: 'Schedule Jane Doe', description: 'Dr Lee: 15 tasks, Paralegal Team: Admin 10', priority: 'low' }
    ];

    const documentAlerts: DocumentAlert[] = [
        { id: '1', type: 'Surgery Notes', patientName: 'John Smith', daysOld: 2, urgent: false },
        { id: '2', type: 'Consult Report', patientName: 'Emily White', daysOld: 3, urgent: true }
    ];

    const rfaStats = {
        submitted: { count: 10, progress: 45 },
        denied: { count: 25, total: 30 }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="flex">
                {/* Main Content */}
                <main className="flex-1 p-8">
                    {/* Page Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-semibold text-gray-900 mb-2">Dashboard</h1>
                        <p className="text-gray-600">Welcome back. Here's what's happening today.</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                        {/* Active Patient Card */}
                        <Card className="shadow-sm border-0 bg-white">
                            <CardHeader className="pb-4 border-b border-gray-100">
                                <div className="flex items-center gap-2">
                                    <User className="w-5 h-5 text-blue-600" />
                                    <CardTitle className="text-xl font-semibold text-gray-900">Active Patient</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-5">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <Input
                                        placeholder="Search for a patient..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-11 h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                                    />
                                </div>

                                <div className="space-y-3">
                                    {recentPatients.map((patient) => (
                                        <div
                                            key={patient.id}
                                            className="flex items-center justify-between p-4 rounded-lg border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-all duration-200"
                                        >
                                            <div>
                                                <p className="font-semibold text-gray-900 text-sm">
                                                    {patient.name} <span className="text-gray-500 font-normal">— {patient.claimId}</span>
                                                </p>
                                                <p className="text-sm text-gray-500 mt-1">Claim {patient.claimNumber}</p>
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="border-gray-200 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors"
                                            >
                                                Open
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Work Status Alerts */}
                        <Card className="lg:row-span-2 shadow-sm border-0 bg-white">
                            <CardHeader className="pb-4 border-b border-gray-100">
                                <div className="flex items-center gap-2">
                                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                                    <CardTitle className="text-xl font-semibold text-gray-900">Work Status Alerts</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-4">
                                {workStatusAlerts.map((alert) => (
                                    <div
                                        key={alert.id}
                                        className={`p-4 rounded-xl border-l-4 transition-all duration-200 hover:shadow-sm ${alert.severity === 'critical'
                                            ? 'bg-red-50 border-l-red-500 hover:bg-red-100'
                                            : alert.severity === 'alert'
                                                ? 'bg-amber-50 border-l-amber-500 hover:bg-amber-100'
                                                : 'bg-yellow-50 border-l-yellow-500 hover:bg-yellow-100'
                                            }`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <AlertTriangle className={`w-4 h-4 ${alert.severity === 'critical' ? 'text-red-600' : 'text-amber-600'
                                                        }`} />
                                                    <p className="font-semibold text-sm text-gray-900">
                                                        {alert.patientName} — {alert.status}
                                                    </p>
                                                    <Badge variant="outline" className={`text-xs font-medium ${alert.severity === 'critical' ? 'border-red-300 text-red-700' : 'border-amber-300 text-amber-700'
                                                        }`}>
                                                        {alert.daysOverdue} days
                                                    </Badge>
                                                </div>
                                                <p className="text-xs text-gray-600 ml-7">
                                                    Last updated {alert.lastUpdate}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <Button
                                    className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-medium h-11"
                                    size="sm"
                                >
                                    Open Task
                                </Button>
                            </CardContent>
                        </Card>

                        {/* New Documents */}
                        <Card className="shadow-sm border-0 bg-white">
                            <CardHeader className="pb-4 border-b border-gray-100">
                                <div className="flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-green-600" />
                                    <div>
                                        <CardTitle className="text-xl font-semibold text-gray-900">New Documents</CardTitle>
                                        <p className="text-sm text-gray-500 mt-1">Aging Alerts</p>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-4">
                                {documentAlerts.map((doc) => (
                                    <div
                                        key={doc.id}
                                        className="flex items-center gap-4 p-4 rounded-lg border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-all duration-200"
                                    >
                                        <div className={`w-3 h-3 rounded-full ${doc.urgent ? 'bg-red-500' : 'bg-amber-500'}`} />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-sm text-gray-900 truncate">
                                                {doc.type}
                                            </p>
                                            <p className="text-sm text-gray-500 mt-1">
                                                {doc.patientName} • {doc.daysOld} days old
                                            </p>
                                        </div>
                                        {doc.urgent && (
                                            <Badge variant="destructive" className="text-xs font-medium bg-red-100 text-red-700 border-red-200">
                                                Urgent
                                            </Badge>
                                        )}
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        {/* Deadline Alerts */}
                        <Card className="lg:col-span-2 shadow-sm border-0 bg-white">
                            <CardHeader className="pb-4 border-b border-gray-100">
                                <div className="flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-red-600" />
                                    <CardTitle className="text-xl font-semibold text-gray-900">Deadline Alerts</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-4 p-4 bg-red-50 rounded-xl border border-red-200 hover:bg-red-100 transition-colors cursor-pointer group">
                                    <Clock className="w-6 h-6 text-red-600" />
                                    <div className="flex-1">
                                        <p className="font-semibold text-red-900 text-sm">Urgent Rebuttal - Emily</p>
                                        <p className="text-red-700 text-xs mt-1">Due Today</p>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-red-600 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Dashboard;