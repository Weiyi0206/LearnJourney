import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function EducatorDashboard() {
    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold mb-6 tracking-tight">Educator Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-500">Total Courses</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold">4</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-500">Total Enrolled Students</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold">142</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-500">Avg. Mastery Progress</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold text-emerald-600">68%</div>
                    </CardContent>
                </Card>
            </div>

            <div className="mt-8">
                <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
                <Card>
                    <CardContent className="p-6">
                        <p className="text-zinc-500">Activity feeds will appear here.</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
