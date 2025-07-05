-- Clear all existing data from tables (in order to respect foreign key constraints)

-- Delete email processing logs first
DELETE FROM public.email_processing_logs;

-- Delete page OCR results
DELETE FROM public.page_ocr_results;

-- Delete PDF pages
DELETE FROM public.pdf_pages;

-- Delete PDF batches
DELETE FROM public.pdf_batches;

-- Delete pending intakes
DELETE FROM public.pending_intakes;

-- Delete cash transactions
DELETE FROM public.cash_transactions;

-- Delete daily summaries
DELETE FROM public.daily_summaries;

-- Delete workers
DELETE FROM public.workers;

-- Delete vehicles
DELETE FROM public.vehicles;

-- Delete buyers
DELETE FROM public.buyers;

-- Delete quote submissions
DELETE FROM public.quote_submissions;