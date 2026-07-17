import { Bell, Search } from 'lucide-react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';

export const TopNav = () => {
  return (
    <header className="h-16 border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-10 flex items-center justify-between px-4 md:px-6">
      <div className="md:hidden">
        <h1 className="text-xl font-bold">ReelVault AI</h1>
      </div>

      <div className="hidden md:flex flex-1 max-w-xl mx-auto px-6">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search AI reels, Python tutorials, etc..." 
            className="w-full pl-10 bg-accent/50 border-none focus-visible:ring-1"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="rounded-full">
          <Bell className="w-5 h-5" />
        </Button>
        <Button variant="ghost" size="icon" className="rounded-full md:hidden">
          <Search className="w-5 h-5" />
        </Button>
        <Button className="hidden md:flex rounded-full px-6">
          + Add Reel
        </Button>
      </div>
    </header>
  );
};
