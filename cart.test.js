import axios from 'axios';
import { renderHook, act } from '@testing-library/react-hooks';
import useDataApi from './api';

jest.mock('axios');

describe('useDataApi hook', () => {
  it('fetches data from API', async () => {
    const data = [
      { name: "Apples_:", country: "Italy", cost: 3, instock: 10 },
      { name: "Oranges:", country: "Spain", cost: 4, instock: 3 },
      { name: "Beans__:", country: "USA", cost: 2, instock: 5 },
      { name: "Cabbage:", country: "USA", cost: 1, instock: 8 },
    ];
    
    axios.get.mockResolvedValue({ data });

    const { result, waitForNextUpdate } = renderHook(() => useDataApi('http://localhost:1337/api/products', []));

    expect(result.current[0].isLoading).toBe(true);

    await waitForNextUpdate();

    expect(result.current[0].isLoading).toBe(false);
    expect(result.current[0].isError).toBe(false);
    expect(result.current[0].data).toEqual(data);
  });

  it('handles error', async () => {
    axios.get.mockRejectedValue({});

    const { result, waitForNextUpdate } = renderHook(() => useDataApi('http://localhost:1337/api/products', []));

    expect(result.current[0].isLoading).toBe(true);

    await waitForNextUpdate();

    expect(result.current[0].isLoading).toBe(false);
    expect(result.current[0].isError).toBe(true);
  });
});
