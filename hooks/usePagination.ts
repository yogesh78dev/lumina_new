// FIX: Add 'React' import to resolve 'React.Dispatch' and 'React.SetStateAction' types, which will fix type inference for the 'usePagination' hook across the application.
import React, { useState, useMemo } from 'react';

interface PaginationResult<T> {
  paginatedData: T[];
  currentPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  totalPages: number;
  itemsPerPage: number;
  setItemsPerPage: React.Dispatch<React.SetStateAction<number>>;
  totalItems: number;
  startIndex: number;
  endIndex: number;
}

export const usePagination = <T,>(
  data: T[],
  initialItemsPerPage: number = 10
): PaginationResult<T> => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(initialItemsPerPage);

  const totalItems = data.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return data.slice(startIndex, endIndex);
  }, [data, currentPage, itemsPerPage]);

  // Reset to page 1 if data or itemsPerPage changes and current page becomes invalid
  if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
  }

  const startIndex = Math.min((currentPage - 1) * itemsPerPage + 1, totalItems);
  const endIndex = Math.min(startIndex + itemsPerPage - 1, totalItems);

  return {
    paginatedData,
    currentPage,
    setCurrentPage,
    totalPages,
    itemsPerPage,
    setItemsPerPage,
    totalItems,
    startIndex,
    endIndex
  };
};