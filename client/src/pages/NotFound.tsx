import { Link } from 'react-router-dom';
import { Ghost, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4 text-center animate-in fade-in duration-500">
      <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-6 shadow-soft">
        <Ghost className="h-12 w-12" />
      </div>
      <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl mb-2">
        404 Not Found
      </h1>
      <p className="text-lg text-muted-foreground max-w-[600px] mb-8">
        Oops! It seems this page has wandered off into the void. 
        Maybe the AI tutor accidentally deleted it while studying.
      </p>
      <Link 
        to="/dashboard"
        className="inline-flex items-center justify-center bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-8 rounded-full font-bold transition-all shadow-md hover:scale-105"
      >
        <Home className="h-5 w-5 mr-2" /> Back to Dashboard
      </Link>
    </div>
  );
}
