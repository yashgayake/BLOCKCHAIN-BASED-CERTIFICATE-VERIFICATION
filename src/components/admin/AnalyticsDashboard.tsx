import {
BarChart,
Bar,
XAxis,
YAxis,
Tooltip,
ResponsiveContainer,
CartesianGrid
} from "recharts";

import {
Card,
CardHeader,
CardTitle,
CardContent
} from "@/components/ui/card";

import { useAppContext } from "@/contexts/AppContext";

export default function AnalyticsDashboard() {

const { certificates } = useAppContext();

const courseMap:any = {};
const yearMap:any = {};

certificates.forEach((cert:any)=>{

courseMap[cert.course] =
(courseMap[cert.course] || 0) + 1;

yearMap[cert.issueYear] =
(yearMap[cert.issueYear] || 0) + 1;

});

const courseData = Object.keys(courseMap).map(course => ({
course,
count: courseMap[course]
}));

const yearData = Object.keys(yearMap).map(year => ({
year,
count: yearMap[year]
}));

return (

<div className="grid md:grid-cols-2 gap-6 mb-8">

<Card>

<CardHeader>
<CardTitle>
Certificates per Course
</CardTitle>
</CardHeader>

<CardContent>

<ResponsiveContainer width="100%" height={300}>

<BarChart data={courseData}>

<CartesianGrid strokeDasharray="3 3" />

<XAxis dataKey="course"/>

<YAxis/>

<Tooltip/>

<Bar dataKey="count" fill="#6366f1"/>

</BarChart>

</ResponsiveContainer>

</CardContent>

</Card>

<Card>

<CardHeader>
<CardTitle>
Certificates per Year
</CardTitle>
</CardHeader>

<CardContent>

<ResponsiveContainer width="100%" height={300}>

<BarChart data={yearData}>

<CartesianGrid strokeDasharray="3 3"/>

<XAxis dataKey="year"/>

<YAxis/>

<Tooltip/>

<Bar dataKey="count" fill="#22c55e"/>

</BarChart>

</ResponsiveContainer>

</CardContent>

</Card>

</div>

);

}