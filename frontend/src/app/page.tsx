'use client';

import React from 'react';
import Link from 'next/link';
import { BookOpen, FileText, Users, TrendingUp } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Welcome to <span className="text-blue-600">Reader Digest</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Discover, share, and organize what you read. Connect with a community of readers and track your reading journey.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Link
              href="/public/articles"
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors duration-200 shadow-lg hover:shadow-xl"
            >
              Explore Articles
            </Link>
            <Link
              href="/public/digests"
              className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors duration-200 shadow-lg hover:shadow-xl"
            >
              Read Digests
            </Link>
            <Link
              href="/register"
              className="w-full sm:w-auto border-2 border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-900 px-8 py-4 rounded-lg font-semibold text-lg transition-colors duration-200"
            >
              Join Community
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {/* Feature 1 */}
          <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-200">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <BookOpen className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Share Articles</h3>
            <p className="text-gray-600">
              Share interesting articles you've read with notes and thoughts for the community to discover.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-200">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <FileText className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Weekly Digests</h3>
            <p className="text-gray-600">
              Create and read curated weekly summaries of the most interesting content and insights.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-200">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Community</h3>
            <p className="text-gray-600">
              Connect with fellow readers and discover content through a vibrant reading community.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-200">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
              <TrendingUp className="h-6 w-6 text-orange-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Track Progress</h3>
            <p className="text-gray-600">
              Keep track of your reading journey and organize your thoughts in one place.
            </p>
          </div>
        </div>

        {/* Quick Navigation */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Articles Section */}
          <Link href="/public/articles" className="group">
            <div className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-all duration-200 group-hover:scale-105">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Latest Articles</h2>
                <BookOpen className="h-8 w-8 text-blue-600 group-hover:text-blue-700" />
              </div>
              <p className="text-gray-600 mb-4">
                Discover the latest articles shared by our community. From technology to philosophy, find diverse perspectives and insights.
              </p>
              <div className="text-blue-600 font-semibold group-hover:text-blue-700">
                Browse Articles →
              </div>
            </div>
          </Link>

          {/* Digests Section */}
          <Link href="/public/digests" className="group">
            <div className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-all duration-200 group-hover:scale-105">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Weekly Digests</h2>
                <FileText className="h-8 w-8 text-purple-600 group-hover:text-purple-700" />
              </div>
              <p className="text-gray-600 mb-4">
                Read curated weekly summaries that compile the best articles and insights from our community members.
              </p>
              <div className="text-purple-600 font-semibold group-hover:text-purple-700">
                Read Digests →
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
