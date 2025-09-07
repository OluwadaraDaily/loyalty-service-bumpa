import { renderHook } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useInitials } from '../use-initials';

describe('useInitials', () => {
    it('returns empty string for empty input', () => {
        const { result } = renderHook(() => useInitials());
        expect(result.current('')).toBe('');
    });

    it('returns single initial for single name', () => {
        const { result } = renderHook(() => useInitials());
        expect(result.current('John')).toBe('J');
    });

    it('returns first and last initials for two names', () => {
        const { result } = renderHook(() => useInitials());
        expect(result.current('John Doe')).toBe('JD');
    });

    it('returns first and last initials for multiple names', () => {
        const { result } = renderHook(() => useInitials());
        expect(result.current('John Michael Doe')).toBe('JD');
    });

    it('handles names with extra spaces', () => {
        const { result } = renderHook(() => useInitials());
        expect(result.current('  John   Doe  ')).toBe('JD');
    });

    it('returns uppercase initials', () => {
        const { result } = renderHook(() => useInitials());
        expect(result.current('john doe')).toBe('JD');
    });

    it('handles single character names', () => {
        const { result } = renderHook(() => useInitials());
        expect(result.current('J D')).toBe('JD');
    });

    it('returns stable reference across rerenders', () => {
        const { result, rerender } = renderHook(() => useInitials());
        const firstCall = result.current;
        rerender();
        expect(result.current).toBe(firstCall);
    });
});