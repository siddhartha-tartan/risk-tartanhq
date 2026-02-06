'use client';

import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path?: string;
  isActive?: boolean;
  isComingSoon?: boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  
  // Determine which flow is active based on pathname
  const isBusinessFlow = pathname.includes('business');
  const isPersonalFlow = !isBusinessFlow && pathname !== '/';
  const isDashboard = pathname === '/';

  const navigationSections: NavSection[] = [
    {
      title: 'Overview',
      items: [
        {
          id: 'dashboard',
          label: 'Dashboard',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z" />
            </svg>
          ),
          path: '/',
          isActive: isDashboard,
          isComingSoon: false
        }
      ]
    },
    {
      title: 'Document Analysis',
      items: [
        {
          id: 'personal-loan',
          label: 'Personal Loan Analysis',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          ),
          path: '/upload',
          isActive: isPersonalFlow,
          isComingSoon: false
        },
        {
          id: 'business-loan',
          label: 'Business Loan Analysis',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          ),
          path: '/business-disclaimer',
          isActive: isBusinessFlow,
          isComingSoon: false
        }
      ]
    },
    {
      title: 'AI Agents',
      items: [
        {
          id: 'financial-advisor',
          label: 'Financial Advisor',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          )
        },
        {
          id: 'policy-agent',
          label: 'Policy Agent',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          )
        },
        {
          id: 'document-validator',
          label: 'Document Validator',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )
        }
      ]
    },
    {
      title: 'Tools',
      items: [
        {
          id: 'document-library',
          label: 'Document Library',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          )
        },
        {
          id: 'settings',
          label: 'Settings',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          )
        }
      ]
    }
  ];

  const handleNavigation = (item: NavItem) => {
    if (item.isComingSoon) {
      return;
    }
    
    if (item.path) {
      try {
        router.push(item.path);
      } catch (error) {
        console.error('Navigation failed:', error);
      }
    }
  };

  return (
    <div className="sidebar w-64">
      <div className="flex flex-col h-full">
        {/* Logo and Brand */}
        <div className="flex items-center p-4 border-b border-gray-200">
          <Image
            src="https://framerusercontent.com/images/M00chRn7QHHUXkMDp5Zz1hbMt4Q.png?scale-down-to=512"
            alt="RiskOS Logo"
            width={32}
            height={32}
            className="mr-3"
          />
          <h1 className="text-lg font-semibold text-gray-900">RiskOS</h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          <div className="space-y-6">
            {navigationSections.map((section) => (
              <div key={section.title}>
                <h3 className="px-4 text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                  {section.title}
                </h3>
                <div className="space-y-1 px-2">
                  {section.items.map((item) => {
                    const isBusinessLoan = item.id === 'business-loan';
                    
                    return (
                      <button
                        key={item.id}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          
                          // Special handling for business loan
                          if (isBusinessLoan) {
                            router.push('/business-disclaimer');
                            return;
                          }
                          
                          handleNavigation(item);
                        }}
                        disabled={item.isComingSoon}
                        className={`w-full nav-item ${
                          item.isActive
                            ? 'nav-item-active'
                            : item.isComingSoon
                            ? 'text-gray-400 cursor-not-allowed'
                            : 'nav-item-inactive'
                        }`}
                        title={undefined}
                        style={{
                          pointerEvents: 'auto',
                          position: 'relative',
                          zIndex: 10
                        }}
                      >
                        <span className="flex-shrink-0">{item.icon}</span>
                        <span className="ml-3 text-left">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </nav>

        {/* User Profile */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">DB</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">Dhruv Budhiraja</p>
              <p className="text-xs text-gray-500">dhruv@tartanhq.com</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 