/**
 * Dashboard metrics and statistics.
 * Aggregates inventory and test drive KPIs for the admin dashboard.
 */
export interface DashboardData {
  /** Inventory counts by listing status and featured flag. */
  cars: {
    /** Total number of cars in the database. */
    total: number;
    /** Cars currently available to buyers. */
    available: number;
    /** Cars marked as sold. */
    sold: number;
    /** Cars unavailable for sale or booking. */
    unavailable: number;
    /** Cars flagged for featured placement. */
    featured: number;
  };
  /** Test drive booking metrics. */
  testDrives: {
    /** Total number of test drive bookings. */
    total: number;
    /** Test drives waiting for confirmation. */
    pending: number;
    /** Test drives confirmed by the dealership. */
    confirmed: number;
    /** Test drives completed. */
    completed: number;
    /** Test drives cancelled. */
    cancelled: number;
    /** Test drives with a no-show status. */
    noShow: number;
    /** Percentage of completed test drives that led to a sold car. */
    conversionRate: number;
  };
}
