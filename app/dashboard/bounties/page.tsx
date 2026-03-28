'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Briefcase, 
  Users, 
  DollarSign, 
  ArrowRight,
  Loader2,
  Inbox,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Mail,
  Calendar
} from 'lucide-react';
import { formatDistanceToNow } from '@/lib/utils';

interface BountyWithApplications {
  id: string;
  title: string;
  budget: number;
  status: string;
  applicants: number;
  created_at: string;
  applications: Application[];
}

interface Application {
  id: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';
  proposal: string;
  proposed_budget: number;
  timeline: number;
  created_at: string;
  applicant: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  };
}

export default function BountyManagementPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [bounties, setBounties] = useState<BountyWithApplications[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }

    if (session?.user) {
      fetchBountiesWithApplications();
    }
  }, [session, status]);

  const fetchBountiesWithApplications = async () => {
    try {
      // First fetch user's bounties
      const bountiesResponse = await fetch('/api/bounties?creator=true');
      const bountiesData = await bountiesResponse.json();
      
      if (bountiesData.data) {
        // For each bounty, fetch its applications
        const bountiesWithApps = await Promise.all(
          bountiesData.data.map(async (bounty: any) => {
            const appsResponse = await fetch(`/api/applications?bountyId=${bounty.id}`);
            const appsData = await appsResponse.json();
            return {
              ...bounty,
              applications: appsData.data || [],
            };
          })
        );
        setBounties(bountiesWithApps);
      }
    } catch (error) {
      console.error('Error fetching bounties:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplicationAction = async (applicationId: string, action: 'accept' | 'reject') => {
    try {
      const response = await fetch(`/api/applications?id=${applicationId}&action=${action}`, {
        method: 'PUT',
      });

      if (response.ok) {
        fetchBountiesWithApplications();
        setSelectedApplication(null);
      }
    } catch (error) {
      console.error('Error updating application:', error);
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

  const allApplications = bounties.flatMap(b => 
    b.applications.map(a => ({ ...a, bountyTitle: b.title, bountyId: b.id }))
  );

  const pendingApplications = allApplications.filter(a => a.status === 'PENDING');

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

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">My Bounties</h1>
              <p className="text-muted-foreground mt-1">
                Manage your bounties and review applications
              </p>
            </div>
            <Button asChild>
              <Link href="/bounties/new">Post New Bounty</Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-primary" />
                  <span className="text-2xl font-bold">{bounties.length}</span>
                </div>
                <p className="text-sm text-muted-foreground">Active Bounties</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-yellow-500" />
                  <span className="text-2xl font-bold">{pendingApplications.length}</span>
                </div>
                <p className="text-sm text-muted-foreground">Pending Applications</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span className="text-2xl font-bold">
                    {allApplications.filter(a => a.status === 'ACCEPTED').length}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">Accepted</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  <span className="text-2xl font-bold">
                    ${bounties.reduce((sum, b) => sum + (b.budget || 0), 0).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">Total Budget</p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="bounties" className="space-y-6">
            <TabsList>
              <TabsTrigger value="bounties">My Bounties</TabsTrigger>
              <TabsTrigger value="applications">
                Applications ({pendingApplications.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="bounties" className="space-y-4">
              {bounties.length === 0 ? (
                <EmptyState 
                  message="No bounties posted yet"
                  action={{ label: 'Post Your First Bounty', href: '/bounties/new' }}
                />
              ) : (
                bounties.map(bounty => (
                  <Card key={bounty.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold line-clamp-1">
                              {bounty.title}
                            </h3>
                            <Badge className={getStatusColor(bounty.status)}>
                              {bounty.status}
                            </Badge>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-4 w-4" />
                              Budget: ${bounty.budget?.toLocaleString()}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              {bounty.applications.filter(a => a.status === 'PENDING').length} pending applications
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              Posted {formatDistanceToNow(new Date(bounty.created_at))} ago
                            </span>
                          </div>

                          {bounty.applications.filter(a => a.status === 'PENDING').length > 0 && (
                            <div className="bg-yellow-500/10 rounded-lg p-3 mb-4">
                              <p className="text-sm text-yellow-700 dark:text-yellow-400">
                                <Clock className="inline h-4 w-4 mr-1" />
                                You have {bounty.applications.filter(a => a.status === 'PENDING').length} pending application(s) to review
                              </p>
                            </div>
                          )}
                        </div>

                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/bounties/${bounty.id}`}>
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>

                      {/* Applications Preview */}
                      {bounty.applications.filter(a => a.status === 'PENDING').length > 0 && (
                        <div className="mt-4 pt-4 border-t border-border">
                          <h4 className="text-sm font-medium mb-3">Recent Applications</h4>
                          <div className="space-y-2">
                            {bounty.applications
                              .filter(a => a.status === 'PENDING')
                              .slice(0, 3)
                              .map(app => (
                                <div 
                                  key={app.id}
                                  className="flex items-center justify-between p-3 bg-muted rounded-lg cursor-pointer hover:bg-muted/80"
                                  onClick={() => setSelectedApplication(app)}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                      <User className="h-4 w-4 text-primary" />
                                    </div>
                                    <div>
                                      <p className="font-medium text-sm">
                                        {app.applicant.name || 'Anonymous'}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        Proposed: ${app.proposed_budget.toLocaleString()} • {app.timeline} days
                                      </p>
                                    </div>
                                  </div>
                                  <Badge variant="outline">View</Badge>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="applications" className="space-y-4">
              {pendingApplications.length === 0 ? (
                <EmptyState message="No pending applications to review" />
              ) : (
                pendingApplications.map(app => (
                  <Card key={app.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-muted-foreground mb-1">
                            Application for: {app.bountyTitle}
                          </p>
                          <div className="flex items-center gap-2 mb-3">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <User className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{app.applicant.name || 'Anonymous'}</p>
                              <p className="text-xs text-muted-foreground">{app.applicant.email}</p>
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-3">
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-4 w-4" />
                              Proposed: ${app.proposed_budget.toLocaleString()}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              Timeline: {app.timeline} days
                            </span>
                            <span>
                              Applied {formatDistanceToNow(new Date(app.created_at))} ago
                            </span>
                          </div>

                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {app.proposal}
                          </p>
                        </div>

                        <div className="flex gap-2 ml-4">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => setSelectedApplication(app)}
                          >
                            View
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />

      {/* Application Detail Dialog */}
      <Dialog 
        open={selectedApplication !== null} 
        onOpenChange={() => setSelectedApplication(null)}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Application Details</DialogTitle>
          </DialogHeader>
          
          {selectedApplication && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-lg">
                    {selectedApplication.applicant.name || 'Anonymous'}
                  </p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {selectedApplication.applicant.email}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">Proposed Budget</p>
                    <p className="text-xl font-bold">
                      ${selectedApplication.proposed_budget.toLocaleString()}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">Timeline</p>
                    <p className="text-xl font-bold">{selectedApplication.timeline} days</p>
                  </CardContent>
                </Card>
              </div>

              <div>
                <h4 className="font-medium mb-2">Proposal</h4>
                <div className="bg-muted p-4 rounded-lg text-sm whitespace-pre-wrap">
                  {selectedApplication.proposal}
                </div>
              </div>

              {selectedApplication.status === 'PENDING' && (
                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleApplicationAction(selectedApplication.id, 'reject')}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() => handleApplicationAction(selectedApplication.id, 'accept')}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Accept
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EmptyState({ message, action }: { message: string; action?: { label: string; href: string } }) {
  return (
    <div className="text-center py-12">
      <Inbox className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
      <h3 className="text-lg font-medium text-foreground mb-2">{message}</h3>
      {action && (
        <Button asChild>
          <Link href={action.href}>{action.label}</Link>
        </Button>
      )}
    </div>
  );
}
