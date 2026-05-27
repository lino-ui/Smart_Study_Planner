import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft, Plus, Clock, BookOpen, CheckCircle2, Circle, MoreVertical, Loader2 } from 'lucide-react';
import api from '../../lib/axios';
import { SubjectWithChapters, Chapter } from '../../types/subject';

const chapterSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  description: z.string().optional(),
  difficulty: z.enum(["Easy", "Medium", "Hard"]),
  estimated_hours: z.number().min(0.1),
});

type ChapterFormValues = z.infer<typeof chapterSchema>;

export default function SubjectDetail() {
  const { id } = useParams<{ id: string }>();
  const [subject, setSubject] = useState<SubjectWithChapters | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChapterFormValues>({
    resolver: zodResolver(chapterSchema),
    defaultValues: {
      difficulty: "Medium",
      estimated_hours: 1.0
    }
  });

  const fetchSubject = async () => {
    try {
      setIsLoading(true);
      const res = await api.get(`/subjects/${id}`);
      setSubject(res.data);
    } catch (err) {
      console.error("Failed to fetch subject details");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubject();
  }, [id]);

  const onSubmit = async (data: ChapterFormValues) => {
    try {
      setMessage(null);
      await api.post(`/subjects/${id}/chapters`, data);
      setMessage({ type: 'success', text: 'Chapter added successfully!' });
      setIsModalOpen(false);
      reset();
      fetchSubject();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.detail || 'Failed to add chapter' });
    }
  };

  const toggleChapterStatus = async (chapter: Chapter) => {
    try {
      const nextStatus = chapter.status === 'Completed' ? 'Not Started' : 'Completed';
      await api.put(`/subjects/chapters/${chapter.id}`, { status: nextStatus });
      fetchSubject();
    } catch (err) {
      console.error("Failed to update status");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!subject) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold">Subject not found</h2>
        <Link to="/subjects" className="text-primary hover:underline mt-4 inline-block">Back to Subjects</Link>
      </div>
    );
  }

  const completedHours = subject.chapters.reduce((acc, ch) => acc + (ch.status === 'Completed' ? ch.estimated_hours : 0), 0);
  const totalEstimatedHours = subject.chapters.reduce((acc, ch) => acc + ch.estimated_hours, 0);
  const progressPercent = totalEstimatedHours > 0 ? Math.round((completedHours / totalEstimatedHours) * 100) : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      <Link to="/subjects" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Subjects
      </Link>

      <div className="bg-card border rounded-xl shadow-sm overflow-hidden relative">
        <div className="h-3 w-full absolute top-0" style={{ backgroundColor: subject.color }}></div>
        <div className="p-6 sm:p-8 pt-10 flex flex-col md:flex-row gap-8 justify-between">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-foreground mb-2">{subject.name}</h1>
            {subject.branch && <p className="text-muted-foreground">{subject.branch} {subject.semester ? `• Sem ${subject.semester}` : ''}</p>}
            
            <div className="flex flex-wrap gap-4 mt-6">
              <div className="flex items-center text-sm font-medium bg-primary/10 text-primary px-3 py-1.5 rounded-full">
                <BookOpen className="mr-2 h-4 w-4" /> {subject.chapters.length} Chapters
              </div>
              <div className="flex items-center text-sm font-medium bg-secondary/10 text-secondary px-3 py-1.5 rounded-full">
                <Clock className="mr-2 h-4 w-4" /> {totalEstimatedHours}h Estimated
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center bg-background rounded-full h-32 w-32 border-8 border-muted relative shadow-inner shrink-0">
            {/* Simple progress circle implementation */}
            <div className="absolute inset-0 rounded-full border-8" 
                 style={{ 
                   borderColor: subject.color, 
                   clipPath: `polygon(0 0, 100% 0, 100% ${progressPercent}%, 0 ${progressPercent}%)`,
                   transform: 'rotate(-90deg)',
                   transition: 'clip-path 1s ease-in-out'
                 }} 
            />
            <div className="text-center z-10">
              <span className="text-2xl font-bold">{progressPercent}%</span>
              <span className="block text-xs text-muted-foreground uppercase tracking-wider font-semibold">Done</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center mt-8 mb-4">
        <h2 className="text-2xl font-bold">Syllabus</h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-secondary text-secondary-foreground hover:bg-secondary/90 h-9 px-4"
        >
          <Plus className="mr-2 h-4 w-4" /> Add Chapter
        </button>
      </div>

      {subject.chapters.length === 0 ? (
        <div className="text-center p-12 border border-dashed rounded-xl bg-card">
          <p className="text-muted-foreground">No chapters added yet. Break down your syllabus into manageable chunks.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {subject.chapters.map((chapter, idx) => (
            <div key={chapter.id} className="group bg-card border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow flex items-start gap-4">
              <button 
                onClick={() => toggleChapterStatus(chapter)}
                className="mt-1 flex-shrink-0 text-muted-foreground hover:text-primary transition-colors focus:outline-none"
              >
                {chapter.status === 'Completed' ? (
                  <CheckCircle2 className="h-6 w-6 text-success" />
                ) : (
                  <Circle className="h-6 w-6" />
                )}
              </button>
              
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h3 className={`text-lg font-semibold ${chapter.status === 'Completed' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                    <span className="text-muted-foreground font-normal mr-2">{idx + 1}.</span>
                    {chapter.title}
                  </h3>
                  <button className="text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </div>
                {chapter.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{chapter.description}</p>}
                
                <div className="flex gap-3 mt-3">
                  <span className={`text-xs px-2 py-0.5 rounded font-medium border ${
                    chapter.difficulty === 'Easy' ? 'bg-success/10 text-success border-success/20' : 
                    chapter.difficulty === 'Medium' ? 'bg-secondary/10 text-secondary border-secondary/20' : 
                    'bg-destructive/10 text-destructive border-destructive/20'
                  }`}>
                    {chapter.difficulty}
                  </span>
                  <span className="text-xs text-muted-foreground flex items-center">
                    <Clock className="h-3 w-3 mr-1" /> {chapter.estimated_hours}h
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Chapter Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in">
          <div className="bg-card w-full max-w-md rounded-2xl shadow-xl overflow-hidden">
            <div className="p-6 border-b border-border/50 flex justify-between items-center">
              <h2 className="text-xl font-bold">Add Chapter</h2>
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
                  <label className="text-sm font-medium">Chapter Title *</label>
                  <input
                    {...register("title")}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                    placeholder="e.g. Introduction to Algorithms"
                  />
                  {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium">Description</label>
                  <textarea
                    {...register("description")}
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none resize-none"
                    placeholder="Brief overview..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Difficulty</label>
                    <select
                      {...register("difficulty")}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Est. Hours *</label>
                    <input
                      type="number"
                      step="0.5"
                      {...register("estimated_hours", { valueAsNumber: true })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                    />
                    {errors.estimated_hours && <p className="text-xs text-destructive">{errors.estimated_hours.message}</p>}
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
                    className="h-10 px-4 py-2 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/90 text-sm font-medium transition-colors inline-flex items-center"
                  >
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Add Chapter"}
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
