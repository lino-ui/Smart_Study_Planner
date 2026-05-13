import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, RadarChart, PolarGrid, 
  PolarAngleAxis, PolarRadiusAxis, Radar, Legend 
} from 'recharts';
import { Download, BrainCircuit, Activity, BookOpen, Clock, Target, Loader2 } from 'lucide-react';
import api from '../../lib/axios';
import { AnalyticsReport } from '../../types/analytics';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { toast } from 'sonner';

export default function Analytics() {
  const [report, setReport] = useState<AnalyticsReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const reportRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await api.get('/analytics/report');
        setReport(res.data);
      } catch (err) {
        console.error("Failed to fetch analytics");
      } finally {
        setIsLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <Activity className="h-12 w-12 mx-auto mb-4 opacity-20" />
        <p>Not enough data to generate analytics yet. Start studying!</p>
      </div>
    );
  }

  // Format data for Radar Chart
  const radarData = report.subject_performance.map(s => ({
    subject: s.subject,
    Completion: s.progress_percentage,
    Hours: s.hours_spent * 2, // Scale up visually
    fullMark: 100
  }));

  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    
    try {
      setIsExporting(true);
      toast.loading("Generating PDF Report...", { id: "pdf-export" });
      
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        backgroundColor: document.documentElement.classList.contains('dark') ? '#0f172a' : '#ffffff',
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Study_Analytics_${new Date().toISOString().split('T')[0]}.pdf`);
      
      toast.success("Report downloaded successfully!", { id: "pdf-export" });
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate PDF.", { id: "pdf-export" });
    } finally {
      setIsExporting(false);
    }
  };

  // Simple Heatmap Grid Generator
  const renderHeatmap = () => {
    // Generate an array of 30 boxes
    const boxes = [];
    const today = new Date();
    
    // Create map for easy lookup
    const heatMapLookup: Record<string, number> = {};
    report.heatmap.forEach(h => {
      heatMapLookup[h.date] = h.count;
    });

    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const minutes = heatMapLookup[dateStr] || 0;
      
      let colorClass = 'bg-muted/30';
      if (minutes > 0 && minutes <= 60) colorClass = 'bg-primary/30';
      else if (minutes > 60 && minutes <= 120) colorClass = 'bg-primary/60';
      else if (minutes > 120) colorClass = 'bg-primary';

      boxes.push(
        <div 
          key={dateStr} 
          title={`${dateStr}: ${minutes} min`}
          className={`w-4 h-4 sm:w-5 sm:h-5 rounded-sm ${colorClass} transition-all hover:ring-2 hover:ring-offset-1 hover:ring-primary`}
        />
      );
    }

    return (
      <div className="flex flex-wrap gap-1 sm:gap-2">
        {boxes}
      </div>
    );
  };

  return (
    <div ref={reportRef} className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12 px-4 sm:px-0">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Activity className="h-8 w-8 text-primary" /> Analytics & Insights
          </h1>
          <p className="text-muted-foreground mt-1">Deep dive into your study patterns and performance metrics.</p>
        </div>
        <button 
          onClick={handleExportPDF}
          disabled={isExporting}
          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 disabled:opacity-50"
        >
          {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
          Export Report
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border rounded-xl p-5 shadow-sm">
          <p className="text-sm font-medium text-muted-foreground flex items-center gap-1"><Clock className="h-4 w-4"/> Total Hours</p>
          <h3 className="text-3xl font-bold text-foreground mt-2">{report.overview.total_hours}<span className="text-base font-normal text-muted-foreground ml-1">h</span></h3>
        </div>
        <div className="bg-card border rounded-xl p-5 shadow-sm">
          <p className="text-sm font-medium text-muted-foreground flex items-center gap-1"><Activity className="h-4 w-4"/> Current Streak</p>
          <h3 className="text-3xl font-bold text-foreground mt-2">{report.overview.current_streak}<span className="text-base font-normal text-muted-foreground ml-1">d</span></h3>
        </div>
        <div className="bg-card border rounded-xl p-5 shadow-sm">
          <p className="text-sm font-medium text-muted-foreground flex items-center gap-1"><BookOpen className="h-4 w-4"/> Completion</p>
          <h3 className="text-3xl font-bold text-foreground mt-2">{report.overview.completion_rate}<span className="text-base font-normal text-muted-foreground ml-1">%</span></h3>
        </div>
        <div className="bg-card border rounded-xl p-5 shadow-sm">
          <p className="text-sm font-medium text-muted-foreground flex items-center gap-1"><Target className="h-4 w-4"/> Consistency</p>
          <h3 className="text-3xl font-bold text-foreground mt-2">{report.overview.consistency_score}<span className="text-base font-normal text-muted-foreground ml-1">/100</span></h3>
        </div>
      </div>

      {/* Main Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Trend Line Chart (Takes up 2 columns) */}
        <div className="lg:col-span-2 bg-card border rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-bold mb-6">30-Day Study Trend</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={report.monthly_trend} margin={{ top: 5, right: 20, bottom: 5, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fill: '#64748B', fontSize: 12 }} dy={10} minTickGap={30} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                <Tooltip 
                  cursor={{ stroke: '#94A3B8', strokeWidth: 1, strokeDasharray: '5 5' }} 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                />
                <Line type="monotone" dataKey="hours" stroke="#3B82F6" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: '#3B82F6', stroke: '#fff', strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Heatmap & AI Insights (Takes up 1 column) */}
        <div className="space-y-6">
          <div className="bg-card border rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <BrainCircuit className="h-5 w-5 text-secondary" /> AI Insights
            </h3>
            <div className="space-y-3">
              {report.ai_insights.map((insight, idx) => (
                <div key={idx} className="p-4 rounded-lg bg-secondary/10 border border-secondary/20 text-sm text-secondary-foreground leading-relaxed">
                  {insight}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card border rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-bold mb-4">Activity Heatmap</h3>
            {renderHeatmap()}
            <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
              <span>Less</span>
              <div className="flex gap-1">
                <div className="w-3 h-3 rounded-sm bg-muted/30"></div>
                <div className="w-3 h-3 rounded-sm bg-primary/30"></div>
                <div className="w-3 h-3 rounded-sm bg-primary/60"></div>
                <div className="w-3 h-3 rounded-sm bg-primary"></div>
              </div>
              <span>More</span>
            </div>
          </div>
        </div>

      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Weekly Bar Chart */}
        <div className="bg-card border rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-bold mb-6">Weekly Distribution</h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={report.weekly_trend} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: '#64748B', fontSize: 12 }} dy={10} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                <Tooltip cursor={{ fill: '#F1F5F9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="hours" fill="#14B8A6" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Subject Radar Chart */}
        <div className="bg-card border rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-bold mb-6">Subject Performance</h3>
          <div className="h-[250px] w-full">
            {report.subject_performance.length > 2 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                  <PolarGrid stroke="#E2E8F0" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748B', fontSize: 12 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name="Completion %" dataKey="Completion" stroke="#14B8A6" fill="#14B8A6" fillOpacity={0.5} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                Add at least 3 subjects to unlock radar analysis.
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
