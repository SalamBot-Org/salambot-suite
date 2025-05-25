import { render } from '@testing-library/react';

import UiUi from './ui-ui';

describe('UiUi', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<UiUi />);
    expect(baseElement).toBeTruthy();
  });
});
