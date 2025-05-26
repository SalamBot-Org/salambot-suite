/**
 * @file        Test minimal pour widget-web
 * @author      SalamBot Team (contact: info@salambot.ma)
 * @created     2025-05-25
 * @updated     2025-05-25
 * @project     SalamBot - AI CRM for Moroccan SMEs
 */

import { render, screen } from '@testing-library/react';
import Home from '../pages/index';

describe('Home', () => {
  it('renders the welcome message', () => {
    render(<Home />);
    const heading = screen.getByText(/SalamBot Widget/i);
    expect(heading).toBeInTheDocument();
  });
});
