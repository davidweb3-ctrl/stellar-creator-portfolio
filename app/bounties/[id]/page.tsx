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
import { Separator } from '@/components/ui/separator';
import { BountyApplicationForm } from '@/components/bounty-application-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  ArrowLeft, 
  Calendar, 
  DollarSign, 
  Tag, 
  User, 
  CheckCircle2,
  Clock,
  Users,
  MapPin,
  Share2,
  Flag
} from 'lucide-react';
import { formatDistanceToNow } from '@/lib/utils';

interface BountyDetailPageProps {
  params: { id: string };
}

export default function BountyDetailPage({ params }: BountyDetailPageProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [bounty, setBounty] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [hasApplied, setHasApplied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showApplyDialog, setShowApplyDialog] = useState(false);

  useEffect(() => {
    fetchBounty();
  }, [params.id]);

  const fetchBounty = async () => {
    try {
      const response = await fetch(`/api/bounties?id=${params.id}`);
      const data = await response.json();
      
      if (data.data) {
        // Handle both array and single object responses
        const bountyData = Array.isArray(data.data) 
          ? data.data.find((b: any) => b.id === params.id)
          : data.data;
        setBounty(bountyData);
      }

      // Check if user has already applied
      if (session?.user) {
        const appResponse = await fetch(`/api/applications?bountyId=${params.id}`);
        const appData = await appResponse.json();
        if (appData.data && appData.data.length > 0) {
          setHasApplied(true);
          setApplications(appData.data);
        }
      }
    } catch (error) {
      console.error('Error fetching bounty:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    const colors: Record<string, string> = {
      beginner: 'bg-green-500/20 text-green-700 dark:text-green-400',
      intermediate: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400',
      advanced: 'bg-orange-500/20 text-orange-700 dark:text-orange-400',
      expert: 'bg-red-500/20 text-red-700 dark:text-red-400',
    };
    return colors[difficulty] || 'bg-gray-500/20 text-gray-700 dark:text-gray-400';
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      OPEN: 'bg-green-500/20 text-green-700 dark:text-green-400',
      IN_PROGRESS: 'bg-blue-500/20 text-blue-700 dark:text-blue-400',
      COMPLETED: 'bg-gray-500/20 text-gray-700 dark:text-gray-400',
      CANCELLED: 'bg-red-500/20 text-red-700 dark:text-red-400',
    };
    return colors[status] || 'bg-gray-500/20 text-gray-700 dark:text-gray-400';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!bounty) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Bounty Not Found</h1>
            <p className="text-muted-foreground mb-4">This bounty may have been removed or doesn&apos;t exist.</p>
            <Button asChild>
              <Link href="/bounties">Browse Bounties</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const daysLeft = Math.ceil((new Date(bounty.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-grow">
        {/* Back Navigation */}
        <div className="border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/bounties">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Bounties
              </Link>
            </Button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Header */}
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <Badge variant="secondary">{bounty.category}</Badge>
                  <Badge className={getDifficultyColor(bounty.difficulty)}>
                    {bounty.difficulty}
                  </Badge>
                  <Badge className={getStatusColor(bounty.status)}>
                    {bounty.status}
                  </Badge>
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                  {bounty.title}
                </h1>
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Posted {formatDistanceToNow(new Date(bounty.posted_date || bounty.createdAt))} ago
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {bounty.applicants || 0} applications
                  </span>
                </div>
              </div>

              <Separator />

              {/* Description */}
              <div>
                <h2 className="text-xl font-semibold mb-3">Description</h2>
                <div className="prose prose-sm max-w-none text-muted-foreground">
                  {bounty.description}
                </div>
              </div>

              {/* Requirements */}
              {bounty.required_skills && bounty.required_skills.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold mb-3">Required Skills</h2>
                  <div className="flex flex-wrap gap-2">
                    {bounty.required_skills.map((skill: string) => (
                      <Badge key={skill} variant="outline">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Deliverables */}
              {bounty.deliverables && (
                <div>
                  <h2 className="text-xl font-semibold mb-3">Deliverables</h2>
                  <p className="text-muted-foreground">{bounty.deliverables}</p>
                </div>
              )}

              {/* Tags */}
              {bounty.tags && bounty.tags.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold mb-3">Tags</h2>
                  <div className="flex flex-wrap gap-2">
                    {bounty.tags.map((tag: string) => (
                      <Badge key={tag} variant="secondary">
                        <Tag className="h-3 w-3 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Action Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Bounty Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Budget</span>
                    <span className="text-2xl font-bold text-foreground">
                      ${bounty.budget?.toLocaleString()}
                    </span>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      Deadline
                    </span>
                    <span className={`font-medium ${daysLeft < 3 ? 'text-red-500' : ''}`}>
                      {daysLeft > 0 ? `${daysLeft} days left` : 'Expired'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      Applications
                    </span>
                    <span className="font-medium">{bounty.applicants || 0}</span>
                  </div>

                  <Separator />

                  {session?.user ? (
                    hasApplied ? (
                      <div className="text-center p-4 bg-green-500/10 rounded-lg">
                        <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
                        <p className="text-green-700 dark:text-green-400 font-medium">
                          You&apos;ve applied!
                        </p>
                        <Button 
                          variant="link" 
                          size="sm" 
                          onClick={() => router.push('/dashboard/applications')}
                        >
                          View Application
                        </Button>
                      </div>
                    ) : bounty.status === 'OPEN' ? (
                      <Button 
                        className="w-full" 
                        size="lg"
                        onClick={() => setShowApplyDialog(true)}
                      >
                        Apply Now
                      </Button>
                    ) : (
                      <Button className="w-full" size="lg" disabled>
                        Not Accepting Applications
                      </Button>
                    )
                  ) : (
                    <Button className="w-full" size="lg" asChild>
                      <Link href="/auth/signin">Sign In to Apply</Link>
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Client Info */}
              {bounty.creator && (
                <Card>
                  <CardHeader>
                    <CardTitle>About the Client</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{bounty.creator.name || 'Anonymous'}</p>
                        <p className="text-sm text-muted-foreground">{bounty.creator.email}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* Apply Dialog */}
      <Dialog open={showApplyDialog} onOpenChange={setShowApplyDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Apply for Bounty</DialogTitle>
          </DialogHeader>
          <BountyApplicationForm
            bountyId={bounty.id}
            bountyTitle={bounty.title}
            bountyBudget={bounty.budget}
            onSuccess={() => {
              setShowApplyDialog(false);
              fetchBounty();
            }}
            onCancel={() => setShowApplyDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
