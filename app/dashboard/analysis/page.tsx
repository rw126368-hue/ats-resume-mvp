'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useResumes } from '@/hooks/useResumes';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api/client';
import { 
  BarChart3, 
  FileText, 
  Brain, 
  Target, 
  CheckCircle, 
  AlertCircle, 
  XCircle,
  Loader2,
  Download,
  RefreshCw,
  Eye
} from 'lucide-react';
import { getScoreColor } from '@/lib/utils';

interface AnalysisResult {
  ats_score: number;
  skills_match: string[];
  missing_keywords: string[];
  recommendations: string[];
  strengths: string[];
  weaknesses: string[];
  overall_feedback: string;
}

export default function AnalysisPage() {
  const searchParams = useSearchParams();
  const resumeId = searchParams?.get('resume');
  
  const { resumes, fetchResumes } = useResumes();
  const { toast } = useToast();
  
  const [selectedResumeId, setSelectedResumeId] = useState<string>(resumeId || '');
  const [jobDescription, setJobDescription] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [analysisHistory, setAnalysisHistory] = useState<any[]>([]);

  useEffect(() => {
    if (resumes.length === 0) {
      fetchResumes();
    }
  }, [resumes.length, fetchResumes]);

  useEffect(() => {
    if (resumeId && resumes.length > 0) {
      setSelectedResumeId(resumeId);
    }
  }, [resumeId, resumes]);

  const selectedResume = resumes.find(r => r.id === selectedResumeId);

  const handleAnalyze = async () => {
    if (!selectedResumeId) {
      toast({
        title: 'No Resume Selected',
        description: 'Please select a resume to analyze',
        variant: 'destructive',
      });
      return;
    }

    setAnalyzing(true);
    setAnalysisResult(null);
    
    try {
      const response = await apiClient.analyzeResume(selectedResumeId, jobDescription || undefined);
      
      if (response.error) {
        throw new Error(response.error.message);
      }

      const result = response.data;
      setAnalysisResult(result);
      
      // Add to history
      const newAnalysis = {
        id: Date.now(),
        resume_title: selectedResume?.title || 'Unknown Resume',
        job_description: jobDescription || 'General Analysis',
        result,
        analyzed_at: new Date().toISOString()
      };
      
      setAnalysisHistory(prev => [newAnalysis, ...prev.slice(0, 4)]); // Keep last 5
      
      toast({
        title: 'Analysis Complete',
        description: `ATS Score: ${result.ats_score}%`,
      });
    } catch (error: any) {
      toast({
        title: 'Analysis Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const getScoreLevel = (score: number) => {
    if (score >= 80) return { level: 'Excellent', icon: CheckCircle, color: 'text-green-600' };
    if (score >= 60) return { level: 'Good', icon: AlertCircle, color: 'text-yellow-600' };
    return { level: 'Needs Improvement', icon: XCircle, color: 'text-red-600' };
  };

  const ScoreDisplay = ({ score }: { score: number }) => {
    const scoreLevel = getScoreLevel(score);
    const Icon = scoreLevel.icon;
    
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center">
            <BarChart3 className="mr-2 h-5 w-5" />
            ATS Compatibility Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="text-4xl font-bold text-primary">{score}%</div>
              <div className="flex items-center space-x-2">
                <Icon className={`h-5 w-5 ${scoreLevel.color}`} />
                <span className={`text-sm font-medium ${scoreLevel.color}`}>
                  {scoreLevel.level}
                </span>
              </div>
            </div>
          </div>
          <Progress value={score} className="w-full" />
          <p className="text-sm text-muted-foreground mt-2">
            Your resume scores {score}% for ATS compatibility
          </p>
        </CardContent>
      </Card>
    );
  };

  const RecommendationsCard = ({ title, items, icon: Icon, variant = 'default' }: {
    title: string;
    items: string[];
    icon: any;
    variant?: 'default' | 'success' | 'warning' | 'destructive';
  }) => {
    const getVariantColors = () => {
      switch (variant) {
        case 'success': return 'text-green-600 bg-green-50';
        case 'warning': return 'text-yellow-600 bg-yellow-50';
        case 'destructive': return 'text-red-600 bg-red-50';
        default: return 'text-blue-600 bg-blue-50';
      }
    };
    
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center">
            <Icon className="mr-2 h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {items.length > 0 ? (
            <ul className="space-y-2">
              {items.map((item, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <div className={`w-2 h-2 rounded-full mt-2 ${getVariantColors().split(' ')[1]}`} />
                  <span className="text-sm">{item}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No items to display</p>
          )}
        </CardContent>
      </Card>
    );
  };

  if (resumes.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">AI Resume Analysis</h2>
          <p className="text-muted-foreground">
            Get AI-powered insights to optimize your resume for ATS systems
          </p>
        </div>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No resumes available
              </h3>
              <p className="text-gray-500 mb-6">
                Upload a resume first to start analyzing it
              </p>
              <Button>
                Upload Resume
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">AI Resume Analysis</h2>
        <p className="text-muted-foreground">
          Get AI-powered insights to optimize your resume for ATS systems
        </p>
      </div>

      {/* Analysis Form */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Brain className="mr-2 h-5 w-5" />
                Resume Analysis
              </CardTitle>
              <CardDescription>
                Select a resume and optionally provide a job description for targeted analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="resume-select">Select Resume</Label>
                <select
                  id="resume-select"
                  value={selectedResumeId}
                  onChange={(e) => setSelectedResumeId(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                >
                  <option value="">Choose a resume...</option>
                  {resumes.map((resume) => (
                    <option key={resume.id} value={resume.id}>
                      {resume.title} (Version {resume.version})
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <Label htmlFor="job-description">Job Description (Optional)</Label>
                <Textarea
                  id="job-description"
                  placeholder="Paste the job description here for targeted analysis..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  rows={6}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Adding a job description will provide more targeted recommendations
                </p>
              </div>
              
              <Button 
                onClick={handleAnalyze} 
                disabled={analyzing || !selectedResumeId}
                className="w-full"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing Resume...
                  </>
                ) : (
                  <>
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Analyze Resume
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
        
        {/* Quick Stats */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Resumes</span>
                  <span className="text-sm font-medium">{resumes.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Analyses Run</span>
                  <span className="text-sm font-medium">{analysisHistory.length}</span>
                </div>
                {selectedResume && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground mb-1">Selected Resume:</p>
                    <p className="text-sm font-medium">{selectedResume.title}</p>
                    {selectedResume.ats_score && (
                      <p className="text-xs text-muted-foreground">
                        Last Score: <span className={getScoreColor(selectedResume.ats_score)}>
                          {selectedResume.ats_score}%
                        </span>
                      </p>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Analysis Results */}
      {analysisResult && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">Analysis Results</h3>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export Report
              </Button>
              <Button variant="outline" size="sm" onClick={handleAnalyze}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Re-analyze
              </Button>
            </div>
          </div>
          
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-6">
              <ScoreDisplay score={analysisResult.ats_score} />
              
              <RecommendationsCard
                title="Strengths"
                items={analysisResult.strengths || []}
                icon={CheckCircle}
                variant="success"
              />
              
              <RecommendationsCard
                title="Skills Matched"
                items={analysisResult.skills_match || []}
                icon={Target}
                variant="success"
              />
            </div>
            
            <div className="space-y-6">
              <RecommendationsCard
                title="Areas for Improvement"
                items={analysisResult.weaknesses || []}
                icon={AlertCircle}
                variant="warning"
              />
              
              <RecommendationsCard
                title="Missing Keywords"
                items={analysisResult.missing_keywords || []}
                icon={XCircle}
                variant="destructive"
              />
              
              <RecommendationsCard
                title="Recommendations"
                items={analysisResult.recommendations || []}
                icon={Brain}
              />
            </div>
          </div>
          
          {analysisResult.overall_feedback && (
            <Card>
              <CardHeader>
                <CardTitle>Overall Feedback</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">
                  {analysisResult.overall_feedback}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
      
      {/* Analysis History */}
      {analysisHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Analyses</CardTitle>
            <CardDescription>
              Your recent resume analysis history
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analysisHistory.map((analysis) => (
                <div key={analysis.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="text-sm font-medium">{analysis.resume_title}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(analysis.analyzed_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge 
                      variant="outline" 
                      className={getScoreColor(analysis.result.ats_score)}
                    >
                      {analysis.result.ats_score}%
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setAnalysisResult(analysis.result)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
