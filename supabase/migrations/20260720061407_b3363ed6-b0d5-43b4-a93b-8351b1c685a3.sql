CREATE TABLE public.admin_notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  kind text NOT NULL CHECK (kind IN ('proof_uploaded','proof_published','proof_hidden')),
  proof_id uuid,
  proof_title text NOT NULL,
  message text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, UPDATE, DELETE ON public.admin_notifications TO authenticated;
GRANT ALL ON public.admin_notifications TO service_role;

ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins read notifications" ON public.admin_notifications
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "admins update notifications" ON public.admin_notifications
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "admins delete notifications" ON public.admin_notifications
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX admin_notifications_created_idx ON public.admin_notifications (created_at DESC);
CREATE INDEX admin_notifications_read_idx ON public.admin_notifications (read) WHERE read = false;

CREATE OR REPLACE FUNCTION public.notify_proof_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.admin_notifications (kind, proof_id, proof_title, message)
    VALUES ('proof_uploaded', NEW.id, NEW.title,
      'New proof uploaded: ' || NEW.title);
  ELSIF TG_OP = 'UPDATE' AND NEW.published IS DISTINCT FROM OLD.published THEN
    IF NEW.published THEN
      INSERT INTO public.admin_notifications (kind, proof_id, proof_title, message)
      VALUES ('proof_published', NEW.id, NEW.title,
        'Proof published: ' || NEW.title);
    ELSE
      INSERT INTO public.admin_notifications (kind, proof_id, proof_title, message)
      VALUES ('proof_hidden', NEW.id, NEW.title,
        'Proof hidden: ' || NEW.title);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER proofs_notify_insert
  AFTER INSERT ON public.proofs
  FOR EACH ROW EXECUTE FUNCTION public.notify_proof_event();

CREATE TRIGGER proofs_notify_update
  AFTER UPDATE ON public.proofs
  FOR EACH ROW EXECUTE FUNCTION public.notify_proof_event();

ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_notifications;
ALTER TABLE public.admin_notifications REPLICA IDENTITY FULL;