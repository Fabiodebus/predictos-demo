'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { CheckCircle, ArrowLeft, ArrowRight, User, Building, Settings, AlertCircle } from 'lucide-react';
import { CampaignFormData } from '@/types/campaign';
import { validateLinkedInUrl, validateDomain } from '@/lib/utils';

interface MultiStepFormProps {
  onSubmit: (data: CampaignFormData) => void;
  onBack?: () => void;
  isLoading?: boolean;
}

const steps = [
  {
    id: 1,
    title: 'Lead Information',
    description: 'Tell us about your prospect',
    icon: User
  },
  {
    id: 2,
    title: 'Company Research',
    description: 'What should we research?',
    icon: Building
  },
  {
    id: 3,
    title: 'Campaign Settings',
    description: 'Configure your outreach',
    icon: Settings
  }
];

export default function MultiStepForm({ onSubmit, onBack, isLoading = false }: MultiStepFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<CampaignFormData>({
    leadName: '',
    leadTitle: '',
    companyName: '',
    linkedinUrl: '',
    companyDomain: '',
    searchQuery: '',
    senderName: 'Fabio Debus',
    senderEmail: 'fabio@predictos.com',
    numberOfEmails: 1,
    numberOfThreads: 1,
    language: 'english',
    formality: 'semi-formal',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof CampaignFormData, string>>>({});

  const handleInputChange = (field: keyof CampaignFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateCurrentStep = (): boolean => {
    const newErrors: Partial<Record<keyof CampaignFormData, string>> = {};

    if (currentStep === 1) {
      if (!formData.leadName.trim()) {
        newErrors.leadName = 'Lead name is required';
      }
      if (!formData.leadTitle.trim()) {
        newErrors.leadTitle = 'Lead title is required';
      }
      if (!formData.companyName.trim()) {
        newErrors.companyName = 'Company name is required';
      }
      if (!formData.linkedinUrl) {
        newErrors.linkedinUrl = 'LinkedIn URL is required';
      } else if (!validateLinkedInUrl(formData.linkedinUrl)) {
        newErrors.linkedinUrl = 'Please enter a valid LinkedIn profile URL';
      }
    }

    if (currentStep === 2) {
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
    }

    if (currentStep === 3) {
      if (!formData.senderName.trim()) {
        newErrors.senderName = 'Sender name is required';
      }
      if (!formData.senderEmail.trim()) {
        newErrors.senderEmail = 'Sender email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.senderEmail)) {
        newErrors.senderEmail = 'Please enter a valid email address';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      setCurrentStep(prev => Math.min(prev + 1, 3));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = () => {
    if (validateCurrentStep()) {
      onSubmit(formData);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8 space-x-4">
      {steps.map((step, index) => {
        const isCompleted = step.id < currentStep;
        const isCurrent = step.id === currentStep;
        const Icon = step.icon;

        return (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center">
              <div
                className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                  isCompleted
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : isCurrent
                    ? 'bg-blue-100 border-blue-600 text-blue-600 dark:bg-blue-900/20 dark:border-blue-400 dark:text-blue-400'
                    : 'bg-gray-100 border-gray-300 text-gray-400 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-500'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle className="h-6 w-6" />
                ) : (
                  <Icon className="h-6 w-6" />
                )}
              </div>
              <div className="text-center mt-2">
                <p
                  className={`text-sm font-medium ${
                    isCompleted || isCurrent
                      ? 'text-gray-900 dark:text-gray-100'
                      : 'text-gray-400 dark:text-gray-500'
                  }`}
                >
                  {step.title}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 max-w-20">
                  {step.description}
                </p>
              </div>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`w-16 h-0.5 transition-all duration-300 ${
                  isCompleted
                    ? 'bg-blue-600'
                    : 'bg-gray-300 dark:bg-gray-600'
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="leadName" className="text-sm font-medium text-gray-700 dark:text-gray-300">
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
          <Label htmlFor="leadTitle" className="text-sm font-medium text-gray-700 dark:text-gray-300">
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

      <div className="space-y-2">
        <Label htmlFor="companyName" className="text-sm font-medium text-gray-700 dark:text-gray-300">
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
        <Label htmlFor="linkedinUrl" className="text-sm font-medium text-gray-700 dark:text-gray-300">
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
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="companyDomain" className="text-sm font-medium text-gray-700 dark:text-gray-300">
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

      <div className="space-y-2">
        <Label htmlFor="searchQuery" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Research Query *
        </Label>
        <Textarea
          id="searchQuery"
          placeholder="e.g., recent funding rounds, new product launches, expansion plans, company culture, recent news..."
          value={formData.searchQuery}
          onChange={(e) => handleInputChange('searchQuery', e.target.value)}
          className={`min-h-[120px] ${errors.searchQuery ? 'border-red-500' : ''}`}
        />
        {errors.searchQuery && (
          <div className="flex items-center space-x-1 text-red-500 text-sm">
            <AlertCircle className="h-4 w-4" />
            <span>{errors.searchQuery}</span>
          </div>
        )}
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Describe what you'd like to research about this company to create personalized outreach.
        </p>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      {/* Sender Information */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
          Sender Information
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="senderName" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Your Name *
            </Label>
            <Input
              id="senderName"
              type="text"
              placeholder="John Doe"
              value={formData.senderName}
              onChange={(e) => handleInputChange('senderName', e.target.value)}
              className={errors.senderName ? 'border-red-500' : ''}
            />
            {errors.senderName && (
              <div className="flex items-center space-x-1 text-red-500 text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>{errors.senderName}</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="senderEmail" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Your Email *
            </Label>
            <Input
              id="senderEmail"
              type="email"
              placeholder="john@company.com"
              value={formData.senderEmail}
              onChange={(e) => handleInputChange('senderEmail', e.target.value)}
              className={errors.senderEmail ? 'border-red-500' : ''}
            />
            {errors.senderEmail && (
              <div className="flex items-center space-x-1 text-red-500 text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>{errors.senderEmail}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Campaign Settings */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
          Campaign Settings
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="numberOfEmails" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Number of Emails
            </Label>
            <Select
              id="numberOfEmails"
              value={formData.numberOfEmails.toString()}
              onChange={(e) => handleInputChange('numberOfEmails', parseInt(e.target.value))}
            >
              {Array.from({ length: 5 }, (_, i) => i + 1).map(num => (
                <option key={num} value={num}>{num}</option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="numberOfThreads" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Number of Threads
            </Label>
            <Select
              id="numberOfThreads"
              value={formData.numberOfThreads.toString()}
              onChange={(e) => handleInputChange('numberOfThreads', parseInt(e.target.value))}
            >
              {Array.from({ length: 3 }, (_, i) => i + 1).map(num => (
                <option key={num} value={num}>{num}</option>
              ))}
            </Select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="language" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Language
          </Label>
          <Select
            id="language"
            value={formData.language}
            onChange={(e) => handleInputChange('language', e.target.value)}
          >
            <option value="english">English</option>
            <option value="german">German</option>
            <option value="spanish">Spanish</option>
            <option value="french">French</option>
            <option value="italian">Italian</option>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="formality" className="text-sm font-medium text-gray-700 dark:text-gray-300">
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

      <div className="bg-blue-50 dark:bg-blue-900/10 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
        <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
          Campaign Summary
        </h4>
        <div className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
          <p><strong>Target:</strong> {formData.leadName} at {formData.companyName}</p>
          <p><strong>Research:</strong> {formData.companyDomain}</p>
          <p><strong>Campaign:</strong> {formData.numberOfEmails} emails in {formData.language}</p>
        </div>
      </div>
    </div>
  );

  const getCurrentStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      default:
        return renderStep1();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Card className="shadow-2xl border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-8">
            <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {steps[currentStep - 1].title}
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              {steps[currentStep - 1].description}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-8">
            {renderStepIndicator()}
            
            <div className="min-h-[300px]">
              {getCurrentStepContent()}
            </div>

            <div className="flex justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
              <div>
                {currentStep > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePrevious}
                    className="flex items-center space-x-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Previous</span>
                  </Button>
                )}
                {currentStep === 1 && onBack && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onBack}
                    className="flex items-center space-x-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Back to Welcome</span>
                  </Button>
                )}
              </div>

              <div>
                {currentStep < 3 ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 flex items-center space-x-2"
                  >
                    <span>Continue</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 flex items-center space-x-2 min-w-[140px]"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                        <span>Starting...</span>
                      </>
                    ) : (
                      <>
                        <span>Start Research</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}