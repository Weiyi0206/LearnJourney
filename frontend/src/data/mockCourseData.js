export const mockCourseData = {
    id: "course_001",
    title: "Introduction to Python Programming",
    status: "Published",
    totalNodes: 4,
    graph: {
        nodes: [
            { id: '1', position: { x: 250, y: 50 }, data: { label: 'Variables', status: 'Published' }, type: 'input', style: { backgroundColor: '#3b82f6', color: 'white', fontWeight: 'bold', borderRadius: '8px', padding: '10px 20px', border: 'none', cursor: 'pointer' } },
            { id: '2', position: { x: 100, y: 150 }, data: { label: 'Loops', status: 'Published' }, style: { backgroundColor: '#3b82f6', color: 'white', fontWeight: 'bold', borderRadius: '8px', border: 'none', padding: '10px 20px', cursor: 'pointer' } },
            { id: '3', position: { x: 400, y: 150 }, data: { label: 'Functions', status: 'Published' }, style: { backgroundColor: '#f59e0b', color: 'white', fontWeight: 'bold', borderRadius: '8px', border: 'none', padding: '10px 20px', cursor: 'pointer' } },
            { id: '4', position: { x: 250, y: 250 }, data: { label: 'Classes', status: 'Published' }, type: 'output', style: { backgroundColor: '#3b82f6', color: 'white', fontWeight: 'bold', borderRadius: '8px', border: 'none', padding: '10px 20px', cursor: 'pointer' } }
        ],
        edges: [
            { id: 'e1-2', source: '1', target: '2', animated: true, style: { stroke: '#94a3b8', strokeWidth: 2 } },
            { id: 'e1-3', source: '1', target: '3', animated: true, style: { stroke: '#94a3b8', strokeWidth: 2 } },
            { id: 'e3-4', source: '3', target: '4', animated: true, style: { stroke: '#94a3b8', strokeWidth: 2 } }
        ]
    },
    generalAnalytics: {
        enrolled: 142,
        avgProgress: "68%",
        bottlenecks: [
            { id: '3', name: "Functions", failRate: "68%", attempts: 112 },
            { id: '4', name: "Classes", failRate: "54%", attempts: 89 }
        ]
    },
    generalMaterials: [
        { id: 'gm1', type: 'read', name: "Course Syllabus", content: "# Python 101 Syllabus...", dateAdded: "2026-01-10", size: "5 KB" },
        { id: 'gm2', type: 'video', name: "Welcome to the Course", url: "https://youtube.com/watch?v=welcome", dateAdded: "2026-01-12", size: "-" },
        { id: 'gm3', type: 'file', name: "Course_Rules.pdf", dateAdded: "2026-01-15", size: "2.5 MB" }
    ],
    studentsList: [
        { id: 1, name: "Alice Johnson", completedNodes: 3, totalNodes: 4, progress: "75%", currentNodes: ["Classes"], lastActive: "2 hrs ago" },
        { id: 2, name: "Bob Smith", completedNodes: 1, totalNodes: 4, progress: "25%", currentNodes: ["Loops", "Functions"], lastActive: "1 day ago" },
        { id: 3, name: "Charlie Davis", completedNodes: 4, totalNodes: 4, progress: "100%", currentNodes: ["Course Complete"], lastActive: "1 week ago" },
        { id: 4, name: "Diana Prince", completedNodes: 2, totalNodes: 4, progress: "50%", currentNodes: ["Functions"], lastActive: "3 days ago" },
        { id: 5, name: "Evan Wright", completedNodes: 0, totalNodes: 4, progress: "0%", currentNodes: ["Variables"], lastActive: "5 days ago" }
    ],
    nodesData: {
        '1': {
            title: "Variables",
            description: "Basics of memory storage",
            analytics: {
                totalAttempts: 150,
                failRate: "5%",
                studentAttempts: [
                    { name: "Bob Smith", score: "80%", status: "Passed", date: "2026-03-01", type: "MCQ" }
                ]
            },
            promptFocus: "Focus on standard assignment and dynamic typing. Ensure all questions are Single Choice or Multiple Choice Questions (MCQ) only. No essay questions.",
            materials: [
                { id: 'm1', type: 'video', name: "Intro to Python Variables", url: "https://youtube.com/watch?v=123", dateAdded: "2026-02-15", size: "-" },
                { id: 'm2', type: 'read', name: "Memory Management Guide", content: "# Variables in Python\\nThey are references to objects.", dateAdded: "2026-02-16", size: "2 KB" },
                { id: 'm4', type: 'file', name: "Assignment1_Template.pdf", dateAdded: "2026-02-20", size: "1.2 MB" },
                { id: 'm5', type: 'link', name: "Official Python Docs - Variables", url: "https://docs.python.org/3/tutorial/", dateAdded: "2026-02-22", size: "-" }
            ]
        },
        '3': {
            title: "Functions",
            description: "Reusable logic blocks, scoping, and closures.",
            analytics: {
                totalAttempts: 112,
                failRate: "68%",
                studentAttempts: [
                    { name: "Bob Smith", score: "30%", status: "Failed", date: "2026-03-10", type: "MCQ" },
                    { name: "Bob Smith", score: "45%", status: "Failed", date: "2026-03-12", type: "MCQ" },
                    { name: "Alice Johnson", score: "90%", status: "Passed", date: "2026-03-11", type: "MCQ" },
                    { name: "Evan Wright", score: "20%", status: "Failed", date: "2026-03-15", type: "MCQ" }
                ]
            },
            promptFocus: "Focus heavily on lambda functions and variable scope (LEGB rule). Ensure all questions are Single Choice or Multiple Choice Questions (MCQ) only. No open-ended or subjective text questions.",
            materials: [
                { id: 'm3', type: 'video', name: "Advanced Functions (Scope)", url: "https://youtube.com/watch?v=456", dateAdded: "2026-03-05", size: "-" },
                { id: 'm6', type: 'link', name: "Understanding Closures in Python", url: "https://realpython.com/", dateAdded: "2026-03-06", size: "-" }
            ]
        }
    }
};
