/**
 * Dashboard metrics and statistics
 */
export interface DashboardData {
  cars: {
    total: number;
    available: number;
    sold: number;
    unavailable: number;
    featured: number;
  };
  testDrives: {
    total: number;
    pending: number;
    confirmed: number;
    completed: number;
    cancelled: number;
    noShow: number;
    conversionRate: number;
  };
}
