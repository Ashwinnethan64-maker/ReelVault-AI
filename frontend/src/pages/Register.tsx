import React, { useState } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Mail, Lock, Globe, ArrowRight, PlaySquare } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

export const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { session, user, isLoading } = useAuth();
  const navigate = useNavigate();

  if (!isLoading && session && user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          }
        }
      });
      if (authError) throw authError;
      
      // If auto sign in happens, AuthContext will handle redirect. 
      // Otherwise, we might need to tell them to check email.
      // Let's assume it redirects directly.
      navigate('/');
    } catch (err: any) {
      console.error('Registration failed', err);
      setError(err.message || 'Registration failed. Email might already exist.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      console.error('Google login failed', err);
      setError(err.message || 'Google authentication failed');
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-background">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex w-1/2 relative bg-zinc-950 flex-col justify-between p-12 overflow-hidden border-r border-white/5">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-purple-900/40 via-zinc-950 to-zinc-950"></div>
        <div className="absolute -left-1/4 -top-1/4 w-1/2 h-1/2 bg-purple-500/10 blur-[120px] rounded-full"></div>
        
        <div className="relative z-10 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <PlaySquare className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">ReelVault AI</span>
        </div>

        <div className="relative z-10 max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            <h1 className="text-4xl font-bold text-white mb-6 leading-tight">
              Start building your <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">knowledge empire</span> today.
            </h1>
            <p className="text-zinc-400 text-lg leading-relaxed">
              Join thousands of creators, researchers, and learners saving their most valuable video content.
            </p>
          </motion.div>
        </div>

        <div className="relative z-10 text-sm text-zinc-500">
          © {new Date().getFullYear()} ReelVault AI. All rights reserved.
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12">
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm space-y-8"
        >
          <div className="space-y-2 text-center lg:text-left">
            <h2 className="text-3xl font-semibold tracking-tight text-foreground">Create an account</h2>
            <p className="text-muted-foreground">Start organizing your knowledge vault today</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10 bg-zinc-900/50 border-white/10 focus:border-purple-500/50 transition-colors"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-zinc-900/50 border-white/10 focus:border-purple-500/50 transition-colors"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 bg-zinc-900/50 border-white/10 focus:border-purple-500/50 transition-colors"
                  required
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-11 bg-white text-black hover:bg-zinc-200 transition-colors group"
              disabled={loading}
            >
              {loading ? 'Creating account...' : (
                <span className="flex items-center">
                  Create Account
                  <ArrowRight className="ml-2 w-4 h-4 opacity-50 group-hover:translate-x-1 transition-transform" />
                </span>
              )}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <Button onClick={handleGoogleLogin} variant="outline" type="button" className="w-full h-11 border-white/10 bg-zinc-900/30 hover:bg-zinc-800 transition-colors">
            <Globe className="mr-2 h-4 w-4" />
            Google
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="text-purple-400 hover:text-purple-300 font-medium transition-colors">
              Sign In
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};
