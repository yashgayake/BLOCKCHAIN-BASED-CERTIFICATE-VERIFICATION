import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAppContext } from '@/contexts/AppContext';
import { useBlockchain } from '@/contexts/BlockchainContext';
import { useToast } from '@/hooks/use-toast';
import { Ban, Search, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export function RevokeCertificate() {
  const [searchHash, setSearchHash] = useState('');
  const [reason, setReason] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [foundCertificate, setFoundCertificate] = useState<any>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);
  const [revoked, setRevoked] = useState(false);

  const { getCertificateByHash, isRevoked: checkRevoked, revokeCertificate, getRevokedInfo } = useAppContext();
  const { walletAddress } = useBlockchain();
  const { toast } = useToast();

  const searchCertificate = async () => {
    if (!searchHash.trim()) {
      toast({
        title: "Error",
        description: "Please enter a certificate hash",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    setFoundCertificate(null);
    setRevoked(false);

    try {
      // Check local storage first
      const localCert = getCertificateByHash(searchHash);
      
      if (localCert) {
        const alreadyRevoked = checkRevoked(searchHash);
        if (alreadyRevoked) {
          const revokedInfo = getRevokedInfo(searchHash);
          setFoundCertificate({ ...localCert, revokedInfo });
          setRevoked(true);
        } else {
          setFoundCertificate(localCert);
        }
      } else {
        toast({
          title: "Not Found",
          description: "Certificate not found in records",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to search certificate",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleRevoke = async () => {
    if (!reason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for revocation",
        variant: "destructive",
      });
      return;
    }

    setIsRevoking(true);

    try {
      revokeCertificate(searchHash, reason, walletAddress || 'Unknown');
      
      toast({
        title: "✓ Certificate Revoked",
        description: "The certificate has been successfully revoked",
      });

      setRevoked(true);
      setShowConfirmDialog(false);
      setReason('');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to revoke certificate",
        variant: "destructive",
      });
    } finally {
      setIsRevoking(false);
    }
  };

  const resetSearch = () => {
    setSearchHash('');
    setFoundCertificate(null);
    setRevoked(false);
    setReason('');
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Ban className="h-5 w-5 text-destructive" />
          Revoke Certificate
        </CardTitle>
        <CardDescription>
          Search and revoke a certificate to mark it as invalid
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Search Section */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="hash">Certificate Hash</Label>
            <div className="flex gap-2 mt-2">
              <Input
                id="hash"
                placeholder="Enter certificate hash (0x...)"
                value={searchHash}
                onChange={(e) => setSearchHash(e.target.value)}
                className="font-mono"
              />
              <Button onClick={searchCertificate} disabled={isSearching} className="gap-2">
                <Search className="h-4 w-4" />
                {isSearching ? 'Searching...' : 'Search'}
              </Button>
            </div>
          </div>
        </div>

        {/* Found Certificate */}
        {foundCertificate && (
          <div className="space-y-4">
            {revoked ? (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertTitle>Certificate Already Revoked</AlertTitle>
                <AlertDescription>
                  <p>This certificate was revoked on {new Date(foundCertificate.revokedInfo?.revokedAt).toLocaleString()}</p>
                  <p className="mt-1"><strong>Reason:</strong> {foundCertificate.revokedInfo?.reason}</p>
                </AlertDescription>
              </Alert>
            ) : (
              <Alert>
                <CheckCircle className="h-4 w-4 text-success" />
                <AlertTitle>Certificate Found</AlertTitle>
                <AlertDescription>
                  This certificate is currently valid and can be revoked.
                </AlertDescription>
              </Alert>
            )}

            {/* Certificate Details */}
            <div className="rounded-lg border p-4 space-y-3 bg-muted/30">
              <h4 className="font-semibold">Certificate Details</h4>
              <div className="grid gap-2 sm:grid-cols-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Student Name:</span>
                  <p className="font-medium">{foundCertificate.studentName}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Enrollment Number:</span>
                  <p className="font-medium">{foundCertificate.enrollmentNumber}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Course:</span>
                  <p className="font-medium">{foundCertificate.course}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Institution:</span>
                  <p className="font-medium">{foundCertificate.institution}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Issue Year:</span>
                  <p className="font-medium">{foundCertificate.issueYear}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Issue Date:</span>
                  <p className="font-medium">{new Date(foundCertificate.issueDate).toLocaleDateString()}</p>
                </div>
              </div>
              <div>
                <span className="text-muted-foreground text-sm">Certificate Hash:</span>
                <p className="font-mono text-xs break-all bg-muted p-2 rounded mt-1">
                  {foundCertificate.certificateHash}
                </p>
              </div>
            </div>

            {/* Revoke Section */}
            {!revoked && (
              <div className="space-y-4 pt-4 border-t">
                <div>
                  <Label htmlFor="reason">Reason for Revocation *</Label>
                  <Textarea
                    id="reason"
                    placeholder="Enter the reason for revoking this certificate..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="mt-2"
                    rows={3}
                  />
                </div>

                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Warning</AlertTitle>
                  <AlertDescription>
                    This action cannot be undone. The certificate will be marked as revoked and will fail verification.
                  </AlertDescription>
                </Alert>

                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    onClick={() => setShowConfirmDialog(true)}
                    disabled={!reason.trim()}
                    className="gap-2"
                  >
                    <Ban className="h-4 w-4" />
                    Revoke Certificate
                  </Button>
                  <Button variant="outline" onClick={resetSearch}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {revoked && (
              <Button variant="outline" onClick={resetSearch} className="w-full">
                Search Another Certificate
              </Button>
            )}
          </div>
        )}

        {/* Confirmation Dialog */}
        <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Confirm Revocation
              </AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to revoke this certificate? This action cannot be undone.
                <br /><br />
                <strong>Student:</strong> {foundCertificate?.studentName}<br />
                <strong>Reason:</strong> {reason}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleRevoke}
                disabled={isRevoking}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isRevoking ? 'Revoking...' : 'Yes, Revoke Certificate'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
