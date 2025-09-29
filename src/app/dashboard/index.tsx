import React, { useState } from 'react';
import {
    ChevronDown,
    ChevronRight,
    FileText,
    UserCheck,
    AlertTriangle,
    Calendar,
    ExternalLink,
    Clock,
    CheckCircle2,
    AlertCircle,
    User,
    Search,
    Bell,
    Settings,
    Menu
} from 'lucide-react';

const PhysicianDashboard = () => {
    const [expandedSummaries, setExpandedSummaries] = useState({});
    const [expandedNewItems, setExpandedNewItems] = useState(false);

    const toggleSummary = (id) => {
        setExpandedSummaries(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const newItems = [
        {
            id: 'mri-shoulder',
            icon: <FileText className="w-4 h-4" />,
            type: 'MRI',
            title: 'MRI Right Shoulder',
            date: '09/12/25',
            hasSummary: true,
            summary: {
                short: ['Partial-thickness supraspinatus tear', 'Mild subacromial bursitis'],
                full: 'MRI imaging reveals a partial-thickness tear of the supraspinatus tendon at the critical zone, approximately 8mm in length. There is mild subacromial bursitis present with minimal fluid collection. No evidence of full-thickness tear or significant retraction. Recommend orthopedic consultation for potential arthroscopic evaluation.'
            }
        },
        {
            id: 'ortho-consult',
            icon: <UserCheck className="w-4 h-4" />,
            type: 'Ortho Consult',
            title: 'Ortho Consult Received',
            date: '09/10/25',
            hasSummary: true,
            summary: {
                short: ['Surgery recommended, pending authorization', 'Advised no overhead lifting'],
                full: 'Orthopedic evaluation confirms partial supraspinatus tear requiring arthroscopic repair. Patient is a good surgical candidate. Recommend arthroscopic subacromial decompression with rotator cuff repair. Work restrictions: no overhead lifting >5lbs, no repetitive shoulder motion until surgical intervention. Authorization request submitted to insurance.'
            }
        },
        {
            id: 'ur-denial',
            icon: <AlertTriangle className="w-4 h-4" />,
            type: 'UR Denial',
            title: 'UR Denial -- PT Extension',
            date: '09/18/25',
            hasSummary: true,
            isAlert: true,
            summary: {
                short: ['PT extension denied', 'Rationale: "No documented functional gains"'],
                full: 'Utilization review denial for additional physical therapy sessions. Reviewer noted lack of objective functional improvement measures in recent PT notes. Request for 6 additional sessions denied. Recommendation: Obtain functional capacity evaluation or consider alternative treatment modalities. Rebuttal deadline: 10 business days from notice date.'
            }
        }
    ];

    const orders = {
        pending: [
            { id: 1, type: 'Ortho Consult', status: 'not yet scheduled', color: 'yellow' },
            { id: 2, type: 'DME Brace', status: 'awaiting approval', color: 'yellow' }
        ],
        completed: [
            { id: 1, type: 'PT (6 sessions)', status: 'completed 09/10/25', color: 'green' },
            { id: 2, type: 'Acupuncture (3/3)', status: 'completed 09/05/25', color: 'green' }
        ]
    };

    const complianceItems = [
        { id: 1, text: 'Rebuttal due in 5 days', urgent: true },
        { id: 2, text: 'Work status expiring in 2 days', urgent: true }
    ];

    return (
        <div className="flex h-screen bg-gray-50">

            {/* Main Content */}
            <div className="flex-1 flex flex-col">
                {/* Header */}
                <header className="bg-white border-b border-gray-200 px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Patient Dashboard</h1>
                            <p className="text-gray-600">Welcome back. Here's what's happening today.</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <Bell className="w-6 h-6 text-gray-600 cursor-pointer hover:text-gray-900" />
                            <Settings className="w-6 h-6 text-gray-600 cursor-pointer hover:text-gray-900" />
                            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                                AD
                            </div>
                        </div>
                    </div>
                </header>

                {/* Content */}
                <main className="flex-1 p-6 overflow-y-auto">
                    <div className="max-w-7xl mx-auto space-y-6">
                        {/* Patient Snapshot Header */}
                        <div className="bg-white rounded-lg border border-gray-200 p-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <h2 className="text-xl font-semibold">John Smith</h2>
                                    <span className="text-gray-500">|</span>
                                    <span className="text-gray-600">DOI: 03/15/2025</span>
                                    <span className="text-gray-500">|</span>
                                    <span className="text-gray-600">Claim #WC2025-0847</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                        <span className="text-sm font-medium text-gray-900">Work Status: Current</span>
                                    </div>
                                    <span className="text-gray-500">|</span>
                                    <span className="text-sm text-gray-600">Last Visit: 09/15/25</span>
                                </div>
                            </div>
                        </div>

                        {/* What's New Since Last Visit */}
                        <div className="bg-white rounded-lg border border-gray-200">
                            <div className="p-6 border-b border-gray-200">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold flex items-center gap-2">
                                        <Bell className="w-5 h-5 text-purple-600" />
                                        What's New Since Last Visit (Alerts Layer)
                                    </h3>
                                    <button
                                        onClick={() => setExpandedNewItems(!expandedNewItems)}
                                        className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
                                    >
                                        {expandedNewItems ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                        {expandedNewItems ? 'Collapse' : 'Expand to view more new items'}
                                    </button>
                                </div>
                            </div>
                            <div className="p-6">
                                <div className="space-y-3">
                                    {newItems.slice(0, expandedNewItems ? newItems.length : 3).map((item) => (
                                        <div key={item.id} className={`flex items-center gap-3 p-3 rounded-lg ${item.isAlert ? 'bg-red-50 border border-red-200' : 'bg-gray-50'}`}>
                                            <div className={`p-2 rounded ${item.isAlert ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                                                {item.icon}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium">{item.type} -- {item.title}</span>
                                                    <span className="text-gray-500">({item.date})</span>
                                                    {item.hasSummary && (
                                                        <span className="text-sm text-blue-600 bg-blue-100 px-2 py-1 rounded">
                                                            → Summary Available
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Report Summaries */}
                        <div className="bg-white rounded-lg border border-gray-200">
                            <div className="p-6 border-b border-gray-200">
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-blue-600" />
                                    Report Summaries (Condensed Findings Layer)
                                </h3>
                            </div>
                            <div className="p-6">
                                <div className="space-y-6">
                                    {newItems.map((item) => (
                                        <div key={item.id} className="border-l-4 border-blue-200 pl-4">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        {item.icon}
                                                        <span className="font-semibold">{item.type} {item.title} ({item.date}):</span>
                                                    </div>
                                                    <ul className="space-y-1 mb-3">
                                                        {item.summary.short.map((point, idx) => (
                                                            <li key={idx} className="flex items-start gap-2">
                                                                <span className="text-blue-600 mt-1">•</span>
                                                                <span className="text-gray-700">{point}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                    {expandedSummaries[item.id] && (
                                                        <div className="bg-gray-50 p-4 rounded-lg mb-3">
                                                            <p className="text-gray-700 leading-relaxed">{item.summary.full}</p>
                                                        </div>
                                                    )}
                                                    <div className="flex items-center gap-4">
                                                        <button
                                                            onClick={() => toggleSummary(item.id)}
                                                            className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm"
                                                        >
                                                            {expandedSummaries[item.id] ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                                            {expandedSummaries[item.id] ? 'Collapse summary' : 'Expand for full summary'}
                                                        </button>
                                                        <button className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm">
                                                            <ExternalLink className="w-4 h-4" />
                                                            View Report
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Orders & Referrals Summary */}
                        <div className="bg-white rounded-lg border border-gray-200">
                            <div className="p-6 border-b border-gray-200">
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                    <Calendar className="w-5 h-5 text-green-600" />
                                    Orders & Referrals Summary
                                </h3>
                            </div>
                            <div className="p-6">
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div>
                                        <h4 className="font-medium mb-3 flex items-center gap-2">
                                            <Clock className="w-4 h-4 text-yellow-600" />
                                            Pending:
                                        </h4>
                                        <div className="space-y-2">
                                            {orders.pending.map((order) => (
                                                <div key={order.id} className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                                                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                                                    <span className="font-medium">{order.type}</span>
                                                    <span className="text-gray-600">-- {order.status}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="font-medium mb-3 flex items-center gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                                            Completed:
                                        </h4>
                                        <div className="space-y-2">
                                            {orders.completed.map((order) => (
                                                <div key={order.id} className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                                                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                                    <span className="font-medium">{order.type}</span>
                                                    <span className="text-gray-600">-- {order.status}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <button className="flex items-center gap-2 text-blue-600 hover:text-blue-700">
                                        <ChevronRight className="w-4 h-4" />
                                        View More
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Compliance Nudges */}
                        <div className="bg-white rounded-lg border border-red-200">
                            <div className="p-6 border-b border-red-200 bg-red-50">
                                <h3 className="text-lg font-semibold flex items-center gap-2 text-red-800">
                                    <AlertCircle className="w-5 h-5" />
                                    Compliance Nudges
                                </h3>
                            </div>
                            <div className="p-6">
                                <div className="space-y-3">
                                    {complianceItems.map((item) => (
                                        <div key={item.id} className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                                            <AlertTriangle className="w-5 h-5 text-red-600" />
                                            <span className="font-medium text-red-800">{item.text}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>

    );
};

export default PhysicianDashboard;
