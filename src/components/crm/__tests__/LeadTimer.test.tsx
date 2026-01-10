import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LeadTimer } from '../LeadTimer';

describe('LeadTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-12-25T12:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('time formatting', () => {
    it('should display "< 1m" for very recent interactions', () => {
      const now = new Date('2024-12-25T11:59:30');
      render(<LeadTimer createdAt={now.toISOString()} />);
      expect(screen.getByText('< 1m')).toBeInTheDocument();
    });

    it('should display minutes for recent interactions', () => {
      const thirtyMinutesAgo = new Date('2024-12-25T11:30:00');
      render(<LeadTimer createdAt={thirtyMinutesAgo.toISOString()} />);
      expect(screen.getByText('30m')).toBeInTheDocument();
    });

    it('should display hours and minutes', () => {
      const twoHoursAgo = new Date('2024-12-25T09:45:00');
      render(<LeadTimer createdAt={twoHoursAgo.toISOString()} />);
      expect(screen.getByText('2h 15m')).toBeInTheDocument();
    });

    it('should display days and hours', () => {
      const twoDaysAgo = new Date('2024-12-23T07:00:00');
      render(<LeadTimer createdAt={twoDaysAgo.toISOString()} />);
      expect(screen.getByText('2d 5h')).toBeInTheDocument();
    });
  });

  describe('color coding', () => {
    it('should show green color for < 1 hour', () => {
      const thirtyMinutesAgo = new Date('2024-12-25T11:30:00');
      render(<LeadTimer createdAt={thirtyMinutesAgo.toISOString()} />);
      const timer = screen.getByText('30m').closest('span');
      expect(timer).toHaveClass('text-green-600');
      expect(timer).toHaveClass('bg-green-50');
    });

    it('should show yellow color for 1-4 hours', () => {
      const twoHoursAgo = new Date('2024-12-25T10:00:00');
      render(<LeadTimer createdAt={twoHoursAgo.toISOString()} />);
      const timer = screen.getByText(/2h/).closest('span');
      expect(timer).toHaveClass('text-yellow-600');
      expect(timer).toHaveClass('bg-yellow-50');
    });

    it('should show orange color for 4-24 hours', () => {
      const tenHoursAgo = new Date('2024-12-25T02:00:00');
      render(<LeadTimer createdAt={tenHoursAgo.toISOString()} />);
      const timer = screen.getByText(/10h/).closest('span');
      expect(timer).toHaveClass('text-orange-600');
      expect(timer).toHaveClass('bg-orange-50');
    });

    it('should show red color for > 24 hours', () => {
      const twoDaysAgo = new Date('2024-12-23T12:00:00');
      render(<LeadTimer createdAt={twoDaysAgo.toISOString()} />);
      const timer = screen.getByText(/2d/).closest('span');
      expect(timer).toHaveClass('text-red-600');
      expect(timer).toHaveClass('bg-red-50');
    });
  });

  describe('lastInteractionAt vs createdAt', () => {
    it('should use lastInteractionAt when provided', () => {
      const createdAt = new Date('2024-12-20T12:00:00');
      const lastInteraction = new Date('2024-12-25T11:30:00');
      render(
        <LeadTimer 
          createdAt={createdAt.toISOString()} 
          lastInteractionAt={lastInteraction.toISOString()} 
        />
      );
      expect(screen.getByText('30m')).toBeInTheDocument();
    });

    it('should use createdAt when lastInteractionAt is null', () => {
      const createdAt = new Date('2024-12-25T11:30:00');
      render(<LeadTimer createdAt={createdAt.toISOString()} lastInteractionAt={null} />);
      expect(screen.getByText('30m')).toBeInTheDocument();
    });
  });

  describe('icon visibility', () => {
    it('should show icon by default', () => {
      const now = new Date('2024-12-25T11:59:00');
      render(<LeadTimer createdAt={now.toISOString()} />);
      const icon = document.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('should hide icon when showIcon is false', () => {
      const now = new Date('2024-12-25T11:59:00');
      render(<LeadTimer createdAt={now.toISOString()} showIcon={false} />);
      const icon = document.querySelector('svg');
      expect(icon).not.toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should handle future dates gracefully', () => {
      const futureDate = new Date('2024-12-25T13:00:00');
      render(<LeadTimer createdAt={futureDate.toISOString()} />);
      expect(screen.getByText('< 1m')).toBeInTheDocument();
    });

    it('should render nothing when elapsed is empty', () => {
      // This tests the guard clause
      const { container } = render(<LeadTimer createdAt="" />);
      expect(container.firstChild).toBeNull();
    });
  });
});
