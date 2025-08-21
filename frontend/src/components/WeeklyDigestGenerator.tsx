'use client';

import React, { useState, useEffect } from 'react';
import { digestsAPI } from '@/lib/api';
import { WeeklyDigestGenerationResponse } from '@/lib/types';

interface WeeklyDigestGeneratorProps {
  onDigestGenerated?: (digest: WeeklyDigestGenerationResponse) => void;
}

interface AvailableWeek {
  week_start: string;
  week_end: string;
  article_count: number;
}

export default function WeeklyDigestGenerator({ onDigestGenerated }: WeeklyDigestGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [availableWeeks, setAvailableWeeks] = useState<AvailableWeek[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<AvailableWeek | null>(null);
  const [customTitle, setCustomTitle] = useState('');
  const [useCustomDateRange, setUseCustomDateRange] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAvailableWeeks();
  }, []);

  const loadAvailableWeeks = async () => {
    try {
      const response = await digestsAPI.getAvailableWeeks();
      setAvailableWeeks(response.data.available_weeks || []);
      
      // Pre-select the most recent week if available
      if (response.data.available_weeks && response.data.available_weeks.length > 0) {
        setSelectedWeek(response.data.available_weeks[0]);
      }
    } catch (error) {
      console.error('Failed to load available weeks:', error);
      setError('Failed to load available weeks');
    }
  };

  const handleGenerateDigest = async () => {
    if (!selectedWeek && !useCustomDateRange) {
      setError('Please select a week or specify a custom date range');
      return;
    }

    if (useCustomDateRange && (!startDate || !endDate)) {
      setError('Please specify both start and end dates');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const requestData: any = {};
      
      if (useCustomDateRange) {
        requestData.week_start = startDate;
        requestData.week_end = endDate;
      } else if (selectedWeek) {
        requestData.week_start = selectedWeek.week_start;
        requestData.week_end = selectedWeek.week_end;
      }

      if (customTitle.trim()) {
        requestData.custom_title = customTitle.trim();
      }

      const response = await digestsAPI.generateWeeklyDigest(requestData);
      const digestData = response.data as WeeklyDigestGenerationResponse;
      
      onDigestGenerated?.(digestData);
    } catch (error: any) {
      console.error('Failed to generate digest:', error);
      setError(error.response?.data?.error || 'Failed to generate weekly digest');
    } finally {
      setIsGenerating(false);
    }
  };

  const formatDateRange = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    return `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
  };

  const getDefaultDateRange = () => {
    const today = new Date();
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    return {
      start: lastWeek.toISOString().split('T')[0],
      end: today.toISOString().split('T')[0]
    };
  };

  useEffect(() => {
    if (useCustomDateRange) {
      const defaultRange = getDefaultDateRange();
      setStartDate(defaultRange.start);
      setEndDate(defaultRange.end);
    }
  }, [useCustomDateRange]);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Generate Weekly Digest</h2>
        <div className="flex items-center text-sm text-gray-500">
          📅 Create a summary of your recent reading
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        {/* Custom Title */}
        <div>
          <label htmlFor="custom-title" className="block text-sm font-medium text-gray-700 mb-2">
            Custom Title (optional)
          </label>
          <input
            type="text"
            id="custom-title"
            value={customTitle}
            onChange={(e) => setCustomTitle(e.target.value)}
            placeholder="e.g., My Reading Highlights - Week 3"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Date Range Selection */}
        <div>
          <div className="flex items-center space-x-4 mb-3">
            <label className="flex items-center">
              <input
                type="radio"
                checked={!useCustomDateRange}
                onChange={() => setUseCustomDateRange(false)}
                className="mr-2"
              />
              <span className="text-sm font-medium text-gray-700">Select from available weeks</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                checked={useCustomDateRange}
                onChange={() => setUseCustomDateRange(true)}
                className="mr-2"
              />
              <span className="text-sm font-medium text-gray-700">Custom date range</span>
            </label>
          </div>

          {!useCustomDateRange ? (
            <div>
              {availableWeeks.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {availableWeeks.map((week, index) => (
                    <label
                      key={index}
                      className={`flex items-center justify-between p-3 border rounded-md cursor-pointer transition-colors ${
                        selectedWeek === week
                          ? 'bg-blue-50 border-blue-300'
                          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center">
                        <input
                          type="radio"
                          checked={selectedWeek === week}
                          onChange={() => setSelectedWeek(week)}
                          className="mr-3"
                        />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {formatDateRange(week.week_start, week.week_end)}
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        {week.article_count} article{week.article_count !== 1 ? 's' : ''}
                      </div>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-gray-50 rounded-md text-center">
                  <p className="text-sm text-gray-500">No articles found. Add some articles first!</p>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  id="start-date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  id="end-date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Generate Button */}
        <div className="pt-4 border-t">
          <button
            onClick={handleGenerateDigest}
            disabled={isGenerating || (availableWeeks.length === 0 && !useCustomDateRange)}
            className={`w-full py-3 px-4 rounded-md font-medium transition-colors ${
              isGenerating || (availableWeeks.length === 0 && !useCustomDateRange)
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
            }`}
          >
            {isGenerating ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating Weekly Digest...
              </div>
            ) : (
              '📝 Generate Weekly Digest'
            )}
          </button>
        </div>
      </div>

      <div className="mt-4 p-3 bg-blue-50 rounded-md">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">How it works</h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc pl-5 space-y-1">
                <li>Select a week with articles or choose a custom date range</li>
                <li>The digest will include all articles you've read in that period</li>
                <li>Review and edit the generated content before publishing</li>
                <li>Choose to publish publicly or keep as a private draft</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
