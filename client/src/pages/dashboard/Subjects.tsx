import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { BookOpen, Calendar, Clock, Plus, Loader2, Trash2 } from 'lucide-react';
import api from '../../lib/axios';
import { Subject } from '../../types/subject';

const subjectSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  branch: z.string().optional(),
  semester: z.string().transform((v) => v === '' ? undefined : Number(v)).optional(),
  exam_date: z.string().optional(),
  color: z.string().optional(),
});

type SubjectFormValues = z.infer<typeof subjectSchema>;

export default function Subjects() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  const handleDeleteSubject = async (e: React.MouseEvent, subjectId: number, subjectName: string) => {
    e.preventDefault();
    e.stopPropagation();
    const confirmDelete = window.confirm(`Are you sure you want to delete the subject "${subjectName}"? This will delete all its chapters too.`);
    if (confirmDelete) {
      try {
        await api.delete(`/subjects/${subjectId}`);
        fetchSubjects();
      } catch (err) {
        console.error("Failed to delete subject:", err);
      }
    }
  };

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SubjectFormValues>({
    resolver: zodResolver(subjectSchema),
    defaultValues: {
      color: '#14B8A6'
    }
  });

  const fetchSubjects = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/subjects/');
      setSubjects(res.data);
    } catch (err) {
      console.error("Failed to fetch subjects");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const onSubmit = async (data: SubjectFormValues) => {
    try {
      setMessage(null);
      // Format date correctly if exists
      const payload = {
        ...data,
        exam_date: data.exam_date ? new Date(data.exam_date).toISOString() : undefined
      };
      
      await api.post('/subjects/', payload);
      setMessage({ type: 'success', text: 'Subject created successfully!' });
      setIsModalOpen(false);
      reset();
      fetchSubjects();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.detail || 'Failed to create subject' });
    }
  };

  // Helper to format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getDaysLeft = (dateString?: string) => {
    if (!dateString) return null;
    const diff = new Date(dateString).getTime() - new Date().getTime();
    const days = Math.ceil(diff / (1000 * 3600 * 24));
    return days > 0 ? days : 0;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Subjects</h1>
          <p className="text-muted-foreground mt-1">Manage your syllabus and track your progress.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
        >
          <Plus className="mr-2 h-4 w-4" /> Add Subject
        </button>
      </div>

      {message && !isModalOpen && (
        <div className={`p-4 rounded-md border text-sm ${message.type === 'success' ? 'bg-success/10 border-success/20 text-success' : 'bg-destructive/10 border-destructive/20 text-destructive'}`}>
          {message.text}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : subjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 bg-card border rounded-xl shadow-soft text-center p-6">
          <div className="bg-primary/10 p-4 rounded-full mb-4">
            <BookOpen className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No subjects yet</h3>
          <p className="text-muted-foreground mb-6">Start by adding a subject to manage your syllabus.</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
          >
            Add your first subject
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjects.map((subject) => {
            const daysLeft = getDaysLeft(subject.exam_date);
            return (
              <Link key={subject.id} to={`/subjects/${subject.id}`} className="group block">
                <div className="bg-card border rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden relative">
                  <div className="h-2 w-full absolute top-0" style={{ backgroundColor: subject.color }}></div>
                  <div className="p-6 pt-8">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold group-hover:text-primary transition-colors line-clamp-1">{subject.name}</h3>
                        {subject.branch && <p className="text-sm text-muted-foreground">{subject.branch} {subject.semester ? `• Sem ${subject.semester}` : ''}</p>}
                      </div>
                      <button 
                        onClick={(e) => handleDeleteSubject(e, subject.id, subject.name)}
                        className="text-muted-foreground hover:text-destructive p-1 rounded hover:bg-muted/80 transition-colors relative z-10"
                        title="Delete Subject"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>

                    <div className="space-y-3 mb-6">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="mr-2 h-4 w-4" />
                        <span>Exam: <span className="font-medium text-foreground">{formatDate(subject.exam_date)}</span></span>
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="mr-2 h-4 w-4" />
                        <span>Est. Total: <span className="font-medium text-foreground">{subject.total_hours}h</span></span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-border/50">
                      {daysLeft !== null ? (
                        <div className={`text-sm font-medium ${daysLeft < 7 ? 'text-destructive' : daysLeft < 30 ? 'text-secondary' : 'text-success'}`}>
                          {daysLeft} days until exam
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">No exam scheduled</div>
                      )}
                      
                      <div className="h-8 w-8 rounded-full border-2 border-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                        0%
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {/* Add Subject Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in">
          <div className="bg-card w-full max-w-md rounded-2xl shadow-xl overflow-hidden">
            <div className="p-6 border-b border-border/50 flex justify-between items-center">
              <h2 className="text-xl font-bold">Add New Subject</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground text-2xl leading-none">&times;</button>
            </div>
            
            <div className="p-6">
              {message && isModalOpen && (
                <div className={`mb-4 p-3 rounded-md text-sm ${message.type === 'error' ? 'bg-destructive/10 text-destructive' : ''}`}>
                  {message.text}
                </div>
              )}
              
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Subject Name *</label>
                  <input
                    {...register("name")}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                    placeholder="e.g. Data Structures"
                  />
                  {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Branch</label>
                    <input
                      {...register("branch")}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Semester</label>
                    <input
                      type="number"
                      {...register("semester")}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Exam Date</label>
                    <input
                      type="date"
                      {...register("exam_date")}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Accent Color</label>
                    <input
                      type="color"
                      {...register("color")}
                      className="flex h-10 w-full rounded-md border border-input bg-background p-1 text-sm focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none cursor-pointer"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="h-10 px-4 py-2 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground text-sm font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="h-10 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium transition-colors inline-flex items-center"
                  >
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Save Subject"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
