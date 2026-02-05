import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Shield, Mail, Lock, User, Loader2, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { lovable } from '@/integrations/lovable/index';
import { Separator } from '@/components/ui/separator';

const emailSchema = z.string().email('Please enter a valid email address');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');

type AuthMode = 'login' | 'signup' | 'forgot';

export default function Auth() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; fullName?: string }>({});
  const [resetEmailSent, setResetEmailSent] = useState(false);

  const { user, signIn, signUp, resetPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const from = (location.state as any)?.from?.pathname || '/';

  // Redirect if already authenticated - use stable reference
  useEffect(() => {
    if (user) {
      // Avoid redirecting back to auth page
      const redirectTo = from === '/auth' ? '/' : from;
      navigate(redirectTo, { replace: true });
    }
  }, [user, navigate]); // Remove 'from' from deps to prevent infinite loop

  const validateForm = () => {
    const newErrors: typeof errors = {};

    try {
      emailSchema.parse(email);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.email = e.errors[0].message;
      }
    }

    // Only validate password for login/signup, not forgot password
    if (mode !== 'forgot') {
      try {
        passwordSchema.parse(password);
      } catch (e) {
        if (e instanceof z.ZodError) {
          newErrors.password = e.errors[0].message;
        }
      }
    }

    if (mode === 'signup' && !fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      if (mode === 'forgot') {
        const { error } = await resetPassword(email);
        if (error) {
          toast({
            title: 'Error',
            description: error.message,
            variant: 'destructive',
          });
        } else {
          setResetEmailSent(true);
          toast({
            title: 'Check Your Email',
            description: 'We sent you a password reset link.',
          });
        }
      } else if (mode === 'login') {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast({
              title: 'Login Failed',
              description: 'Invalid email or password. Please try again.',
              variant: 'destructive',
            });
          } else if (error.message.includes('Email not confirmed')) {
            toast({
              title: 'Email Not Verified',
              description: 'Please check your email and verify your account first.',
              variant: 'destructive',
            });
          } else {
            toast({
              title: 'Login Failed',
              description: error.message,
              variant: 'destructive',
            });
          }
        } else {
          toast({
            title: 'Welcome back!',
            description: 'You have been logged in successfully.',
          });
        }
      } else {
        const { error } = await signUp(email, password, fullName);
        if (error) {
          if (error.message.includes('already registered')) {
            toast({
              title: 'Account Exists',
              description: 'This email is already registered. Please log in instead.',
              variant: 'destructive',
            });
          } else {
            toast({
              title: 'Sign Up Failed',
              description: error.message,
              variant: 'destructive',
            });
          }
        } else {
          toast({
            title: 'Check Your Email',
            description: 'We sent you a verification link. Please verify your email to continue.',
          });
          setMode('login');
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      const { error } = await lovable.auth.signInWithOAuth('google', {
        redirect_uri: window.location.origin,
      });
      if (error) {
        toast({
          title: 'Google Sign In Failed',
          description: error.message,
          variant: 'destructive',
        });
      }
    } catch (err: any) {
      toast({
        title: 'Error',
        description: 'Failed to sign in with Google',
        variant: 'destructive',
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const getModeTitle = () => {
    switch (mode) {
      case 'login': return 'Welcome Back';
      case 'signup': return 'Create Account';
      case 'forgot': return 'Reset Password';
    }
  };

  const getModeDescription = () => {
    switch (mode) {
      case 'login': return 'Sign in to access your dashboard';
      case 'signup': return 'Register to get started with CertifyChain';
      case 'forgot': return 'Enter your email and we\'ll send you a reset link';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-12">
        <div className="mx-auto max-w-md">
          <Card className="glass-card">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent">
                <Shield className="h-8 w-8 text-primary-foreground" />
              </div>
              <CardTitle className="text-2xl">{getModeTitle()}</CardTitle>
              <CardDescription>{getModeDescription()}</CardDescription>
            </CardHeader>
            <CardContent>
              {mode === 'forgot' && resetEmailSent ? (
                <div className="text-center space-y-4">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success/10">
                    <Mail className="h-6 w-6 text-success" />
                  </div>
                  <p className="text-muted-foreground">
                    Check your email for a password reset link. It may take a few minutes to arrive.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setMode('login');
                      setResetEmailSent(false);
                    }}
                    className="w-full"
                  >
                    Back to Sign In
                  </Button>
                </div>
              ) : (
                <>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {mode === 'signup' && (
                      <div>
                        <Label htmlFor="fullName">Full Name</Label>
                        <div className="relative mt-2">
                          <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="fullName"
                            placeholder="John Doe"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="pl-10"
                            disabled={isLoading}
                          />
                        </div>
                        {errors.fullName && (
                          <p className="text-sm text-destructive mt-1">{errors.fullName}</p>
                        )}
                      </div>
                    )}

                    <div>
                      <Label htmlFor="email">Email</Label>
                      <div className="relative mt-2">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="you@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-10"
                          disabled={isLoading}
                        />
                      </div>
                      {errors.email && (
                        <p className="text-sm text-destructive mt-1">{errors.email}</p>
                      )}
                    </div>

                    {mode !== 'forgot' && (
                      <div>
                        <Label htmlFor="password">Password</Label>
                        <div className="relative mt-2">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="pl-10 pr-10"
                            disabled={isLoading}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                        {errors.password && (
                          <p className="text-sm text-destructive mt-1">{errors.password}</p>
                        )}
                        {mode === 'login' && (
                          <button
                            type="button"
                            onClick={() => {
                              setMode('forgot');
                              setErrors({});
                            }}
                            className="text-sm text-primary hover:underline mt-1"
                          >
                            Forgot password?
                          </button>
                        )}
                      </div>
                    )}

                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {mode === 'login' ? 'Signing in...' : mode === 'signup' ? 'Creating account...' : 'Sending...'}
                        </>
                      ) : (
                        <>{mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Reset Link'}</>
                      )}
                    </Button>
                  </form>

                  {mode !== 'forgot' && (
                    <>
                      <div className="relative my-6">
                        <Separator />
                        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
                          or continue with
                        </span>
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        className="w-full gap-2"
                        onClick={handleGoogleSignIn}
                        disabled={isLoading || isGoogleLoading}
                      >
                        {isGoogleLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <svg className="h-4 w-4" viewBox="0 0 24 24">
                            <path
                              fill="currentColor"
                              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                              fill="currentColor"
                              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                              fill="currentColor"
                              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            />
                            <path
                              fill="currentColor"
                              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            />
                          </svg>
                        )}
                        Continue with Google
                      </Button>
                    </>
                  )}

                  <div className="mt-6 text-center">
                    {mode === 'forgot' ? (
                      <button
                        type="button"
                        onClick={() => {
                          setMode('login');
                          setErrors({});
                        }}
                        className="text-sm text-primary hover:underline font-medium"
                        disabled={isLoading}
                      >
                        Back to Sign In
                      </button>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
                        <button
                          type="button"
                          onClick={() => {
                            setMode(mode === 'login' ? 'signup' : 'login');
                            setErrors({});
                          }}
                          className="ml-1 text-primary hover:underline font-medium"
                          disabled={isLoading}
                        >
                          {mode === 'login' ? 'Sign up' : 'Sign in'}
                        </button>
                      </p>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
