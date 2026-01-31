import { Link } from 'react-router-dom';
import { Shield, ArrowRight, CheckCircle2, Lock, Zap, GraduationCap, Users, FileCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Navbar } from '@/components/Navbar';

const Index = () => {
  const features = [
    {
      icon: Lock,
      title: 'Blockchain Security',
      description: 'Certificates are stored on immutable blockchain, ensuring tamper-proof verification.'
    },
    {
      icon: Zap,
      title: 'Instant Verification',
      description: 'Verify any certificate in seconds using hash, QR code, or document upload.'
    },
    {
      icon: CheckCircle2,
      title: 'AI-Powered Extraction',
      description: 'Gemini AI automatically extracts certificate details from uploaded documents.'
    }
  ];

  const portals = [
    {
      to: '/admin',
      icon: Shield,
      title: 'Admin Portal',
      description: 'Issue certificates, register students, and manage records on the blockchain.',
      color: 'from-primary to-accent'
    },
    {
      to: '/student',
      icon: GraduationCap,
      title: 'Student Portal',
      description: 'View and download your issued certificates with verification QR codes.',
      color: 'from-success to-primary'
    },
    {
      to: '/verify',
      icon: FileCheck,
      title: 'Verify Certificate',
      description: 'Public verification portal - verify any certificate authenticity instantly.',
      color: 'from-accent to-warning'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/5 to-background" />
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-primary/20 blur-3xl animate-float" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-accent/20 blur-3xl animate-float" style={{ animationDelay: '-3s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-64 w-64 rounded-full bg-success/10 blur-3xl animate-float" style={{ animationDelay: '-1.5s' }} />
        
        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.1)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.1)_1px,transparent_1px)] bg-[size:4rem_4rem]" />
        
        <div className="container relative py-28 md:py-40">
          <div className="mx-auto max-w-4xl text-center">
            {/* Badge */}
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-5 py-2.5 text-sm font-medium backdrop-blur-sm animate-glow">
              <Shield className="h-4 w-4 text-primary" />
              <span className="text-foreground">Blockchain-Powered Certificate Verification</span>
            </div>
            
            {/* Hero Title */}
            <h1 className="mb-8 text-5xl font-bold tracking-tight md:text-7xl">
              <span className="gradient-text">CertChain</span>
              <br />
              <span className="text-foreground">Certificate Verification</span>
            </h1>
            
            {/* Description */}
            <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground md:text-xl leading-relaxed">
              A decentralized, tamper-proof system for issuing and verifying academic certificates 
              using Ethereum blockchain and MetaMask wallet integration.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button asChild size="lg" className="gap-2 h-12 px-8 text-base shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all">
                <Link to="/verify">
                  Verify Certificate
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="gap-2 h-12 px-8 text-base border-2 hover:bg-accent/10">
                <Link to="/admin">
                  <Shield className="h-5 w-5" />
                  Admin Access
                </Link>
              </Button>
            </div>

            {/* Stats */}
            <div className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">100%</div>
                <div className="text-sm text-muted-foreground">Secure</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">24/7</div>
                <div className="text-sm text-muted-foreground">Verification</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">∞</div>
                <div className="text-sm text-muted-foreground">Immutable</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-y border-border/50 bg-card/30 py-16">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why CertChain?</h2>
            <p className="text-muted-foreground">
              Built on Ethereum blockchain with enterprise-grade security features
            </p>
          </div>
          
          <div className="grid gap-6 md:grid-cols-3">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="glass-card border-border/50">
                  <CardHeader>
                    <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Portals Section */}
      <section className="py-20 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
        <div className="container relative">
          <div className="mx-auto max-w-2xl text-center mb-14">
            <h2 className="text-3xl font-bold mb-4 md:text-4xl">Access Portals</h2>
            <p className="text-muted-foreground text-lg">
              Choose your portal to access the certificate verification system
            </p>
          </div>
          
          <div className="grid gap-8 md:grid-cols-3">
            {portals.map((portal, index) => {
              const Icon = portal.icon;
              return (
                <Link key={index} to={portal.to} className="group">
                  <Card className="glass-card h-full border-border/30 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 hover:border-primary/30 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <CardHeader className="relative">
                      <div className={`mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br ${portal.color} shadow-xl shadow-primary/20 transition-transform group-hover:scale-110 group-hover:rotate-3`}>
                        <Icon className="h-10 w-10 text-primary-foreground" />
                      </div>
                      <CardTitle className="text-2xl flex items-center gap-2">
                        {portal.title}
                        <ArrowRight className="h-5 w-5 opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="relative">
                      <CardDescription className="text-base leading-relaxed">
                        {portal.description}
                      </CardDescription>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/30 bg-card/50 py-10">
        <div className="container text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg">
              <Shield className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold gradient-text">CertChain</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Final Year Project - Blockchain Based Certificate Verification System
          </p>
          <p className="text-xs text-muted-foreground mt-3 flex items-center justify-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-success animate-pulse" />
            Powered by Ethereum Blockchain • MetaMask • Ganache
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
