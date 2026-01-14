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
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-background" />
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-accent/10 blur-3xl" />
        
        <div className="container relative py-24 md:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/50 bg-card/50 px-4 py-2 text-sm backdrop-blur-sm">
              <Shield className="h-4 w-4 text-primary" />
              <span>Blockchain-Powered Certificate Verification</span>
            </div>
            
            <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-6xl">
              <span className="gradient-text">CertChain</span>
              <br />
              <span className="text-foreground">Certificate Verification</span>
            </h1>
            
            <p className="mb-8 text-lg text-muted-foreground md:text-xl">
              A decentralized, tamper-proof system for issuing and verifying academic certificates 
              using Ethereum blockchain and MetaMask wallet integration.
            </p>
            
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button asChild size="lg" className="gap-2">
                <Link to="/verify">
                  Verify Certificate
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="gap-2">
                <Link to="/admin">
                  <Shield className="h-4 w-4" />
                  Admin Access
                </Link>
              </Button>
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
      <section className="py-16">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Access Portals</h2>
            <p className="text-muted-foreground">
              Choose your portal to access the certificate verification system
            </p>
          </div>
          
          <div className="grid gap-6 md:grid-cols-3">
            {portals.map((portal, index) => {
              const Icon = portal.icon;
              return (
                <Link key={index} to={portal.to} className="group">
                  <Card className="glass-card h-full border-border/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                    <CardHeader>
                      <div className={`mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${portal.color}`}>
                        <Icon className="h-8 w-8 text-primary-foreground" />
                      </div>
                      <CardTitle className="text-xl flex items-center gap-2">
                        {portal.title}
                        <ArrowRight className="h-4 w-4 opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-1" />
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-base">
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
      <footer className="border-t border-border/50 bg-card/30 py-8">
        <div className="container text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Shield className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold">CertChain</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Final Year Project - Blockchain Based Certificate Verification System
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Powered by Ethereum Blockchain • MetaMask • Ganache
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
