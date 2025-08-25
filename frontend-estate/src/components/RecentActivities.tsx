import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUpIcon,
  SearchIcon,
  FilterIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CalendarIcon,
  XIcon
} from 'lucide-react';

interface Activity {
  id: number;
  type: string;
  description: string;
  created_at: string;
}

interface RecentActivitiesProps {
  activities: Activity[];
  loading?: boolean;
}

const RecentActivities: React.FC<RecentActivitiesProps> = ({ 
  activities = [], 
  loading = false 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedDateRange, setSelectedDateRange] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const itemsPerPage = 10;

  // Get unique activity types for filter dropdown
  const activityTypes = useMemo(() => {
    const types = [...new Set(activities.map(activity => activity.type))];
    return types.sort();
  }, [activities]);

  // Filter activities based on search and filters
  const filteredActivities = useMemo(() => {
    let filtered = activities;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(activity =>
        activity.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Type filter
    if (selectedType) {
      filtered = filtered.filter(activity => activity.type === selectedType);
    }

    // Date range filter
    if (selectedDateRange) {
      const now = new Date();
      const filterDate = new Date();

      switch (selectedDateRange) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          filtered = filtered.filter(activity => 
            new Date(activity.created_at) >= filterDate
          );
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          filtered = filtered.filter(activity => 
            new Date(activity.created_at) >= filterDate
          );
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          filtered = filtered.filter(activity => 
            new Date(activity.created_at) >= filterDate
          );
          break;
        case 'quarter':
          filterDate.setMonth(now.getMonth() - 3);
          filtered = filtered.filter(activity => 
            new Date(activity.created_at) >= filterDate
          );
          break;
      }
    }

    return filtered.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [activities, searchTerm, selectedType, selectedDateRange]);

  // Pagination
  const totalPages = Math.ceil(filteredActivities.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedActivities = filteredActivities.slice(startIndex, startIndex + itemsPerPage);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedType, selectedDateRange]);

  const getActivityTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'payment':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'resident':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'visitor':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'announcement':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'due':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedType('');
    setSelectedDateRange('');
    setCurrentPage(1);
  };

  const activeFiltersCount = [searchTerm, selectedType, selectedDateRange].filter(Boolean).length;

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Recent Activities</h3>
        </div>
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading activities...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h3 className="text-lg font-semibold text-gray-900">Recent Activities</h3>
            <TrendingUpIcon size={20} className="text-blue-600" />
            {filteredActivities.length !== activities.length && (
              <span className="text-sm text-gray-500">
                ({filteredActivities.length} of {activities.length})
              </span>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              showFilters || activeFiltersCount > 0
                ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <FilterIcon size={16} />
            <span>Filters</span>
            {activeFiltersCount > 0 && (
              <span className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="px-6 py-4 bg-blue-50 border-b border-blue-100">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <SearchIcon size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search activities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Type Filter */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Types</option>
              {activityTypes.map(type => (
                <option key={type} value={type}>
                  {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </option>
              ))}
            </select>

            {/* Date Range Filter */}
            <select
              value={selectedDateRange}
              onChange={(e) => setSelectedDateRange(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last Month</option>
              <option value="quarter">Last 3 Months</option>
            </select>
          </div>

          {/* Clear Filters */}
          {activeFiltersCount > 0 && (
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {searchTerm && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Search: "{searchTerm}"
                    <button onClick={() => setSearchTerm('')} className="ml-1 hover:text-blue-600">
                      <XIcon size={14} />
                    </button>
                  </span>
                )}
                {selectedType && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Type: {selectedType.replace('_', ' ')}
                    <button onClick={() => setSelectedType('')} className="ml-1 hover:text-blue-600">
                      <XIcon size={14} />
                    </button>
                  </span>
                )}
                {selectedDateRange && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Date: {selectedDateRange}
                    <button onClick={() => setSelectedDateRange('')} className="ml-1 hover:text-blue-600">
                      <XIcon size={14} />
                    </button>
                  </span>
                )}
              </div>
              <button
                onClick={clearFilters}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* Activities Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date & Time
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedActivities.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center space-y-3">
                    <CalendarIcon size={48} className="text-gray-300" />
                    <p className="text-gray-500 font-medium">
                      {activeFiltersCount > 0 ? 'No activities match your filters' : 'No recent activities to display'}
                    </p>
                    {activeFiltersCount > 0 && (
                      <button
                        onClick={clearFilters}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Clear filters to see all activities
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              paginatedActivities.map(activity => (
                <tr key={activity.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border ${getActivityTypeColor(activity.type)}`}>
                      {activity.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-900 leading-relaxed">
                      {activity.description}
                    </p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(activity.created_at).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(activity.created_at).toLocaleTimeString()}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredActivities.length)} of {filteredActivities.length} activities
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeftIcon size={16} />
              </button>
              
              <div className="flex items-center space-x-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                  const isCurrentPage = page === currentPage;
                  const isNearCurrentPage = Math.abs(page - currentPage) <= 2;
                  const isFirstOrLast = page === 1 || page === totalPages;
                  
                  if (!isNearCurrentPage && !isFirstOrLast) {
                    if (page === 2 || page === totalPages - 1) {
                      return <span key={page} className="text-gray-400">...</span>;
                    }
                    return null;
                  }
                  
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                        isCurrentPage
                          ? 'bg-blue-600 text-white'
                          : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRightIcon size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecentActivities;