// app/documents/page.tsx
"use client";

import React, { useState } from 'react';
import {
    Search,
    Upload,
    FileText,
    Filter,
    Eye,
    Download,
    Edit,
    CheckCircle,
    AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Document {
    id: string;
    title: string;
    type: 'QME' | 'ATTORNEY' | 'UR' | 'IMAGING' | 'SPECIALTY' | 'OTHER';
    patientName: string;
    receivedAt: string;
    summary: string;
    confidence: number;
    processed: boolean;
}

const DocumentsPage = () => {
    const [filterType, setFilterType] = useState('ALL');
    const [searchTerm, setSearchTerm] = useState('');

    const documents: Document[] = [
        {
            id: '1',
            title: 'QME Orthopedic Evaluation',
            type: 'QME',
            patientName: 'John Smith',
            receivedAt: '2024-09-20',
            summary: '70% industrial apportionment. Recommends psychological referral due to functional overlay and ongoing pain behaviors.',
            confidence: 0.92,
            processed: true
        },
        {
            id: '2',
            title: 'Attorney Request Letter',
            type: 'ATTORNEY',
            patientName: 'Emily White',
            receivedAt: '2024-09-19',
            summary: 'Requesting current work status documentation and copies of recent MRI reports for case preparation.',
            confidence: 0.87,
            processed: true
        },
        {
            id: '3',
            title: 'UR Denial Notice',
            type: 'UR',
            patientName: 'Michael Brown',
            receivedAt: '2024-09-18',
            summary: 'Physical therapy denied as not medically necessary. Patient has not completed conservative care measures.',
            confidence: 0.94,
            processed: true
        },
        {
            id: '4',
            title: 'Lumbar MRI Report',
            type: 'IMAGING',
            patientName: 'Sarah Davis',
            receivedAt: '2024-09-17',
            summary: 'Mild disc bulge at L4-L5 without nerve root compression. No surgical intervention indicated at this time.',
            confidence: 0.78,
            processed: true
        }
    ];

    const getDocumentTypeColor = (type: string) => {
        switch (type) {
            case 'QME': return 'bg-blue-50 text-blue-700 border-blue-200';
            case 'ATTORNEY': return 'bg-green-50 text-green-700 border-green-200';
            case 'UR': return 'bg-amber-50 text-amber-700 border-amber-200';
            case 'IMAGING': return 'bg-purple-50 text-purple-700 border-purple-200';
            case 'SPECIALTY': return 'bg-gray-50 text-gray-700 border-gray-200';
            default: return 'bg-gray-50 text-gray-700 border-gray-200';
        }
    };

    const filteredDocuments = documents.filter(doc => {
        if (filterType !== 'ALL' && doc.type !== filterType) return false;
        if (searchTerm && !doc.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
            !doc.patientName.toLowerCase().includes(searchTerm.toLowerCase())) return false;
        return true;
    });

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 px-8 py-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-semibold text-gray-900">Documents</h1>
                        <p className="text-gray-600 mt-1">Manage and process your document library</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <Input
                                placeholder="Search documents..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-11 w-80 h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                            />
                        </div>
                        <Select value={filterType} onValueChange={setFilterType}>
                            <SelectTrigger className="w-48 h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500">
                                <Filter className="w-4 h-4 mr-2" />
                                <SelectValue placeholder="Document Type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">All Types</SelectItem>
                                <SelectItem value="QME">QME Reports</SelectItem>
                                <SelectItem value="ATTORNEY">Attorney Letters</SelectItem>
                                <SelectItem value="UR">UR Denials</SelectItem>
                                <SelectItem value="IMAGING">Imaging</SelectItem>
                                <SelectItem value="SPECIALTY">Specialty Consults</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white font-medium h-11 px-6">
                            <Upload className="w-4 h-4 mr-2" />
                            Upload Document
                        </Button>
                    </div>
                </div>
            </header>

            <div className="p-8">
                <div className="space-y-6">
                    {filteredDocuments.map(document => (
                        <Card key={document.id} className="shadow-sm border-0 bg-white hover:shadow-md transition-all duration-200">
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between mb-6">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-4 mb-3">
                                            <h3 className="text-xl font-semibold text-gray-900">{document.title}</h3>
                                            <Badge
                                                variant="outline"
                                                className={`font-medium ${getDocumentTypeColor(document.type)}`}
                                            >
                                                {document.type}
                                            </Badge>
                                            <span className="text-sm text-gray-500 font-medium">
                                                {new Date(document.receivedAt).toLocaleDateString()}
                                            </span>
                                        </div>

                                        <p className="text-sm text-gray-600 mb-4">
                                            Patient: <span className="font-semibold text-gray-900">{document.patientName}</span>
                                        </p>

                                        <p className="text-gray-700 mb-6 leading-relaxed text-sm">
                                            {document.summary}
                                        </p>

                                        {/* AI Confidence Score */}
                                        <div className="flex items-center gap-4 mb-6">
                                            <span className="text-sm font-medium text-gray-600">AI Confidence:</span>
                                            <div className="flex items-center gap-3">
                                                <Progress
                                                    value={document.confidence * 100}
                                                    className="w-32 h-2"
                                                />
                                                <span className="text-sm font-semibold text-gray-900">
                                                    {Math.round(document.confidence * 100)}%
                                                </span>
                                            </div>
                                            {document.confidence < 0.8 && (
                                                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                                                    <AlertCircle className="w-3 h-3 mr-1" />
                                                    Needs Review
                                                </Badge>
                                            )}
                                            {document.processed && (
                                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                                    <CheckCircle className="w-3 h-3 mr-1" />
                                                    Processed
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex gap-3 flex-wrap">
                                        <Button size="sm" variant="outline" className="border-gray-200 hover:bg-gray-50 hover:border-gray-300">
                                            <FileText className="w-4 h-4 mr-2" />
                                            Open PDF
                                        </Button>
                                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                                            <Edit className="w-4 h-4 mr-2" />
                                            Draft RFA
                                        </Button>
                                        <Button size="sm" variant="outline" className="border-gray-200 hover:bg-gray-50 hover:border-gray-300">
                                            <Upload className="w-4 h-4 mr-2" />
                                            Future Med
                                        </Button>
                                        <Button size="sm" variant="ghost" className="hover:bg-green-50 hover:text-green-700">
                                            <CheckCircle className="w-4 h-4 mr-2" />
                                            Mark Done
                                        </Button>
                                    </div>

                                    {document.confidence < 0.8 && (
                                        <Button size="sm" variant="outline" className="border-amber-200 hover:bg-amber-50 hover:border-amber-300 text-amber-700">
                                            <Edit className="w-4 h-4 mr-2" />
                                            Re-classify
                                        </Button>
                                    )}
                                </div>

                                {/* Auto-generated Tasks */}
                                {document.type === 'QME' && (
                                    <div className="pt-6 border-t border-gray-100">
                                        <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
                                            <CheckCircle className="w-4 h-4 mr-2 text-blue-600" />
                                            Auto-generated Tasks
                                        </h4>
                                        <div className="space-y-3">
                                            <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="font-semibold text-blue-900 text-sm">Draft Psychological RFA</span>
                                                    <Badge variant="outline" className="text-xs bg-white text-blue-700 border-blue-300">
                                                        Assigned to: Dr. Smith
                                                    </Badge>
                                                </div>
                                                <p className="text-blue-700 text-sm">Due: {new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {document.type === 'UR' && (
                                    <div className="pt-6 border-t border-gray-100">
                                        <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
                                            <CheckCircle className="w-4 h-4 mr-2 text-amber-600" />
                                            Auto-generated Tasks
                                        </h4>
                                        <div className="space-y-3">
                                            <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="font-semibold text-amber-900 text-sm">Draft Rebuttal Letter</span>
                                                    <Badge variant="outline" className="text-xs bg-white text-amber-700 border-amber-300">
                                                        Assigned to: Dr. Johnson
                                                    </Badge>
                                                </div>
                                                <p className="text-amber-700 text-sm">Due: {new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {filteredDocuments.length === 0 && (
                    <Card className="shadow-sm border-0 bg-white">
                        <CardContent className="p-16 text-center">
                            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <FileText className="w-10 h-10 text-gray-400" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-3">No documents found</h3>
                            <p className="text-gray-600 mb-8 max-w-md mx-auto">
                                {searchTerm || filterType !== 'ALL'
                                    ? 'Try adjusting your search criteria or filters to find the documents you\'re looking for.'
                                    : 'Upload documents to get started with automated processing and AI-powered analysis.'}
                            </p>
                            <Button className="bg-blue-600 hover:bg-blue-700 text-white font-medium h-11 px-6">
                                <Upload className="w-4 h-4 mr-2" />
                                Upload First Document
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
};

export default DocumentsPage;