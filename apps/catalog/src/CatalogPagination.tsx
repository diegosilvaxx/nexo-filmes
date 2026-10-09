import { Pagination, PaginationButton, PaginationGap, PaginationStatus } from './catalog.styles';
import { getPageItems } from './pagination';

interface CatalogPaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function CatalogPagination({ page, totalPages, onPageChange }: CatalogPaginationProps) {
  return (
    <Pagination aria-label="Paginação do catálogo">
      <PaginationStatus role="status">
        Página {page} de {totalPages}
      </PaginationStatus>
      <PaginationButton
        type="button"
        aria-label="Anterior"
        disabled={page <= 1}
        onClick={() => onPageChange(Math.min(page - 1, totalPages))}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M10 3 5 8l5 5" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </PaginationButton>
      {getPageItems(page, totalPages).map((item) =>
        typeof item === 'number' ? (
          <PaginationButton
            key={item}
            type="button"
            aria-label={`Página ${item}`}
            aria-current={item === page ? 'page' : undefined}
            onClick={() => onPageChange(item)}
          >
            {item}
          </PaginationButton>
        ) : (
          <PaginationGap key={item} aria-hidden="true">
            …
          </PaginationGap>
        ),
      )}
      <PaginationButton
        type="button"
        aria-label="Próxima"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="m6 3 5 5-5 5" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </PaginationButton>
    </Pagination>
  );
}
