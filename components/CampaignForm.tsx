'use client';

import React, { useState } from 'react';
import { Mail, Users, Globe, MessageSquare, Send, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { CampaignFormData } from '@/types/campaign';
import { validateLinkedInUrl, validateDomain } from '@/lib/utils';

interface CampaignFormProps {
  onSubmit: (data: CampaignFormData) => void;
  isLoading?: boolean;
}

export default function CampaignForm({ onSubmit, isLoading = false }: CampaignFormProps) {
  const [formData, setFormData] = useState<CampaignFormData>({
    linkedinUrl: '',
    companyDomain: '',
    searchQuery: '',
    leadName: '',
    leadTitle: '',
    companyName: '',
    senderName: '',
    senderEmail: '',
    numberOfEmails: 1,
    numberOfThreads: 1,
    language: 'english',
    formality: 'semi-formal',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof CampaignFormData, string>>>({});

  const handleInputChange = (
    field: keyof CampaignFormData,
    value: string | number
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof CampaignFormData, string>> = {};

    if (!formData.linkedinUrl) {
      newErrors.linkedinUrl = 'LinkedIn URL is required';
    } else if (!validateLinkedInUrl(formData.linkedinUrl)) {
      newErrors.linkedinUrl = 'Please enter a valid LinkedIn profile URL';
    }

    if (!formData.companyDomain) {
      newErrors.companyDomain = 'Company domain is required';
    } else if (!validateDomain(formData.companyDomain)) {
      newErrors.companyDomain = 'Please enter a valid domain (e.g., example.com)';
    }

    if (!formData.searchQuery.trim()) {
      newErrors.searchQuery = 'Search query is required';
    } else if (formData.searchQuery.trim().length < 10) {
      newErrors.searchQuery = 'Search query should be at least 10 characters';
    }

    if (!formData.leadName.trim()) {
      newErrors.leadName = 'Lead name is required';
    }

    if (!formData.leadTitle.trim()) {
      newErrors.leadTitle = 'Lead title is required';
    }

    if (!formData.companyName.trim()) {
      newErrors.companyName = 'Company name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center mb-4">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full">
            <Mail className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Email Campaign Generator
        </CardTitle>
        <CardDescription className="text-gray-600 dark:text-gray-400">
          Generate personalized outreach emails using AI research and your Letta agent
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Lead Information Section */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Lead Information
              </h3>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="leadName" className="text-gray-700 dark:text-gray-300">
                  Lead Name *
                </Label>
                <Input
                  id="leadName"
                  type="text"
                  placeholder="John Doe"
                  value={formData.leadName}
                  onChange={(e) => handleInputChange('leadName', e.target.value)}
                  className={errors.leadName ? 'border-red-500' : ''}
                />
                {errors.leadName && (
                  <div className="flex items-center space-x-1 text-red-500 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    <span>{errors.leadName}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="leadTitle" className="text-gray-700 dark:text-gray-300">
                  Lead Title *
                </Label>
                <Input
                  id="leadTitle"
                  type="text"
                  placeholder="CEO, CTO, Marketing Director"
                  value={formData.leadTitle}
                  onChange={(e) => handleInputChange('leadTitle', e.target.value)}
                  className={errors.leadTitle ? 'border-red-500' : ''}
                />
                {errors.leadTitle && (
                  <div className="flex items-center space-x-1 text-red-500 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    <span>{errors.leadTitle}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="companyName" className="text-gray-700 dark:text-gray-300">
                  Company Name *
                </Label>
                <Input
                  id="companyName"
                  type="text"
                  placeholder="Acme Corporation"
                  value={formData.companyName}
                  onChange={(e) => handleInputChange('companyName', e.target.value)}
                  className={errors.companyName ? 'border-red-500' : ''}
                />
                {errors.companyName && (
                  <div className="flex items-center space-x-1 text-red-500 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    <span>{errors.companyName}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyDomain" className="text-gray-700 dark:text-gray-300">
                  Company Domain *
                </Label>
                <Input
                  id="companyDomain"
                  type="text"
                  placeholder="example.com"
                  value={formData.companyDomain}
                  onChange={(e) => handleInputChange('companyDomain', e.target.value)}
                  className={errors.companyDomain ? 'border-red-500' : ''}
                />
                {errors.companyDomain && (
                  <div className="flex items-center space-x-1 text-red-500 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    <span>{errors.companyDomain}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="linkedinUrl" className="text-gray-700 dark:text-gray-300">
                LinkedIn Profile URL *
              </Label>
              <Input
                id="linkedinUrl"
                type="url"
                placeholder="https://linkedin.com/in/johndoe"
                value={formData.linkedinUrl}
                onChange={(e) => handleInputChange('linkedinUrl', e.target.value)}
                className={errors.linkedinUrl ? 'border-red-500' : ''}
              />
              {errors.linkedinUrl && (
                <div className="flex items-center space-x-1 text-red-500 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>{errors.linkedinUrl}</span>
                </div>
              )}
            </div>
          </div>

          {/* Research Query Section */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <Globe className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Research Query
              </h3>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="searchQuery" className="text-gray-700 dark:text-gray-300">
                What would you like to research about this company? *
              </Label>
              <Textarea
                id="searchQuery"
                placeholder="e.g., recent funding rounds, new product launches, expansion plans, company culture, recent news..."
                value={formData.searchQuery}
                onChange={(e) => handleInputChange('searchQuery', e.target.value)}
                className={`min-h-[100px] ${errors.searchQuery ? 'border-red-500' : ''}`}
              />
              {errors.searchQuery && (
                <div className="flex items-center space-x-1 text-red-500 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>{errors.searchQuery}</span>
                </div>
              )}
            </div>
          </div>

          {/* Campaign Settings Section */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Campaign Settings
              </h3>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-2">
                <Label htmlFor="numberOfEmails" className="text-gray-700 dark:text-gray-300">
                  Number of Emails
                </Label>
                <Select
                  id="numberOfEmails"
                  value={formData.numberOfEmails.toString()}
                  onChange={(e) => handleInputChange('numberOfEmails', parseInt(e.target.value))}
                >
                  {Array.from({ length: 10 }, (_, i) => i + 1).map(num => (
                    <option key={num} value={num}>{num}</option>
                  ))}
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="numberOfThreads" className="text-gray-700 dark:text-gray-300">
                  Number of Threads
                </Label>
                <Select
                  id="numberOfThreads"
                  value={formData.numberOfThreads.toString()}
                  onChange={(e) => handleInputChange('numberOfThreads', parseInt(e.target.value))}
                >
                  {Array.from({ length: 5 }, (_, i) => i + 1).map(num => (
                    <option key={num} value={num}>{num}</option>
                  ))}
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="language" className="text-gray-700 dark:text-gray-300">
                  Language
                </Label>
                <Select
                  id="language"
                  value={formData.language}
                  onChange={(e) => handleInputChange('language', e.target.value)}
                >
                  <option value="english">English</option>
                  <option value="spanish">Spanish</option>
                  <option value="french">French</option>
                  <option value="german">German</option>
                  <option value="italian">Italian</option>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="formality" className="text-gray-700 dark:text-gray-300">
                  Formality Level
                </Label>
                <Select
                  id="formality"
                  value={formData.formality}
                  onChange={(e) => handleInputChange('formality', e.target.value)}
                >
                  <option value="formal">Formal</option>
                  <option value="semi-formal">Semi-formal</option>
                  <option value="casual">Casual</option>
                </Select>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-center pt-6">
            <Button
              type="submit"
              disabled={isLoading}
              size="lg"
              className="min-w-[200px] bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  <span>Generating...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Send className="h-4 w-4" />
                  <span>Generate Campaign</span>
                </div>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}