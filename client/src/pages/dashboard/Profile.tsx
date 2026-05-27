import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuthStore } from '../../store/authStore';
import api from '../../lib/axios';
import { Loader2, User as UserIcon, Settings, Clock, Coffee, Brain } from 'lucide-react';

const profileSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  branch: z.string().optional(),
  semester: z.preprocess((val) => val === '' || val === undefined || val === null ? undefined : Number(val), z.number().min(1).max(10).optional()),
  bio: z.string().max(160, "Bio max 160 characters").optional(),
});

const preferencesSchema = z.object({
  daily_study_hours: z.number().min(1).max(24),
  preferred_study_time: z.enum(["Morning", "Evening", "Flexible"]),
  pomodoro_length_minutes: z.number().min(10).max(120),
  break_duration_minutes: z.number().min(1).max(60),
  long_break_after: z.number().min(1).max(10),
});

type ProfileFormValues = z.infer<typeof profileSchema>;
type PreferencesFormValues = z.infer<typeof preferencesSchema>;

export default function Profile() {
  const { user, fetchCurrentUser } = useAuthStore();
  const [profileLoading, setProfileLoading] = useState(false);
  const [prefsLoading, setPrefsLoading] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: user?.full_name || '',
      branch: user?.branch || '',
      semester: user?.semester || undefined,
      bio: user?.bio || '',
    },
  });

  const {
    register: registerPrefs,
    handleSubmit: handlePrefsSubmit,
    watch: watchPrefs,
    formState: { errors: _prefsErrors },
  } = useForm<PreferencesFormValues>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: {
      daily_study_hours: user?.daily_study_hours || 6,
      preferred_study_time: (user?.preferred_study_time as any) || "Flexible",
      pomodoro_length_minutes: user?.pomodoro_length_minutes || 25,
      break_duration_minutes: user?.break_duration_minutes || 5,
      long_break_after: user?.long_break_after || 4,
    },
  });

  const watchDailyHours = watchPrefs("daily_study_hours");

  const onProfileSubmit = async (data: ProfileFormValues) => {
    try {
      setProfileLoading(true);
      setMessage(null);
      await api.put('/users/me', data);
      await fetchCurrentUser();
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to update profile.' });
    } finally {
      setProfileLoading(false);
    }
  };

  const onPrefsSubmit = async (data: PreferencesFormValues) => {
    try {
      setPrefsLoading(true);
      setMessage(null);
      await api.patch('/users/preferences', data);
      await fetchCurrentUser();
      setMessage({ type: 'success', text: 'Preferences updated successfully!' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to update preferences.' });
    } finally {
      setPrefsLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Profile & Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account and study preferences.</p>
      </div>

      {message && (
        <div className={`p-4 rounded-md border text-sm ${message.type === 'success' ? 'bg-success/10 border-success/20 text-success' : 'bg-destructive/10 border-destructive/20 text-destructive'}`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Section A: Basic Profile */}
        <div className="bg-card border rounded-xl shadow-soft p-6">
          <div className="flex items-center space-x-3 mb-6 border-b pb-4">
            <div className="bg-primary/10 p-2 rounded-lg text-primary">
              <UserIcon className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-semibold">Basic Profile</h2>
          </div>

          <div className="flex items-center space-x-4 mb-6">
            <div className="h-20 w-20 rounded-full bg-secondary/20 flex items-center justify-center text-secondary text-2xl font-bold uppercase overflow-hidden border-2 border-background shadow-sm">
              {user.avatar_url ? (
                <img src={user.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                user.full_name.charAt(0)
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{user.email}</p>
              <p className="text-xs text-muted-foreground">Email cannot be changed</p>
            </div>
          </div>

          <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Full Name</label>
              <input
                {...registerProfile("full_name")}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
              />
              {profileErrors.full_name && <p className="text-xs text-destructive">{profileErrors.full_name.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">Branch</label>
                <input
                  {...registerProfile("branch")}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                  placeholder="Computer Science"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Semester</label>
                <input
                  type="number"
                  {...registerProfile("semester")}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                  placeholder="5"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Short Bio</label>
              <textarea
                {...registerProfile("bio")}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none resize-none"
                placeholder="A bit about yourself and your academic goals..."
              />
              {profileErrors.bio && <p className="text-xs text-destructive">{profileErrors.bio.message}</p>}
            </div>

            <button
              type="submit"
              disabled={profileLoading}
              className="mt-4 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 w-full"
            >
              {profileLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Save Profile"}
            </button>
          </form>
        </div>

        {/* Section B: Study Preferences */}
        <div className="bg-card border rounded-xl shadow-soft p-6">
          <div className="flex items-center space-x-3 mb-6 border-b pb-4">
            <div className="bg-secondary/10 p-2 rounded-lg text-secondary">
              <Settings className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-semibold">Study Preferences</h2>
          </div>

          <form onSubmit={handlePrefsSubmit(onPrefsSubmit)} className="space-y-5">
            
            <div className="space-y-3 bg-muted/30 p-4 rounded-lg border border-border/50">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" /> Daily Study Goal
                </label>
                <span className="text-primary font-bold">{watchDailyHours} hours</span>
              </div>
              <input
                type="range"
                min="1"
                max="16"
                step="1"
                {...registerPrefs("daily_study_hours", { valueAsNumber: true })}
                className="w-full h-2 bg-secondary/20 rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <p className="text-xs text-muted-foreground">This helps the AI scheduler block out enough time for you.</p>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Preferred Study Time</label>
              <select
                {...registerPrefs("preferred_study_time")}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
              >
                <option value="Flexible">Flexible (Anytime)</option>
                <option value="Morning">Morning Bird (6 AM - 12 PM)</option>
                <option value="Evening">Night Owl (8 PM - 2 AM)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Brain className="w-3.5 h-3.5 text-muted-foreground" /> Focus Time (min)
                </label>
                <input
                  type="number"
                  {...registerPrefs("pomodoro_length_minutes", { valueAsNumber: true })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Coffee className="w-3.5 h-3.5 text-muted-foreground" /> Short Break (min)
                </label>
                <input
                  type="number"
                  {...registerPrefs("break_duration_minutes", { valueAsNumber: true })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Long break after X sessions</label>
              <input
                type="number"
                {...registerPrefs("long_break_after", { valueAsNumber: true })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
              />
            </div>

            <div className="bg-primary/5 border border-primary/20 rounded-md p-3 text-sm text-muted-foreground">
              <p><strong>AI Impact:</strong> Based on your {watchDailyHours}h goal and {watchPrefs("pomodoro_length_minutes")}m sessions, the AI will schedule roughly {Math.round((watchDailyHours * 60) / (watchPrefs("pomodoro_length_minutes") + watchPrefs("break_duration_minutes")))} sessions per day.</p>
            </div>

            <button
              type="submit"
              disabled={prefsLoading}
              className="mt-4 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-secondary text-secondary-foreground hover:bg-secondary/90 h-10 px-4 py-2 w-full"
            >
              {prefsLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Save Preferences"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
