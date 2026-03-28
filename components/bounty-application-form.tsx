'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';
import { CheckCircle, AlertCircle, DollarSign, Clock } from 'lucide-react';

interface BountyApplicationFormProps {
  bountyId: string;
  bountyTitle: string;
  bountyBudget: number;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function BountyApplicationForm({
  bountyId,
  bountyTitle,
  bountyBudget,
  onSuccess,
  onCancel,
}: BountyApplicationFormProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    proposal: '',
    proposedBudget: bountyBudget,
    timeline: 7,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session?.user) {
      setError('Please sign in to apply for this bounty');
      return;
    }

    if (!formData.proposal.trim()) {
      setError('Please provide a proposal description');
      return;
    }

    if (formData.proposedBudget <= 0) {
      setError('Proposed budget must be greater than 0');
      return;
    }

    if (formData.timeline <= 0) {
      setError('Timeline must be at least 1 day');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bountyId,
          proposal: formData.proposal,
          proposedBudget: formData.proposedBudget,
          timeline: formData.timeline,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit application');
      }

      setSuccess(true);
      onSuccess?.();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <CheckCircle className="h-12 w-12 text-green-500" />
            <div>
              <h3 className="text-lg font-semibold">Application Submitted!</h3>
              <p className="text-muted-foreground">
                Your application for &quot;{bountyTitle}&quot; has been submitted successfully.
                The client will review your proposal and get back to you soon.
              </p>
            </div>
            <Button onClick={onSuccess}>View My Applications</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Apply for Bounty</CardTitle>
        <CardDescription>
          Submit your proposal for &quot;{bountyTitle}&quot;
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="proposal">
              Your Proposal <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="proposal"
              placeholder="Describe your approach, experience, and why you're the best fit for this bounty..."
              value={formData.proposal}
              onChange={(e) => setFormData({ ...formData, proposal: e.target.value })}
              rows={6}
              required
            />
            <p className="text-xs text-muted-foreground">
              Be specific about your approach, timeline, and relevant experience.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="budget">
                <DollarSign className="inline h-4 w-4 mr-1" />
                Proposed Budget (USD)
              </Label>
              <Input
                id="budget"
                type="number"
                min={1}
                value={formData.proposedBudget}
                onChange={(e) => setFormData({ ...formData, proposedBudget: parseInt(e.target.value) || 0 })}
                required
              />
              <p className="text-xs text-muted-foreground">
                Original budget: ${bountyBudget.toLocaleString()}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timeline">
                <Clock className="inline h-4 w-4 mr-1" />
                Timeline (days)
              </Label>
              <Input
                id="timeline"
                type="number"
                min={1}
                value={formData.timeline}
                onChange={(e) => setFormData({ ...formData, timeline: parseInt(e.target.value) || 0 })}
                required
              />
              <p className="text-xs text-muted-foreground">
                Estimated completion time
              </p>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Submitting...
                </>
              ) : (
                'Submit Application'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
