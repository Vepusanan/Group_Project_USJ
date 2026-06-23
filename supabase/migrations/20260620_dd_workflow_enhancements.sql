-- DD workflow: data room links on items, Q&A tied to checklist items
ALTER TABLE public.dd_checklist_items
  ADD COLUMN IF NOT EXISTS response_type VARCHAR(30) DEFAULT 'upload',
  ADD COLUMN IF NOT EXISTS data_room_document_id UUID REFERENCES public.data_room_documents(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS data_room_folder_id UUID REFERENCES public.data_room_folders(id) ON DELETE SET NULL;

ALTER TABLE public.connection_qa_threads
  ADD COLUMN IF NOT EXISTS checklist_item_id UUID REFERENCES public.dd_checklist_items(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_connection_qa_checklist_item
  ON public.connection_qa_threads (checklist_item_id)
  WHERE checklist_item_id IS NOT NULL;
