"use client";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function MonthlyInquiriesChart({ data }: { data: { month: string; rfqs: number; leads: number }[] }) {
  return (
    <div className="h-64 w-full" role="img" aria-label="Monthly RFQ and contact inquiry trend chart">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 12, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="primaryNavyFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00447B" stopOpacity={0.28} />
              <stop offset="95%" stopColor="#00447B" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="signalNavyFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#1A6DB3" stopOpacity={0.22} />
              <stop offset="95%" stopColor="#1A6DB3" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#E8EDF2" />
          <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#6B7682" }} axisLine={false} tickLine={false} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#6B7682" }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ borderRadius: 8, borderColor: "#C4CCD4", fontSize: 13 }} />
          <Area type="monotone" dataKey="rfqs" name="RFQs" stroke="#00447B" strokeWidth={2.2} fill="url(#primaryNavyFill)" />
          <Area type="monotone" dataKey="leads" name="Contact leads" stroke="#1A6DB3" strokeWidth={2} fill="url(#signalNavyFill)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function PipelineStageChart({ data }: { data: { stage: string; count: number }[] }) {
  return (
    <div className="h-64 w-full" role="img" aria-label="RFQ pipeline stage distribution chart">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 12, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E8EDF2" />
          <XAxis dataKey="stage" tick={{ fontSize: 11, fill: "#6B7682" }} axisLine={false} tickLine={false} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#6B7682" }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ borderRadius: 8, borderColor: "#C4CCD4", fontSize: 13 }} />
          <Bar dataKey="count" name="Inquiries" fill="#00447B" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
