'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Briefcase, 
  Clock, 
  DollarSign, 
  ArrowRight,
  Loader2,
  Inbox,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { formatDistanceToNow } from '@/lib/utils';

interface Application {
  id: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';
  proposal: string;
  proposed_budget: number;
  timeline: number;
  created_at: string;
  bounty: {
    id: string;
    title: string;
    budget: number;
    status: string;
  };
}

export default function ApplicationsDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }

    if (session?.user) {
      fetchApplications();
    }
  }, [session, status]);

  const fetchApplications = async () => {
    try {
      const response = await fetch('/api/applications');
      const data = await response.json();
      if (data.data) {
        setApplications(data.data);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACCEPTED':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'REJECTED':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'WITHDRAWN':
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACCEPTED':
        return 'bg-green-500/20 text-green-700 dark:text-green-400';
      case 'REJECTED':
        return 'bg-red-500/20 text-red-700 dark:text-red-400';
      case 'WITHDRAWN':
        return 'bg-gray-500/20 text-gray-700 dark:text-gray-400';
      default:
        return 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400';
    }
  };

  const filterApplications = (status: string) => {
    if (status === 'all') return applications;
    return applications.filter(app => app.status === status);
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  const ApplicationCard = ({ application }: { application: Application }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Link 
                href={`/bounties/${application.bounty.id}`}
                className="text-lg font-semibold hover:text-primary transition-colors line-clamp-1"
              >
                {application.bounty.title}
              </Link>
            </div>
            
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
              <span className="flex items-center gap-1">
                <DollarSign className="h-4 w-4" />
                Proposed: ${application.proposed_budget.toLocaleString()}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Timeline: {application.timeline} days
              </span>
              <span>
                Applied {formatDistanceToNow(new Date(application.created_at))} ago
              </span>
            </div>

            <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
              {application.proposal}
            </p>

            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(application.status)}>
                {getStatusIcon(application.status)}
                <span className="ml-1">{application.status}</span>
              </Badge>
              
              {application.status === 'PENDING' && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={async () => {
                    const response = await fetch(`/api/applications?id=${application.id}&action=withdraw`, {
                      method: 'PUT',
                    });
                    if (response.ok) {
                      fetchApplications();
                    }
                  }}
                >
                  Withdraw
                </Button>
              )}
            </div>
          </div>

          <Button variant="ghost" size="sm" asChild>
            <Link href={`/bounties/${application.bounty.id}`}>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">My Applications</h1>
            <p className="text-muted-foreground mt-1">
              Track and manage your bounty applications
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-primary" />
                  <span className="text-2xl font-bold">{applications.length}</span>
                </div>
                <p className="text-sm text-muted-foreground">Total Applications</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-yellow-500" />
                  <span className="text-2xl font-bold">
                    {applications.filter(a => a.status === 'PENDING').length}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">Pending</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span className="text-2xl font-bold">
                    {applications.filter(a => a.status === 'ACCEPTED').length}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">Accepted</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-red-500" />
                  <span className="text-2xl font-bold">
                    {applications.filter(a => a.status === 'REJECTED' || a.status === 'WITHDRAWN').length}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">Closed</p>
              </CardContent>
            </Card>
          </div>

          {/* Applications List */}
          <Tabs defaultValue="all" className="space-y-6">
            <TabsList>
              <TabsTrigger value="all">All ({applications.length})</TabsTrigger>
              <TabsTrigger value="pending">
                Pending ({filterApplications('PENDING').length})
              </TabsTrigger>
              <TabsTrigger value="accepted">
                Accepted ({filterApplications('ACCEPTED').length})
              </TabsTrigger>
              <TabsTrigger value="closed">
                Closed ({filterApplications('REJECTED').length + filterApplications('WITHDRAWN').length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              {applications.length === 0 ? (
                <EmptyState />
              ) : (
                applications.map(app => (
                  <ApplicationCard key={app.id} application={app} />
                ))
              )}
            </TabsContent>

            <TabsContent value="pending" className="space-y-4">
              {filterApplications('PENDING').length === 0 ? (
                <EmptyState message="No pending applications" />
              ) : (
                filterApplications('PENDING').map(app => (
                  <ApplicationCard key={app.id} application={app} />
                ))
              )}
            </TabsContent>

            <TabsContent value="accepted" className="space-y-4">
              {filterApplications('ACCEPTED').length === 0 ? (
                <EmptyState message="No accepted applications yet" />
              ) : (
                filterApplications('ACCEPTED').map(app => (
                  <ApplicationCard key={app.id} application={app} />
                ))
              )}
            </TabsContent>

            <TabsContent value="closed" className="space-y-4">
              {filterApplications('REJECTED').length + filterApplications('WITHDRAWN').length === 0 ? (
                <EmptyState message="No closed applications" />
              ) : (
                [...filterApplications('REJECTED'), ...filterApplications('WITHDRAWN')].map(app => (
                  <ApplicationCard key={app.id} application={app} />
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function EmptyState({ message = "No applications yet" }: { message?: string }) {
  return (
    <div className="text-center py-12">
      <Inbox className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
      <h3 className="text-lg font-medium text-foreground mb-2">{message}</h3>
      <p className="text-muted-foreground mb-4">
        Browse available bounties and start applying!
      </p>
      <Button asChild>
        <Link href="/bounties">Browse Bounties</Link>
      </Button>
    </div>
  );
}
