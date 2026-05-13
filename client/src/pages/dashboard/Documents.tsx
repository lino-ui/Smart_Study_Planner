import React, { useState, useEffect, useRef } from 'react';
import { UploadCloud, FileText, Trash2, Search, BookOpen, Loader2, File } from 'lucide-react';
import api from '../../lib/axios';
import { Document } from '../../types/document';
import { Subject } from '../../types/subject';

export default function Documents() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [docsRes, subsRes] = await Promise.all([
        api.get('/documents/'),
        api.get('/subjects/')
      ]);
      setDocuments(docsRes.data);
      setSubjects(subsRes.data);
    } catch (err) {
      console.error("Failed to fetch documents", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf') && !file.name.toLowerCase().endsWith('.txt')) {
      alert("Only PDF and TXT files are currently supported.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("File is too large. Limit is 5MB.");
      return;
    }

    setIsUploading(true);
    setUploadProgress(10); // Fake progress to show activity

    const formData = new FormData();
    formData.append('file', file);
    if (selectedSubject) {
      formData.append('subject_id', selectedSubject);
    }

    try {
      const interval = setInterval(() => {
        setUploadProgress(prev => (prev < 90 ? prev + 10 : prev));
      }, 500);

      await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      clearInterval(interval);
      setUploadProgress(100);
      
      // Wait a moment so user sees 100%
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
        if (fileInputRef.current) fileInputRef.current.value = "";
        fetchData();
      }, 500);

    } catch (err: any) {
      setIsUploading(false);
      setUploadProgress(0);
      alert(err.response?.data?.detail || "Failed to upload file.");
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this document? It will be removed from your AI's memory.")) return;
    
    try {
      await api.delete(`/documents/${id}`);
      setDocuments(prev => prev.filter(d => d.id !== id));
    } catch (err) {
      alert("Failed to delete document.");
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <FileText className="h-8 w-8 text-primary" /> Study Library
          </h1>
          <p className="text-muted-foreground mt-1">
            Upload notes and syllabuses to grant your AI Tutor specific contextual knowledge.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Upload Panel */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-card border rounded-2xl shadow-sm p-6">
            <h2 className="text-xl font-bold mb-4">Upload Document</h2>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Tag to Subject (Optional)</label>
                <select 
                  value={selectedSubject} 
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <option value="">No Subject</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div 
                onClick={() => !isUploading && fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                  isUploading ? 'border-primary/50 bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/50'
                }`}
              >
                {isUploading ? (
                  <div className="flex flex-col items-center">
                    <Loader2 className="h-10 w-10 text-primary animate-spin mb-3" />
                    <p className="text-sm font-medium text-primary">Processing & Reading...</p>
                    <div className="w-full bg-secondary/20 rounded-full h-1.5 mt-4">
                      <div className="bg-primary h-1.5 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-3">
                      <UploadCloud className="h-6 w-6" />
                    </div>
                    <p className="text-sm font-medium text-foreground">Click to upload PDF or TXT</p>
                    <p className="text-xs text-muted-foreground mt-1">Maximum size: 5MB</p>
                  </div>
                )}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  className="hidden" 
                  accept=".pdf,.txt"
                  disabled={isUploading}
                />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-secondary/10 to-card border border-secondary/20 rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-secondary mb-2 flex items-center gap-2">
              <Search className="h-5 w-5" /> How it works
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              When you upload a document, our system mathematically analyzes and stores its contents (RAG). 
              You can then go to the <strong>AI Assistant</strong> and switch to "Chat with My Notes" mode to ask specific questions about your uploaded materials!
            </p>
          </div>
        </div>

        {/* Documents List */}
        <div className="lg:col-span-2">
          <div className="bg-card border rounded-2xl shadow-sm overflow-hidden min-h-[500px] flex flex-col">
            <div className="p-5 border-b border-border bg-muted/10 flex justify-between items-center">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" /> Your Library
              </h2>
              <span className="text-xs font-medium text-muted-foreground bg-background px-2 py-1 rounded border">
                {documents.length} Files
              </span>
            </div>
            
            <div className="p-5 flex-1">
              {isLoading ? (
                <div className="flex justify-center items-center h-40">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : documents.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-20">
                  <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                    <File className="h-8 w-8 opacity-50" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Your library is empty</h3>
                    <p className="text-muted-foreground text-sm max-w-sm">Upload your first syllabus or study guide to make your AI Tutor smarter.</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {documents.map(doc => (
                    <div key={doc.id} className="bg-background border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow relative group">
                      <div className="flex gap-3">
                        <div className="h-10 w-10 rounded bg-primary/10 text-primary flex items-center justify-center shrink-0 uppercase font-bold text-xs">
                          {doc.file_type}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-foreground text-sm truncate" title={doc.title}>{doc.title}</h4>
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">
                            {formatBytes(doc.file_size_bytes)} • {new Date(doc.upload_date).toLocaleDateString()}
                          </p>
                          {doc.subject_name && (
                            <span className="inline-block mt-2 text-[10px] bg-secondary/10 text-secondary px-2 py-0.5 rounded font-medium truncate max-w-full">
                              {doc.subject_name}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => handleDelete(doc.id)}
                        className="absolute top-2 right-2 p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                        title="Delete Document"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
