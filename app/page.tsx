'use client';

import { useRouter } from 'next/navigation';
import AppLayout from './components/AppLayout';
import Card from './components/Card';
import Button from './components/Button';

export default function Home() {
  const router = useRouter();
  
  return (
    <AppLayout>
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Good morning, Dhruv
            </h1>
            <p className="text-gray-600">
              Ready to process some documents today?
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="text-center">
              <div className="text-2xl font-bold text-gray-900 mb-1">24</div>
              <div className="text-sm text-gray-500">Processed Today</div>
            </Card>
            <Card className="text-center">
              <div className="text-2xl font-bold text-gray-900 mb-1">156</div>
              <div className="text-sm text-gray-500">This Month</div>
            </Card>
            <Card className="text-center">
              <div className="text-2xl font-bold text-gray-900 mb-1">98.5%</div>
              <div className="text-sm text-gray-500">Accuracy</div>
            </Card>
            <Card className="text-center">
              <div className="text-2xl font-bold text-gray-900 mb-1">3.2m</div>
              <div className="text-sm text-gray-500">Avg Time</div>
            </Card>
          </div>

          {/* Main Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Personal Loan */}
            <Card hoverable className="group cursor-pointer transition-all duration-200 hover:shadow-lg">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
                  <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Personal Loan</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Process individual loan applications with automated verification
                  </p>
                  <Button 
                    size="sm"
                    onClick={() => router.push('/upload')}
                    rightIcon={
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    }
                  >
                    Start Analysis
                  </Button>
                </div>
              </div>
            </Card>

            {/* Business Loan */}
            <Card hoverable className="group cursor-pointer transition-all duration-200 hover:shadow-lg">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Business Loan</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Comprehensive business loan processing with financial analysis
                  </p>
                  <Button 
                    size="sm"
                    onClick={() => router.push('/business-disclaimer')}
                    rightIcon={
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    }
                  >
                    Start Analysis
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
              <Button variant="ghost" size="sm">
                View all
              </Button>
            </div>
                         <div className="space-y-4">
               <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                 <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                 <div className="flex-1">
                   <div className="text-sm font-medium text-gray-900">Personal loan analysis completed</div>
                   <div className="text-xs text-gray-500">Application #PL-2024-001</div>
                 </div>
               </div>
               <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                 <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                 <div className="flex-1">
                   <div className="text-sm font-medium text-gray-900">Business loan documents uploaded</div>
                   <div className="text-xs text-gray-500">Application #BL-2024-045</div>
                 </div>
               </div>
               <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                 <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                 <div className="flex-1">
                   <div className="text-sm font-medium text-gray-900">Document verification pending</div>
                   <div className="text-xs text-gray-500">Application #PL-2024-002</div>
                 </div>
               </div>
             </div>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
} 