-- Rebuild proof policies around permissions instead of only the legacy admin role.
DROP POLICY IF EXISTS "anyone can read published proofs" ON public.proofs;
DROP POLICY IF EXISTS "admins can insert proofs" ON public.proofs;
DROP POLICY IF EXISTS "admins can update proofs" ON public.proofs;
DROP POLICY IF EXISTS "admins can delete proofs" ON public.proofs;

CREATE POLICY "anyone can read published proofs"
  ON public.proofs FOR SELECT
  TO anon, authenticated
  USING (published = true OR public.has_permission(auth.uid(), 'proofs.manage'));

CREATE POLICY "proof managers can insert proofs"
  ON public.proofs FOR INSERT
  TO authenticated
  WITH CHECK (public.has_permission(auth.uid(), 'proofs.manage'));

CREATE POLICY "proof managers can update proofs"
  ON public.proofs FOR UPDATE
  TO authenticated
  USING (public.has_permission(auth.uid(), 'proofs.manage'))
  WITH CHECK (public.has_permission(auth.uid(), 'proofs.manage'));

CREATE POLICY "proof managers can delete proofs"
  ON public.proofs FOR DELETE
  TO authenticated
  USING (public.has_permission(auth.uid(), 'proofs.manage'));

-- Rebuild settings policies around settings/status permissions.
DROP POLICY IF EXISTS "admins can insert site settings" ON public.site_settings;
DROP POLICY IF EXISTS "admins can update site settings" ON public.site_settings;
DROP POLICY IF EXISTS "admins can delete site settings" ON public.site_settings;

CREATE POLICY "settings managers can insert site settings"
  ON public.site_settings FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_permission(auth.uid(), 'settings.manage') OR
    public.has_permission(auth.uid(), 'status.manage')
  );

CREATE POLICY "settings managers can update site settings"
  ON public.site_settings FOR UPDATE
  TO authenticated
  USING (
    public.has_permission(auth.uid(), 'settings.manage') OR
    public.has_permission(auth.uid(), 'status.manage')
  )
  WITH CHECK (
    public.has_permission(auth.uid(), 'settings.manage') OR
    public.has_permission(auth.uid(), 'status.manage')
  );

CREATE POLICY "settings managers can delete site settings"
  ON public.site_settings FOR DELETE
  TO authenticated
  USING (
    public.has_permission(auth.uid(), 'settings.manage') OR
    public.has_permission(auth.uid(), 'status.manage')
  );

-- Rebuild notification policies for signed-in admin-panel users.
DROP POLICY IF EXISTS "admins read notifications" ON public.admin_notifications;
DROP POLICY IF EXISTS "admins update notifications" ON public.admin_notifications;
DROP POLICY IF EXISTS "admins delete notifications" ON public.admin_notifications;

CREATE POLICY "admin panel users read notifications"
  ON public.admin_notifications FOR SELECT
  TO authenticated
  USING (
    public.has_permission(auth.uid(), 'proofs.manage') OR
    public.has_permission(auth.uid(), 'settings.manage') OR
    public.has_permission(auth.uid(), 'status.manage') OR
    public.has_permission(auth.uid(), 'users.manage') OR
    public.has_permission(auth.uid(), 'admins.manage') OR
    public.has_permission(auth.uid(), 'audit.view')
  );

CREATE POLICY "admin panel users update notifications"
  ON public.admin_notifications FOR UPDATE
  TO authenticated
  USING (
    public.has_permission(auth.uid(), 'proofs.manage') OR
    public.has_permission(auth.uid(), 'settings.manage') OR
    public.has_permission(auth.uid(), 'status.manage') OR
    public.has_permission(auth.uid(), 'users.manage') OR
    public.has_permission(auth.uid(), 'admins.manage') OR
    public.has_permission(auth.uid(), 'audit.view')
  )
  WITH CHECK (
    public.has_permission(auth.uid(), 'proofs.manage') OR
    public.has_permission(auth.uid(), 'settings.manage') OR
    public.has_permission(auth.uid(), 'status.manage') OR
    public.has_permission(auth.uid(), 'users.manage') OR
    public.has_permission(auth.uid(), 'admins.manage') OR
    public.has_permission(auth.uid(), 'audit.view')
  );

CREATE POLICY "admin panel users delete notifications"
  ON public.admin_notifications FOR DELETE
  TO authenticated
  USING (
    public.has_permission(auth.uid(), 'proofs.manage') OR
    public.has_permission(auth.uid(), 'settings.manage') OR
    public.has_permission(auth.uid(), 'status.manage') OR
    public.has_permission(auth.uid(), 'users.manage') OR
    public.has_permission(auth.uid(), 'admins.manage') OR
    public.has_permission(auth.uid(), 'audit.view')
  );

-- Rebuild storage policies around proof-management permission.
DROP POLICY IF EXISTS "admins can upload proofs" ON storage.objects;
DROP POLICY IF EXISTS "admins can update proofs" ON storage.objects;
DROP POLICY IF EXISTS "admins can delete proofs" ON storage.objects;
DROP POLICY IF EXISTS "admins can read proofs" ON storage.objects;

CREATE POLICY "proof managers can upload proof images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'proofs' AND public.has_permission(auth.uid(), 'proofs.manage'));

CREATE POLICY "proof managers can update proof images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'proofs' AND public.has_permission(auth.uid(), 'proofs.manage'));

CREATE POLICY "proof managers can delete proof images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'proofs' AND public.has_permission(auth.uid(), 'proofs.manage'));

CREATE POLICY "proof managers can read proof images"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'proofs' AND public.has_permission(auth.uid(), 'proofs.manage'));
